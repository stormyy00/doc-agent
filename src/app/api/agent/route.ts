import { NextRequest } from "next/server";
import { z } from "zod";
import { generateText, tool } from "ai";
import { getModel } from "@/utils/ai-provider";
import {
  toolFetchSources,
  toolSummarize,
  toolGenerateEmail,
  toolSendEmail,
} from "@/utils/tools";
import {
  buildOutline,
  composeSections,
  pickCTAs,
  rewriteTone,
} from "@/utils/writer";
import { createLogger } from "@/utils/logger";

// export const dynamic = "force-dynamic";


const BodySchema = z
  .object({
    topic: z.string().trim().min(2),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    title: z.string().trim().min(2).default("Weekly Digest"),
    intro: z.string().trim().optional(),
    newsletter_type: z.string().trim().optional(),
    features: z.array(z.string()).optional(),
    links: z.array(z.string()).optional(),
    location: z.string().trim().optional(),
    content: z.string().trim().optional(),
    key_details: z.string().trim().optional(),
    tone: z.array(z.string()).optional(),
    sections: z.number().int().min(2).max(8).optional(),
    preset: z.string().trim().optional(),
    dryRun: z.boolean().default(true),
    to: z.string().email().optional(),
    provider: z.enum(["gemini"]).default("gemini"),
    // single-article seed (optional)
    article_url: z.string().url().optional(),
    article_html: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.start_date && v.end_date && v.start_date > v.end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "start_date must be ≤ end_date",
      });
    }
  });

export const POST = async (req: NextRequest) => {
  const logger = createLogger();
  logger.step("request:start");

  let json: any;
  try {
    json = await req.json();
    logger.debug("request:body", { json });
  } catch (e) {
    logger.error("request:bad-json", { err: String(e) });
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  // … zod parse
  const parse = BodySchema.safeParse(json);
  if (!parse.success) {
    logger.warn("request:validation-failed", { issues: parse.error.issues });
    return new Response(JSON.stringify({ error: "Invalid body", issues: parse.error.issues }), { status: 400 });
  }

  const data = parse.data;
  logger.step("request:validated", { data });

  const model = getModel(data.provider);
  if (!model) {
    logger.error("model:init-failed");
    return new Response(JSON.stringify({ error: "Failed to initialize AI model" }), { status: 500 });
  }

  // ---- wrap tool executes to log I/O ----

    const tools = {
  fetch_sources: tool({
    description: "Fetch recent content for a topic within a date range.",
    inputSchema: z.object({ topic: z.string().optional(), start_date: z.string().optional(), end_date: z.string().optional() }),
    execute: async (args) => {
      const toolId = logger.toolCall("fetch_sources", args);
      try {
        const out = await toolFetchSources({
          topic: args.topic ?? data.topic,
          start_date: args.start_date ?? data.start_date,
          end_date: args.end_date ?? data.end_date,
        });
        logger.toolResult("fetch_sources", out, toolId, true);
        return out;
      } catch (error) {
        logger.toolError("fetch_sources", error, toolId);
        throw error;
      }
    },
  }),

  summarize: tool({
    description: "Summarize a list of items into short blurbs.",
    inputSchema: z.object({ items: z.array(z.any()), max_chars: z.number().int().optional() }),
    execute: async (args) => {
      const toolId = logger.toolCall("summarize", args);
      try {
        const out = await toolSummarize(args);
        logger.toolResult("summarize", out, toolId, true);
        return out;
      } catch (error) {
        logger.toolError("summarize", error, toolId);
        throw error;
      }
    },
  }),

  // ✅ FIX: use data.topic / data.sections; add logs
  build_outline: tool({
    description: "Create an outline for the newsletter. Returns { outline }.",
    inputSchema: z.object({
      topic: z.string().optional(),
      sections: z.number().int().min(2).max(8).optional(),
    }),
    execute: async (args) => {
      const payload = { topic: args.topic ?? data.topic, sections: args.sections ?? data.sections };
      const toolId = logger.toolCall("build_outline", payload);
      try {
        const out = await buildOutline(payload);
        logger.toolResult("build_outline", out, toolId, true);
        return out;
      } catch (error) {
        logger.toolError("build_outline", error, toolId);
        throw error;
      }
    },
  }),

  compose_sections: tool({
    description: "Compose full sections from outline + factual summaries. Returns { sections }.",
    inputSchema: z.object({
      outline: z.array(z.any()),
      summaries: z.array(z.object({
        title: z.string(), url: z.string(), summary: z.string(), published: z.string(),
      })),
      tone: z.union([z.string(), z.array(z.string())]).optional(),
    }),
    execute: async (args) => {
      const toneValue = args.tone ?? data.tone;
      const toneString = Array.isArray(toneValue) ? toneValue.join(", ") : toneValue;
      const payload = { outline: args.outline, summaries: args.summaries, tone: toneString };
      logger.toolCall("compose_sections", payload);
      const out = await composeSections(payload as any);
      logger.toolResult("compose_sections", out);
      return out;
    },
  }),

  pick_ctas: tool({
    description: "Suggest up to two CTAs. Returns { ctas }.",
    inputSchema: z.object({ topic: z.string().optional() }),
    execute: async (args) => {
      const payload = { topic: args.topic ?? data.topic };
      logger.toolCall("pick_ctas", payload);
      const out = await pickCTAs(payload);
      logger.toolResult("pick_ctas", out);
      return out;
    },
  }),

  rewrite_tone: tool({
    description: 'Rewrite final HTML to a desired tone. Returns { html }.',
    inputSchema: z.object({ html: z.string(), tone: z.string() }),
    execute: async (args) => {
      logger.toolCall("rewrite_tone", args);
      const out = await rewriteTone(args);
      logger.toolResult("rewrite_tone", { html_len: out.html?.length ?? 0 });
      return out;
    },
  }),

  write_newsletter: tool({
    description: "Write a complete HTML newsletter",
    inputSchema: z.object({
      title: z.string().optional(),
      intro: z.string().optional(),
      topic: z.string().optional(),
      newsletter_type: z.string().optional(),
      features: z.array(z.string()).optional(),
      links: z.array(z.string()).optional(),
      location: z.string().optional(),
      content: z.string().optional(),
      key_details: z.string().optional(),
      tone: z.union([z.string(), z.array(z.string())]).optional(),
      sections: z.number().int().min(2).max(8).optional(),
      preset: z.string().optional(),
      article_html: z.string().optional(),
      article_url: z.string().url().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
    }),
    execute: async (args) => {
      const toolId = logger.toolCall("write_newsletter", args);
      try {
        logger.modelCall("generateText:start", { promptMeta: { title: args.title ?? data.title } });

        // Build comprehensive prompt with all new fields
        const toneValue = args.tone ?? data.tone;
        const toneString = Array.isArray(toneValue) ? toneValue.join(", ") : toneValue;
        
        let prompt = `Write a newsletter titled "${args.title ?? data.title}" about ${args.topic ?? data.topic}`;
        
        if (args.newsletter_type ?? data.newsletter_type) {
          prompt += ` (Type: ${args.newsletter_type ?? data.newsletter_type})`;
        }
        
        if (toneString) {
          prompt += ` in a ${toneString} tone`;
        }
        
        if (args.sections ?? data.sections) {
          prompt += ` with ${args.sections ?? data.sections} sections`;
        }
        
        if (args.intro ?? data.intro) {
          prompt += `. Use this introduction: ${args.intro ?? data.intro}`;
        }
        
        if (args.features ?? data.features) {
          const features = args.features ?? data.features;
          if (features && features.length > 0) {
            prompt += `. Include these content features: ${features.join(", ")}`;
          }
        }
        
        if (args.location ?? data.location) {
          prompt += `. Focus on location: ${args.location ?? data.location}`;
        }
        
        if (args.key_details ?? data.key_details) {
          prompt += `. Key details to highlight: ${args.key_details ?? data.key_details}`;
        }
        
        if (args.content ?? data.content) {
          prompt += `. Additional content context: ${args.content ?? data.content}`;
        }
        
        if (args.links ?? data.links) {
          const links = args.links ?? data.links;
          if (links && links.length > 0) {
            prompt += `. Include these relevant links: ${links.join(", ")}`;
          }
        }
        
        if (args.article_url ?? data.article_url) {
          prompt += `. Include content from: ${args.article_url ?? data.article_url}`;
        }
        
        if (args.preset ?? data.preset) {
          prompt += `. Use ${args.preset ?? data.preset} preset style and structure`;
        }

        const r = await generateText({
          model,
          system: "You are a professional newsletter writer. Create a complete, well-structured HTML newsletter document with proper styling, sections, and engaging content.",
          prompt,
          temperature: 0.4,
        });

        logger.modelCall("generateText:finish", { chars: r.text?.length ?? 0 });

        const htmlMatch =
          r.text.match(/<!doctype html[\s\S]*<\/html>/i) ||
          r.text.match(/<html[\s\S]*<\/html>/i);
        const html = (htmlMatch ? htmlMatch[0] : r.text).trim();
        const out = { html };
        logger.toolResult("write_newsletter", { html_len: html.length }, toolId, true);
        return out;
      } catch (error) {
        logger.toolError("write_newsletter", error, toolId);
        throw error;
      }
    },
  }),

  generate_email: tool({
    description: "Render HTML email from items",
    inputSchema: z.object({
      title: z.string().optional(),
      intro: z.string().optional(),
      newsletter_type: z.string().optional(),
      features: z.array(z.string()).optional(),
      links: z.array(z.string()).optional(),
      location: z.string().optional(),
      content: z.string().optional(),
      key_details: z.string().optional(),
      tone: z.union([z.string(), z.array(z.string())]).optional(),
      sections: z.number().int().min(2).max(8).optional(),
      preset: z.string().optional(),
      items: z.array(z.any()),
      ctas: z.array(z.object({ title: z.string(), text: z.string(), url: z.string() })).optional(),
    }),
    execute: async (args) => {
      const toneValue = args.tone ?? data.tone;
      const toneString = Array.isArray(toneValue) ? toneValue.join(", ") : toneValue;
      
      const payload = {
        title: args.title ?? data.title,
        intro: args.intro ?? (data.intro || `Curated updates on ${data.topic}.`),
        newsletter_type: args.newsletter_type ?? data.newsletter_type,
        features: args.features ?? data.features,
        links: args.links ?? data.links,
        location: args.location ?? data.location,
        content: args.content ?? data.content,
        key_details: args.key_details ?? data.key_details,
        tone: toneString,
        sections: args.sections ?? data.sections,
        preset: args.preset ?? data.preset,
        items: args.items,
        ctas: args.ctas,
      };
      logger.toolCall("generate_email", { ...payload, items_len: payload.items?.length ?? 0 });
      const out = await toolGenerateEmail(payload as any);
      logger.toolResult("generate_email", { html_len: out?.html?.length ?? 0 });
      return out;
    },
  }),
    // … keep your other tools the same pattern
  } as const;

  // ---- run planner ----
  logger.step("planner:start");
  const result = await generateText({
    model,
    system: [
      "You are a professional newsletter agent that creates high-quality, data-driven newsletters.",
      "IMPORTANT: You MUST use the structured workflow for the best results. Do NOT skip to write_newsletter() immediately.",
      "REQUIRED workflow (follow these steps in order):",
      "1. ALWAYS start by calling fetch_sources() to get recent, relevant content for the topic and date range",
      "2. Then call summarize() to create concise summaries of the fetched content",
      "3. Next, call build_outline() to create a structured outline based on the topic and sections",
      "4. Then call compose_sections() to write full sections using the outline and summaries",
      "5. Optionally call pick_ctas() to suggest relevant call-to-action items",
      "6. Finally, call generate_email() to create the final HTML newsletter",
      "Only use write_newsletter() as a last resort fallback if the structured approach completely fails.",
      "The structured approach produces much better, more factual newsletters with real data and proper organization.",
      "Never finish without returning an HTML document.",
    ].join("\n"),
    messages: [{
      role: "user",
      content: `Create a comprehensive, data-driven newsletter about ${data.topic} for ${data.start_date || "(no start)"} to ${data.end_date || "(no end)"} titled ${data.title}.` +
        ` Please use the structured workflow: fetch recent sources, summarize them, build an outline, compose sections, and generate the final newsletter.` +
        (data.newsletter_type ? ` Newsletter type: ${data.newsletter_type}.` : "") +
        (data.tone ? ` Tone: ${Array.isArray(data.tone) ? data.tone.join(", ") : data.tone}.` : "") +
        (data.sections ? ` Create ${data.sections} sections.` : "") +
        (data.features && data.features.length > 0 ? ` Include these content features: ${data.features.join(", ")}.` : "") +
        (data.location ? ` Focus on location: ${data.location}.` : "") +
        (data.key_details ? ` Key details to highlight: ${data.key_details}.` : "") +
        (data.content ? ` Additional content context: ${data.content}.` : "") +
        (data.links && data.links.length > 0 ? ` Include these relevant links: ${data.links.join(", ")}.` : "") +
        (data.preset ? ` Use ${data.preset} preset style and structure.` : "") +
        (data.article_url ? ` Also include content from: ${data.article_url}` : ""),
    }],
    tools,
    temperature: 0.2,
  });
  logger.step("planner:finish", { steps: (result.steps ?? []).length });

  // concise step summary
  for (const [i, s] of Array.from((result.steps ?? []).entries())) {
    logger.debug("planner:step", {
      idx: i,
      finishReason: (s as any).finishReason,
      toolCalls: ((s as any).toolCalls || []).map((c: any) => c.toolName),
      toolResults: ((s as any).toolResults || []).map((r: any) => r.toolName),
    });
  }

  // ---- extract html (as you already do) ----
  const steps = result.steps ?? [];
  const toolResults = steps.flatMap((s: any) => s.toolResults || []);
  const fromWriter = toolResults.find((r: any) => r.toolName === "write_newsletter" && r.result?.html);
  const fromBuilder = toolResults.find((r: any) => r.toolName === "generate_email" && r.result?.html);
  const fromGenerateEmail = toolResults.find((r: any) => r.toolName === "generate_email" && r.result?.html);

  let html: string | undefined =
    fromWriter?.result?.html || fromBuilder?.result?.html || fromGenerateEmail?.result?.html;

  logger.info("planner:result-picked", {
    source:
      (fromWriter && "write_newsletter") ||
      (fromBuilder && "generate_email") ||
      (fromGenerateEmail && "generate_email") ||
      "none",
    html_len: html?.length ?? 0,
  });

  // … your direct-writer guardrail and summaries→generate fallback (log both)
  if (!html) {
    logger.step("guardrail:writer:direct");
    try {
      const direct = await (tools as any).write_newsletter.execute({
        title: data.title, 
        intro: data.intro, 
        topic: data.topic, 
        newsletter_type: data.newsletter_type,
        features: data.features,
        links: data.links,
        location: data.location,
        content: data.content,
        key_details: data.key_details,
        tone: data.tone,
        sections: data.sections,
        preset: data.preset,
        article_html: data.article_html, 
        article_url: data.article_url,
        start_date: data.start_date, 
        end_date: data.end_date,
      });
      html = direct.html;
      logger.info("guardrail:writer:ok", { html_len: html?.length ?? 0 });
    } catch (e) {
      logger.warn("guardrail:writer:failed", { err: String(e) });
    }
  }

  if (!html) {
    logger.step("fallback:summaries->generate_email");
    try {
      let { items } = await toolFetchSources({ topic: data.topic, start_date: data.start_date, end_date: data.end_date });
      if (!items?.length) {
        const retry = await toolFetchSources({ topic: "", start_date: data.start_date, end_date: data.end_date });
        items = retry.items;
      }
      const { summaries } = await toolSummarize({ items, max_chars: 400 });
      const toneValue = data.tone;
      const toneString = Array.isArray(toneValue) ? toneValue.join(", ") : toneValue;
      
      const out = await toolGenerateEmail({
        title: data.title,
        intro: data.intro || `Curated updates on ${data.topic}.`,
        newsletter_type: data.newsletter_type,
        features: data.features,
        links: data.links,
        location: data.location,
        content: data.content,
        key_details: data.key_details,
        tone: toneString,
        sections: data.sections,
        preset: data.preset,
        items: summaries,
      } as any);
      html = out.html;
      logger.info("fallback:ok", { items: items?.length ?? 0, html_len: html?.length ?? 0 });
    } catch (e) {
      logger.error("fallback:failed", { err: String(e) });
      return new Response(
        JSON.stringify({ error: "No HTML produced by the agent and fallback failed.", steps }),
        { status: 502 }
      );
    }
  }

  // optional send
  const payload: any = { 
    reqId: logger.id, 
    html, 
    debug: logger.dump(),
    logs: logger.dump(), // Include detailed logs for client
    logsPlain: logger.dumpPlain(), // Include plain text logs for easy reading
    totalDuration: logger.time(),
    logStats: {
      total: logger.dump().length,
      byLevel: logger.dump().reduce((acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      toolCalls: logger.dump().filter(log => log.toolCall).length,
      toolResults: logger.dump().filter(log => log.toolResult).length,
    }
  };
  if (!data.dryRun && data.to && html) {
    logger.step("send:begin", { to: data.to });
    try {
      const send = await toolSendEmail({ to: data.to, subject: data.title, html });
      payload.send = send;
      logger.info("send:ok");
    } catch (e) {
      payload.sendError = String(e);
      logger.warn("send:failed", { err: String(e) });
    }
  }

  logger.done({ html_len: html?.length ?? 0 });
  return new Response(JSON.stringify(payload), { status: 200 });
}

