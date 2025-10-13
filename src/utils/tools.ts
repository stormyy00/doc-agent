// next/lib/tools.ts
type Post = {
  id: number;
  title: string;
  url: string;
  published: string; // YYYY-MM-DD
  content: string;
};

const USE_MOCK = process.env.MOCK_TOOLS === "true" || true; // Default to mock for development
const FLASK_URL = process.env.FLASK_URL || "http://localhost:5001";

/** ---------- MOCK DATA + HELPERS ---------- **/
type FooterSettings = {
  orgName: string;
  addressLine1?: string;
  addressLine2?: string;
  unsubscribeUrl?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  style?: string; // inline CSS applied to footer wrapper
  customHtml?: string; // if provided, used as-is (trusted in mock only)
};

let MOCK_FOOTER_SETTINGS: FooterSettings = {
  orgName: "Acme Publishing Co.",
  addressLine1: "123 Market Street",
  addressLine2: "San Francisco, CA 94105",
  unsubscribeUrl: "https://example.com/unsubscribe",
  websiteUrl: "https://example.com",
  twitterUrl: "https://twitter.com/example",
  linkedinUrl: "https://linkedin.com/company/example",
  style: "color:#666;font-size:12px;line-height:1.4;",
};

function renderFooterHtml(settings: FooterSettings): string {
  if (settings.customHtml) return settings.customHtml;
  const lines: string[] = [];
  lines.push(`<strong>${escapeHtml(settings.orgName)}</strong>`);
  if (settings.addressLine1) lines.push(escapeHtml(settings.addressLine1));
  if (settings.addressLine2) lines.push(escapeHtml(settings.addressLine2));
  const links: string[] = [];
  if (settings.websiteUrl) links.push(`<a href="${escapeHtml(settings.websiteUrl)}" target="_blank">Website</a>`);
  if (settings.twitterUrl) links.push(`<a href="${escapeHtml(settings.twitterUrl)}" target="_blank">Twitter</a>`);
  if (settings.linkedinUrl) links.push(`<a href="${escapeHtml(settings.linkedinUrl)}" target="_blank">LinkedIn</a>`);
  const linksHtml = links.length ? `<div style="margin-top:6px;">${links.join(" · ")}</div>` : "";
  const unsub = settings.unsubscribeUrl
    ? `<div style="margin-top:6px;font-size:12px;">You can <a href="${escapeHtml(settings.unsubscribeUrl)}" target="_blank">unsubscribe here</a>.</div>`
    : "";
  const style = `margin-top:16px;${settings.style || "color:#666;font-size:12px;line-height:1.4;"}`;
  return `
  <hr/>
  <footer style="${style}">
    <div>${lines.join("<br/>")}</div>
    ${linksHtml}
    ${unsub}
  </footer>`;
}
const MOCK_POSTS: Post[] = [
  {
    id: 1,
    title: "Scaling Your API with Kong",
    url: "https://example.com/kong-scaling",
    published: "2025-10-13",
    content:
      "Kong can sit in front of Express to handle rate limits, auth, and routing. This comprehensive guide shows you how to implement Kong as an API gateway for better scalability and security.",
  },
  {
    id: 2,
    title: "Next.js + Flask: A Practical Bridge",
    url: "https://example.com/next-flask",
    published: "2025-10-15",
    content:
      "Use Next.js App Router for UI, Flask for data/ML tools. Keep tools idempotent and maintain clean separation between frontend and backend concerns.",
  },
  {
    id: 3,
    title: "Photo Organizer UX Patterns",
    url: "https://example.com/photo-ux",
    published: "2025-10-16",
    content:
      "Three patterns that make photo management feel magical: batching, previews, undo. Learn how to create intuitive interfaces for media management.",
  },
  {
    id: 4,
    title: "AI-Powered Code Review Tools",
    url: "https://example.com/ai-code-review",
    published: "2025-10-17",
    content:
      "New AI tools are revolutionizing code review processes. From automated bug detection to style suggestions, these tools are becoming essential for development teams.",
  },
  {
    id: 5,
    title: "Microservices Architecture Best Practices",
    url: "https://example.com/microservices-best-practices",
    published: "2025-10-18",
    content:
      "Building scalable microservices requires careful planning. Learn about service boundaries, data consistency, and communication patterns that work in production.",
  },
  {
    id: 6,
    title: "React Server Components Deep Dive",
    url: "https://example.com/react-server-components",
    published: "2025-10-19",
    content:
      "React Server Components are changing how we think about React applications. Understand the benefits, limitations, and practical implementation strategies.",
  },
  {
    id: 7,
    title: "Git and GitHub Workshop at UCR",
    url: "https://example.com/git-github-workshop",
    published: "2025-10-15",
    content:
      "Learn the fundamentals of version control with Git and GitHub. This hands-on workshop covers branching, merging, pull requests, and collaborative development workflows.",
  },
  {
    id: 8,
    title: "OpenAI Sora 2 Launch Analysis",
    url: "https://example.com/sora-2-analysis",
    published: "2025-10-16",
    content:
      "OpenAI's latest Sora 2 model represents a significant advancement in AI video generation. Explore the technical improvements and potential applications in creative industries.",
  },
  {
    id: 9,
    title: "Understanding AI Agents in Modern Development",
    url: "https://example.com/ai-agents-guide",
    published: "2025-10-17",
    content:
      "AI agents are becoming increasingly sophisticated tools for automation and decision-making. Learn about different types of agents and their practical applications in software development.",
  },
  {
    id: 10,
    title: "BCOE Donation Dinner and Networking Event",
    url: "https://example.com/bcoe-donation-dinner",
    published: "2025-10-14",
    content:
      "Join us for the annual BCOE donation dinner to support student scholarships and programs. Network with alumni, faculty, and industry professionals while contributing to the future of engineering education.",
  },
];

function inRange(p: Post, start?: string, end?: string) {
  const d = new Date(p.published);
  if (start) {
    const s = new Date(start);
    if (d < s) return false;
  }
  if (end) {
    const e = new Date(end);
    if (d > e) return false;
  }
  return true;
}

/** ---------- TOOLS API (SAME SHAPES AS BEFORE) ---------- **/

export const toolFetchSources = async (args: {
  topic: string;
  start_date?: string;
  end_date?: string;
}) => {
  if (USE_MOCK) {
    const q = (args.topic ?? "").trim().toLowerCase();
    const keywords = q ? q.split(/\s+/).filter(Boolean) : [];
    const FILL_TO = 5; // how many items you want in the letter

    const matchesKeyword = (p: Post) =>
      keywords.length === 0 ||
      keywords.some(
        (k) =>
          p.title.toLowerCase().includes(k) ||
          p.content.toLowerCase().includes(k)
      );

    const inRangeItems = MOCK_POSTS.filter((p) =>
      inRange(p, args.start_date, args.end_date)
    );

    // 1) take keyword matches
    const matched = inRangeItems.filter(matchesKeyword);

    // 2) fill the rest with other in-range recents you haven't already included
    const rest = inRangeItems
      .filter((p) => !matched.some((m) => m.id === p.id))
      .sort((a, b) => +new Date(b.published) - +new Date(a.published));

    const items = [...matched, ...rest].slice(0, FILL_TO);

    console.log("toolFetchSources returning items:", items);
    return { items };
  }

  const res = await fetch(`${FLASK_URL}/fetch_sources`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error("fetch_sources failed");
  return res.json();
};

export const toolSummarize = async (args: {
  items: any[];
  max_chars?: number;
}) => {
  if (USE_MOCK) {
    const max = args.max_chars ?? 400;
    const summaries = (args.items || []).map((it: Post) => {
      // take up to the first two sentences from content
      const sentences = it.content.split(".").map(s => s.trim()).filter(Boolean);
      const base = `${it.title}: ${[sentences[0], sentences[1]].filter(Boolean).join(". ")}.`;
      const summary =
        base.length > max ? base.slice(0, max - 1).trimEnd() + "…" : base;
      return {
        id: it.id,
        title: it.title,
        url: it.url,
        summary,
        published: it.published,
      };
    });
    console.log("toolSummarize returning summaries:", summaries);
    return { summaries };
  }

  const res = await fetch(`${FLASK_URL}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
    if (!res.ok) throw new Error("summarize failed");
  return res.json();
};

export const toolGenerateEmail = async (args: {
  title: string;
  intro?: string;
  newsletter_type?: string;
  features?: string[];
  links?: string[];
  location?: string;
  content?: string;
  key_details?: string;
  tone?: string;
  sections?: number;
  preset?: string;
  items: Array<
    | { title: string; url: string; summary: string; published: string } // summaries
    | { id?: string|number; title: string; bodyHtml?: string; key_takeaways?: string[] } // sections
  >;
  ctas?: Array<{ title: string; text: string; url: string }>;
}) => {
  if (USE_MOCK) {
    const { 
      title, 
      intro = "Here's what's new this week.", 
      newsletter_type,
      features,
      links,
      location,
      content,
      key_details,
      tone,
      sections,
      preset,
      items = [], 
      ctas = [] 
    } = args;

    // Build enhanced intro with new fields
    let enhancedIntro = intro;
    if (newsletter_type) {
      enhancedIntro += ` This ${newsletter_type} newsletter`;
    }
    if (location) {
      enhancedIntro += ` focuses on ${location}`;
    }
    if (tone) {
      enhancedIntro += ` with a ${tone} tone`;
    }
    if (key_details) {
      enhancedIntro += `. Key highlights: ${key_details}`;
    }
    if (content) {
      enhancedIntro += `. ${content}`;
    }

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;">
  <h1 style="margin:0 0 8px;">${escapeHtml(title)}</h1>
  <p style="color:#555;">${escapeHtml(enhancedIntro)}</p>
  ${features && features.length > 0 ? `
  <div style="margin:16px 0;padding:12px;background:#f5f5f5;border-radius:6px;">
    <h3 style="margin:0 0 8px;">Content Features</h3>
    <ul style="margin:0;padding-left:20px;">
      ${features.map(f => `<li>${escapeHtml(f)}</li>`).join("")}
    </ul>
  </div>` : ""}
  ${links && links.length > 0 ? `
  <div style="margin:16px 0;padding:12px;background:#e8f4fd;border-radius:6px;">
    <h3 style="margin:0 0 8px;">Related Links</h3>
    <ul style="margin:0;padding-left:20px;">
      ${links.map(l => `<li><a href="${escapeHtml(l)}" target="_blank">${escapeHtml(l)}</a></li>`).join("")}
    </ul>
  </div>` : ""}
  <hr/>
  ${items.map((it: any) => {
      // sections path
      if (it.bodyHtml) {
        const bullets =
          Array.isArray(it.key_takeaways) && it.key_takeaways.length
            ? `<ul style="margin:8px 0 0 18px;">${it.key_takeaways
                .map((k: string) => `<li>${escapeHtml(k)}</li>`)
                .join("")}</ul>`
            : "";
        return `<section style="margin:20px 0;">
          <h2 style="margin:0 0 8px;">${escapeHtml(it.title)}</h2>
          ${it.bodyHtml}
          ${bullets}
        </section>`;
      }
      // summaries path
      return `<div style="margin:16px 0;">
        <h3 style="margin:0 0 4px;">${escapeHtml(it.title)}</h3>
        <p style="margin:0 0 4px;color:#333;">${escapeHtml(it.summary || "")}</p>
        ${it.url ? `<a href="${it.url}" style="font-size:14px;">Read more →</a>` : ""}
        ${it.published ? `<div style="font-size:12px;color:#777;">Published: ${escapeHtml(it.published)}</div>` : ""}
      </div>`;
    }).join("")}
  ${Array.isArray(ctas) && ctas.length ? `
    <hr/>
    <section style="margin:20px 0;">
      <h3>Keep going</h3>
      ${ctas.map(c => `<p><strong>${escapeHtml(c.title)}:</strong> ${escapeHtml(c.text)} <a href="${c.url}">→</a></p>`).join("")}
    </section>` : ""}
  ${renderFooterHtml(MOCK_FOOTER_SETTINGS)}
</body></html>`;
    return { html };
  }

  // real service
  const res = await fetch(`${FLASK_URL}/generate_email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error("generate_email failed");
  return res.json();
};

export const toolSendEmail = async (args: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (USE_MOCK) {
    // Just pretend we sent it
    return { ok: true, provider: "mock", to: args.to, subject: args.subject };
  }

  const res = await fetch(`${FLASK_URL}/send_email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error("send_email failed");
  return res.json();
};

/** Footer management tools (mock) **/
export const toolSetFooter = async (args: Partial<FooterSettings> & { reset?: boolean }) => {
  if (!USE_MOCK) {
    // In a real implementation, forward to backend service
    // For now, mirror mock behavior client-side
  }
  if (args.reset) {
    MOCK_FOOTER_SETTINGS = {
      orgName: "Acme Publishing Co.",
      addressLine1: "123 Market Street",
      addressLine2: "San Francisco, CA 94105",
      unsubscribeUrl: "https://example.com/unsubscribe",
      websiteUrl: "https://example.com",
      twitterUrl: "https://twitter.com/example",
      linkedinUrl: "https://linkedin.com/company/example",
    };
  } else {
    MOCK_FOOTER_SETTINGS = { ...MOCK_FOOTER_SETTINGS, ...args };
  }
  return { ok: true, settings: MOCK_FOOTER_SETTINGS, html: renderFooterHtml(MOCK_FOOTER_SETTINGS) };
};

export const toolGetFooter = async () => {
  return { settings: MOCK_FOOTER_SETTINGS, html: renderFooterHtml(MOCK_FOOTER_SETTINGS) };
};

/** ---------- tiny util ---------- **/
const escapeHtml = (s: string) => {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};
