"use client";

import { useState } from "react";
import RunAgentForm from "@/components/agent-form";
import { readUIMessageStream } from "ai";
import { Spinner } from "./ui/spinner";
import LogCard from "./logs";
import EnhancedLogCard from "./enhanced-logs";
import { LogEntry } from "@/types/log";
import ResultDocument from "./result-document";
import { Stepper } from "./ui/stepper";

const steps = [
  { title: "Step 1", description: "Fill out the form" },
  { title: "Step 2", description: "Review" },
  { title: "Step 3", description: "Send email" },
]

const Output = () => {
  const [html, setHtml] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [enhancedLogs, setEnhancedLogs] = useState<LogEntry[]>([]);
  const [logStats, setLogStats] = useState<any>(null);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sendSubject, setSendSubject] = useState("");
  const [currentStep, setCurrentStep] = useState(0)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Newsletter Drafting Tool</h1>
       <Stepper steps={steps} currentStep={currentStep} onStepChange={setCurrentStep} />
    
      {currentStep === 0 && (
      <RunAgentForm
        onRun={async (payload) => {
          setLoading(true);
          setError(null);
          setHtml(null);
          setLog([]);
          setEnhancedLogs([]);
          setLogStats(null);
          setTotalDuration(null);
          try {
            const res = await fetch("/api/agent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) {
              setError(json?.error || "Request failed");
            } else {
              setHtml(json.html ?? null);
              if (!sendSubject) setSendSubject(payload.title || "");
              // Set enhanced logs from API response
              if (Array.isArray(json?.logs)) {
                setEnhancedLogs(json.logs);
              }
              if (json?.logStats) {
                setLogStats(json.logStats);
              }
              if (json?.totalDuration) {
                setTotalDuration(json.totalDuration);
              }
            }
            if (Array.isArray(json?.debug)) setLog(json.debug);
            setCurrentStep(1);
          } catch (e: any) {
            setError(String(e?.message || e));
          } finally {
            setLoading(false);
          }
        }}
        onStreamRun={async (payload) => {
          setLoading(true);
          setError(null);
          setHtml(null);
          setLog([]);
          setEnhancedLogs([]);
          setLogStats(null);
          setTotalDuration(null);

          try {
            const res = await fetch("/api/agent/stream", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) {
              const err = await res.text().catch(() => "");
              throw new Error(err || `HTTP ${res.status}`);
            }

            let sawHtml = false;

            // Use the response body stream to satisfy types
            for await (const msg of readUIMessageStream({
              stream: (res as any).body,
            } as any) as any) {
              if (msg.type === "start") setLog((l) => [...l, "start"]);
              if (msg.type === "start-step")
                setLog((l) => [...l, "start-step"]);
              if (msg.type === "finish-step")
                setLog((l) => [...l, "finish-step"]);
              if (msg.type === "error") setError("Stream error");
              if (msg.type === "finish") {
                if (!sawHtml) {
                  // optional fallback to non-stream endpoint
                  const r = await fetch("/api/agent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  const j = await r.json();
                  if (r.ok && j.html) setHtml(j.html);
                  else setError(j?.error || "Agent finished without HTML.");
                }
              }

              for (const part of (msg as any).parts ?? []) {
                if (part.type === "tool-invocation") {
                  setLog((l) => [...l, `tool-call: ${part.toolName}`]);
                }
                if (part.type === "tool-result") {
                  setLog((l) => [...l, `tool-result: ${part.toolName}`]);

                  // capture either path
                  if (
                    (part.toolName === "generate_email" ||
                      part.toolName === "write_newsletter") &&
                    part.result &&
                    typeof part.result.html === "string"
                  ) {
                    sawHtml = true;
                    setHtml(part.result.html);
                    if (!sendSubject) setSendSubject(payload.title || "");
                  }
                }
                // optionally show text tokens:
                // if (part.type === "text-delta") setLog((l) => [...l, part.textDelta]);
              }
            }
          } catch (e: any) {
            setError(String(e?.message || e));
          } finally {
            setLoading(false);
          }
        }}
      />
      )}

      {loading && (
        <p className="mt-4 border rounded p-2 text-center">
          <Spinner className="inline-block mr-2" /> Running agent
        </p>
      )}
      {error && <p className="mt-2 text-red-600">{error}</p>}

      {currentStep === 1 && html && (
        <ResultDocument
          html={html}
          setError={setError}
          sendSubject={sendSubject}
          setSendSubject={setSendSubject}
        />
      )}




      {enhancedLogs.length > 0 && (
        <div className="mt-6">
          <EnhancedLogCard
            title="Enhanced Agent Logs"
            logs={enhancedLogs}
            logStats={logStats}
            totalDuration={totalDuration || undefined}
          />
        </div>
      )}

      {/* {log.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Legacy Debug Logs ({log.length} entries)
          </summary>
          <LogCard title="Agent Debug" logs={log} />
        </details>
      )} */}
    </div>
  );
};

export default Output;
