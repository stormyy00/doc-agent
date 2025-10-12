// src/utils/writer.ts
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { getModel } from "@/utils/ai-provider";

// Schemas
const OutlineItem = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  blurb: z.string().optional(),
  word_goal: z.number().int().min(100).max(400).optional(),
});
const OutlineSchema = z.array(OutlineItem).min(2).max(8);

const SectionItem = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  bodyHtml: z.string().min(1),
  key_takeaways: z.array(z.string()).default([]),
});
const SectionsSchema = z.array(SectionItem).min(1);

const CTASchema = z.array(
  z.object({ title: z.string(), text: z.string(), url: z.string().url() })
).max(2);

export async function buildOutline(args: { topic: string; sections?: number }) {
  const model = getModel("gemini"); // or "openai" per your provider
  if (!model) throw new Error("Model not available");
  const maxSections = Math.max(2, Math.min(args.sections ?? 4, 8));

  const { object } = await generateObject({
    model,
    schema: OutlineSchema,
    prompt: [
      `You are an editor. Create an outline for a weekly newsletter on "${args.topic}".`,
      `Return ONLY JSON: [{ id, title, blurb, word_goal }].`,
      `3–6 sections recommended; blurb is one sentence.`,
    ].join("\n"),
  });

  return { outline: object.slice(0, maxSections) };
}

export async function composeSections(args: {
  outline: z.infer<typeof OutlineSchema>;
  summaries: Array<{ title: string; url: string; summary: string; published: string }>;
  tone?: string;
}) {
  const model = getModel("gemini");
  if (!model) throw new Error("Model not available");

  const { object } = await generateObject({
    model,
    schema: SectionsSchema,
    prompt: [
      `Write newsletter sections using the outline titles.`,
      `Use the provided summaries as factual context; do not fabricate URLs or dates.`,
      `Tone: ${args.tone || "warm, expert, concise"}.`,
      `Return ONLY JSON: [{ id, title, bodyHtml, key_takeaways: [string] }].`,
    ].join("\n"),
    input: { outline: args.outline, summaries: args.summaries } as any,
  });

  return { sections: object };
}

export async function rewriteTone(args: { html: string; tone: string }) {
  const model = getModel("gemini");
  if (!model) throw new Error("Model not available");
  const res = await generateText({
    model,
    prompt: `Rewrite the following HTML to match tone "${args.tone}". Preserve tags and links. Output HTML only.\n\n${args.html}`,
    temperature: 0.2,
  });
  return { html: res.text.trim() };
}

export async function pickCTAs(args: { topic: string }) {
  const model = getModel("gemini");
  if (!model) throw new Error("Model not available");
  const { object } = await generateObject({
    model,
    schema: CTASchema,
    prompt: [
      `Suggest up to 2 CTAs relevant to "${args.topic}".`,
      `Return ONLY JSON: [{ title, text, url }].`,
    ].join("\n"),
  });
  return { ctas: object };
}
