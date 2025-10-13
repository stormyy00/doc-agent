import React, { useState } from "react";

interface ResultDocumentProps {
  html: string;
  sendSubject: string;
  setSendSubject: (value: string) => void;
  setError: (error: string | null) => void;
}

const ResultDocument = ({
  html,
  setError,
  sendSubject,
  setSendSubject,
}: ResultDocumentProps) => {
  const [sendTo, setSendTo] = useState("");
  const [sending, setSending] = useState(false);
  return (
    <>
      <h2 className="text-xl font-semibold mt-6">Preview</h2>
      <iframe className="w-full h-[600px] border mt-2" srcDoc={html} />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">To</label>
          <input
            type="email"
            className="w-full px-2 py-1 border rounded"
            placeholder="recipient@example.com"
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-zinc-500 mb-1">Subject</label>
          <input
            type="text"
            className="w-full px-2 py-1 border rounded"
            placeholder="Newsletter subject"
            value={sendSubject}
            onChange={(e) => setSendSubject(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-2">
        <button
          className="px-3 py-2 text-sm border rounded disabled:opacity-50"
          disabled={sending || !sendTo || !sendSubject}
          onClick={async () => {
            if (!html) return;
            setSending(true);
            setError(null);
            try {
              const res = await fetch("/api/agent/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  to: sendTo,
                  subject: sendSubject,
                  html,
                }),
              });
              const j = await res.json();
              if (!res.ok) throw new Error(j?.error || "Send failed");
            } catch (e: any) {
              setError(String(e?.message || e));
            } finally {
              setSending(false);
            }
          }}
        >
          {sending ? "Sending..." : "Send Email"}
        </button>
      </div>
    </>
  );
};

export default ResultDocument;
