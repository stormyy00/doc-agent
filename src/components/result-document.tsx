import React, { useState } from "react";
import Footer from "./footer";

interface FooterDetails {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  copyright?: string;
  unsubscribeText?: string;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

interface ResultDocumentProps {
  html: string;
  sendSubject: string;
  setSendSubject: (value: string) => void;
  setError: (error: string | null) => void;
  footerDetails?: FooterDetails;
  themeColors?: ThemeColors;
}

const ResultDocument = ({
  html,
  setError,
  sendSubject,
  setSendSubject,
  footerDetails,
  themeColors,
}: ResultDocumentProps) => {
  const [sendTo, setSendTo] = useState("");
  const [sending, setSending] = useState(false);

  // Apply theme colors to the HTML
  const styledHtml = themeColors ? `
    <style>
      :root {
        --primary: ${themeColors.primary};
        --secondary: ${themeColors.secondary};
        --accent: ${themeColors.accent};
        --background: ${themeColors.background};
        --foreground: ${themeColors.foreground};
      }
      body {
        background-color: ${themeColors.background};
        color: ${themeColors.foreground};
      }
      .primary { color: ${themeColors.primary}; }
      .bg-primary { background-color: ${themeColors.primary}; }
      .border-primary { border-color: ${themeColors.primary}; }
      .accent { color: ${themeColors.accent}; }
      .bg-accent { background-color: ${themeColors.accent}; }
      a { color: ${themeColors.primary}; }
      h1, h2, h3, h4, h5, h6 { color: ${themeColors.foreground}; }
      .btn-primary {
        background-color: ${themeColors.primary};
        color: ${themeColors.background};
        border: 1px solid ${themeColors.primary};
      }
      .btn-secondary {
        background-color: transparent;
        color: ${themeColors.primary};
        border: 1px solid ${themeColors.primary};
      }
    </style>
    ${html}
  ` : html;

  return (
    <>
      <h2 className="text-xl font-semibold mt-6">Preview</h2>
      <iframe className="w-full h-[600px] border mt-2" srcDoc={styledHtml} />
      
      {/* Footer Preview */}
      {footerDetails && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Footer Preview</h3>
          <Footer details={footerDetails} showFooter={true} />
        </div>
      )}

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
