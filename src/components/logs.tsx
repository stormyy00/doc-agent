"use client";

import { useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { Level, LogEntry, LogLine } from "@/types/log";
import { logs as logColors } from "@/data/logs";


function fmtTs(ts?: string | number) {
  if (ts == null) return "";
  try {
    const d = typeof ts === "number" ? new Date(ts) : new Date(String(ts));
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString();
  } catch {
    return "";
  }
}

function levelBadge(level?: Level) {
  const l = level || "info";
  const colorConfig = logColors[l];
  return (
    <Badge 
      variant="outline" 
      className={`capitalize ${colorConfig.bg} ${colorConfig.fg} ${colorConfig.border} border`}
    >
      {l}
    </Badge>
  );
}

function toolCallBadge(toolName: string, success?: boolean) {
  const variant = success === false ? "destructive" : "default";
  const icon = success === false ? "❌" : "🔧";
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <span>{icon}</span>
      <span className="font-mono text-xs">{toolName}</span>
    </Badge>
  );
}

function durationBadge(duration: number) {
  const color = duration > 5000 ? "bg-red-100 text-red-800" : 
                duration > 1000 ? "bg-yellow-100 text-yellow-800" : 
                "bg-green-100 text-green-800";
  return (
    <Badge variant="outline" className={`text-xs ${color}`}>
      {duration}ms
    </Badge>
  );
}

function stringifyData(data: unknown) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export function LogCard({
  title = "Logs",
  logs,
  className,
  maxHeight = 320,
  autoScroll = true,
}: {
  title?: string;
  logs: LogEntry[];
  className?: string;
  maxHeight?: number;
  autoScroll?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const textBlob = useMemo(() => {
    return logs
      .map((entry) => {
        if (typeof entry === "string") return entry;
        const ts = fmtTs(entry.ts);
        const lvl = (entry.level || "info").toUpperCase();
        const data = entry.data ? ` ${stringifyData(entry.data)}` : "";
        return `${ts ? `[${ts}] ` : ""}${lvl}: ${entry.msg}${data}`;
      })
      .join("\n");
  }, [logs]);

  useEffect(() => {
    if (!autoScroll || !bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [logs, autoScroll]);

  const onCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(textBlob);
      } else {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = textBlob;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch {
      // noop; you can add a toast here if you use one
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCopy} title="Copy all logs">
            Copy
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3">
        <ScrollArea className="max-h-[320px] overflow-y-auto">  
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No logs yet.
            </div>
          ) : (
            <ul className="space-y-3 text-sm font-mono">
              {logs.map((entry, idx) => {
                if (typeof entry === "string") {
                  return (
                    <li key={idx} className="whitespace-pre-wrap break-words">
                      {entry}
                    </li>
                  );
                }
                const ts = fmtTs(entry.ts);
                const logEntry = entry as LogLine;
                
                return (
                  <li key={idx} className="space-y-2">
                    {/* Tool Call Display */}
                    {logEntry.toolCall && (
                      <div className={`border-l-4 pl-3 p-2 rounded-r ${logColors.debug.bg} ${logColors.debug.border}`}>
                        <div className="flex items-center gap-2 mb-2">
                          {toolCallBadge(logEntry.toolCall.name)}
                          <span className="text-xs text-muted-foreground">
                            {ts}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">Input:</div>
                        <pre className="bg-white/80 p-2 rounded text-xs overflow-x-auto border">
                          {stringifyData(logEntry.toolCall.input)}
                        </pre>
                      </div>
                    )}
                    
                    {/* Tool Result Display */}
                    {logEntry.toolResult && (
                      <div className={`border-l-4 pl-3 p-2 rounded-r ${
                        logEntry.toolResult.success 
                          ? `${logColors.info.bg} ${logColors.info.border}` 
                          : `${logColors.error.bg} ${logColors.error.border}`
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {toolCallBadge(logEntry.toolResult.name, logEntry.toolResult.success)}
                          {durationBadge(logEntry.toolResult.duration)}
                          <span className="text-xs text-muted-foreground">
                            {ts}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">Output:</div>
                        <pre className={`p-2 rounded text-xs overflow-x-auto border ${
                          logEntry.toolResult.success 
                            ? 'bg-white/80' 
                            : `${logColors.error.bg}`
                        }`}>
                          {stringifyData(logEntry.toolResult.output)}
                        </pre>
                      </div>
                    )}
                    
                    {/* Regular Log Display */}
                    {!logEntry.toolCall && !logEntry.toolResult && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {levelBadge(logEntry.level)}
                          {ts && (
                            <span className="text-xs text-muted-foreground">
                              {ts}
                            </span>
                          )}
                          {logEntry.duration && durationBadge(logEntry.duration)}
                          <span className="whitespace-pre-wrap break-words">
                            {logEntry.msg}
                          </span>
                        </div>
                        {logEntry.data != null && (
                          <pre className="bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                            {stringifyData(logEntry.data)}
                          </pre>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
              <div ref={bottomRef} />
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default LogCard;
