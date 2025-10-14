"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/utils/utils";
import {
  ChevronRight,
  Sparkles,
  Loader2,
  Trash2,
  X,
  Link2,
  Calendar,
  Plus,
  RefreshCcw,
} from "lucide-react";
import Select from "./select";

const Payload = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  title: z.string().min(2, "Title must be at least 2 characters"),
  intro: z.string().optional(),
  newsletter_type: z.string().optional(),
  features: z.array(z.string()).optional(),
  links: z.array(z.string().url("Link must be a valid URL")).optional(),
  location: z.string().optional(),
  content: z.string().optional(),
  key_details: z.string().optional(),
  tone: z.array(z.string()).optional(),
  sections: z.number().int().min(2, "Must be at least 2").max(8, "Must be at most 8").optional(),
  preset: z.string().optional(),
});

type Props = {
  onRun: (payload: any) => Promise<void>;
  onStreamRun: (payload: any) => Promise<void>;
};

const NEWSLETTER_PRESETS = {
  tech: {
    title: "Tech Weekly",
    topic: "technology",
    intro: "Latest in tech innovation and development",
    newsletter_type: "technology",
    features: ["product launches", "industry news", "developer tools"],
    tone: ["professional", "informative"],
    sections: 4,
  },
  business: {
    title: "Business Brief",
    topic: "business",
    intro: "Key business insights and market updates",
    newsletter_type: "business",
    features: ["market analysis", "company news", "financial updates"],
    tone: ["analytical", "formal"],
    sections: 3,
  },
  lifestyle: {
    title: "Lifestyle Weekly",
    topic: "lifestyle",
    intro: "Trends and tips for modern living",
    newsletter_type: "lifestyle",
    features: ["health tips", "travel guides", "food reviews"],
    tone: ["friendly", "engaging"],
    sections: 5,
  },
  education: {
    title: "Learning Digest",
    topic: "education",
    intro: "Educational content and learning resources",
    newsletter_type: "education",
    features: ["tutorials", "research findings", "skill development"],
    tone: ["educational", "clear"],
    sections: 4,
  },
} as const;

type PresetKey = keyof typeof NEWSLETTER_PRESETS;

const NEWSLETTER_TYPES = [
  "technology",
  "business",
  "lifestyle",
  "education",
  "news",
  "entertainment",
  "sports",
  "health",
  "finance",
  "travel",
  "food",
  "fashion",
] as const;

const FEATURE_OPTIONS = [
  "product launches",
  "industry news",
  "developer tools",
  "market analysis",
  "company news",
  "financial updates",
  "health tips",
  "travel guides",
  "food reviews",
  "tutorials",
  "research findings",
  "skill development",
  "interviews",
  "reviews",
  "opinions",
  "events",
  "announcements",
] as const;

const TONE_OPTIONS = [
  "professional",
  "informative",
  "analytical",
  "formal",
  "friendly",
  "engaging",
  "educational",
  "clear",
  "warm",
  "expert",
  "concise",
  "practical",
  "playful",
  "crisp",
  "casual",
  "authoritative",
] as const;

// Small building blocks ---------------------------------
const SectionTitle = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[15px] font-semibold text-zinc-900">{title}</h3>
      {description ? (
        <p className="text-[13px] text-zinc-500 leading-snug">{description}</p>
      ) : null}
    </div>
  );
};

const Field = ({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) => {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[13px] text-zinc-700">{label}</Label>
      {children}
      {hint && !error ? (
        <p className="text-[12px] text-zinc-500">{hint}</p>
      ) : null}
      {error ? <p className="text-[12px] text-red-600">{error}</p> : null}
    </div>
  );
};

function Chip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[12px] bg-white/60 shadow-sm">
      {text}
      <button
        type="button"
        onClick={onRemove}
        className="opacity-60 hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

const RunAgentForm = ({ onRun, onStreamRun }: Props) => {
  const [object, setObject] = useState({
    topic: "dev tools",
    start: "2025-01-15",
    end: "2025-01-22",
    title: "Weekly Dev Digest",
    intro: "Hand-picked updates for the week.",
    newsletterType: "",
    features: [] as string[],
    links: [] as string[],
    location: "",
    content: "",
    keyDetails: "",
    tone: [] as string[],
    sections: "" as number | "",
    preset: "",
  });
  // const [topic, setTopic] = useState("dev tools");
  // const [start, setStart] = useState("2025-01-15");
  // const [end, setEnd] = useState("2025-01-22");
  // const [title, setTitle] = useState("Weekly Dev Digest");
  // const [intro, setIntro] = useState("Hand-picked updates for the week.");
  // const [newsletterType, setNewsletterType] = useState("");
  // const [features, setFeatures] = useState<string[]>([]);
  // const [links, setLinks] = useState<string[]>([]);
  // const [location, setLocation] = useState("");
  // const [content, setContent] = useState("");
  // const [keyDetails, setKeyDetails] = useState("");
  // const [tone, setTone] = useState<string[]>([]);
  // const [sections, setSections] = useState<number | "">("");
  // const [preset, setPreset] = useState("");

  const [newFeature, setNewFeature] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newTone, setNewTone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"none" | "run" | "stream">(
    "none"
  );

  const payload = useMemo(() => {
    const data = {
      topic: object.topic,
      start_date: object.start,
      end_date: object.end,
      title: object.title,
      intro: object.intro,
      newsletter_type: object.newsletterType,
      features: object.features.length > 0 ? object.features : undefined,
      links: object.links.length > 0 ? object.links : undefined,
      location: object.location || undefined,
      content: object.content || undefined,
      key_details: object.keyDetails || undefined,
      tone: object.tone.length > 0 ? object.tone : undefined,
      sections: object.sections === "" ? undefined : Number(object.sections),
      preset: object.preset || undefined,
    };
    return data;
  }, [
    object.topic,
    object.start,
    object.end,
    object.title,
    object.intro,
    object.newsletterType,
    object.features,
    object.links,
    object.location,
    object.content,
    object.keyDetails,
    object.tone,
    object.sections,
    object.preset,
  ]);

  const parse = Payload.safeParse(payload);
  const canSubmit = parse.success;
  const parseErrors: Record<string, string> = useMemo(() => {
    if (parse.success) return {};
    const dict: Record<string, string> = {};
    for (const issue of parse.error.issues) {
      const key = (issue.path?.[0] as string) ?? "root";
      dict[key] = issue.message;
    }
    return dict;
  }, [parse]);

  const applyPreset = useCallback((k: PresetKey) => {
    const p = NEWSLETTER_PRESETS[k];
    setObject({
      ...object,
      title: p.title,
      topic: p.topic,
      intro: p.intro,
      newsletterType: p.newsletter_type,
      features: [...p.features],
      tone: [...p.tone],
      sections: p.sections,
      preset: k,
    });
  }, []);

  const addFeature = () => {
    const v = newFeature.trim();
    if (!v) return;
    if (!object.features.includes(v))
      setObject({ ...object, features: [...object.features, v] });
    setNewFeature("");
  };
  const removeFeature = (v: string) =>
    setObject({ ...object, features: object.features.filter((f) => f !== v) });
  const addTone = () => {
    const v = newTone.trim();
    if (!v) return;
    if (!object.tone.includes(v))
      setObject({ ...object, tone: [...object.tone, v] });
    setNewTone("");
  };
  const removeTone = (v: string) =>
    setObject({ ...object, tone: object.tone.filter((t) => t !== v) });

  const addLink = () => {
    const v = newLink.trim();
    if (!v) return;
    try {
      const u = new URL(v);
      const normalized = u.toString();
      if (!object.links.includes(normalized))
        setObject({ ...object, links: [...object.links, normalized] });
      setNewLink("");
    } catch {
      setError("Please enter a valid URL (https://…)");
    }
  };
  const removeLink = (v: string) =>
    setObject({ ...object, links: object.links.filter((l) => l !== v) });

  const clearAll = () => {
    setObject({
      topic: "dev tools",
      start: "2025-01-15",
      end: "2025-01-22",
      title: "Weekly Dev Digest",
      intro: "Hand-picked updates for the week.",
      newsletterType: "",
      features: [],
      links: [],
      location: "",
      content: "",
      keyDetails: "",
      tone: [],
      sections: "",
      preset: "",
    });
    setError(null);
  };

  // Keyboard shortcuts -----------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mac = navigator.platform.toLowerCase().includes("mac");
      const mod = mac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) handleSubmit("stream");
        else handleSubmit("run");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Submit -----------------------------------------------
  const handleSubmit = async (mode: "run" | "stream") => {
    setError(null);
    const result = Payload.safeParse(payload);
    if (!result.success) {
      setError("Please fix the highlighted fields.");
      return;
    }
    try {
      setSubmitting(mode);
      if (mode === "run") await onRun(result.data);
      else await onStreamRun(result.data);
    } catch (err: any) {
      setError(String(err?.message || err));
    } finally {
      setSubmitting("none");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="sticky top-0 z-10 -mx-2 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="px-2 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
                Newsletter Drafting Tool
              </h2>
              <p className="text-[13px] text-zinc-500">
                Craft comprehensive documents and newsletters with sensible
                defaults and clarity.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={clearAll} className="gap-2">
                <RefreshCcw className="h-4 w-4" /> Reset
              </Button>
              <Button
                className="gap-2"
                disabled={!canSubmit || submitting !== "none"}
                onClick={() => handleSubmit("run")}
              >
                {submitting === "run" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate (⌘⏎)
              </Button>
              <Button
                variant="secondary"
                className="gap-2"
                disabled={!canSubmit || submitting !== "none"}
                onClick={() => handleSubmit("stream")}
              >
                {submitting === "stream" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Stream (⇧⌘⏎)
              </Button>
            </div>
          </div>
        </div>
        <Separator />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-2 py-6">
        <Card className="col-span-2 border-zinc-200/70 shadow-sm">
          <CardContent className="p-6 space-y-8">
            <section className="space-y-3">
              <SectionTitle
                title="Quick Start Templates"
                description="Start with a balanced baseline. You can refine everything later."
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(Object.keys(NEWSLETTER_PRESETS) as PresetKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={cn(
                      "group rounded-xl border p-3 text-left transition hover:shadow-sm",
                      object.preset === key
                        ? "border-zinc-900"
                        : "border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-zinc-900">
                        {NEWSLETTER_PRESETS[key].title}
                      </span>
                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-zinc-600" />
                    </div>
                    <p className="mt-1 text-[12px] text-zinc-500 line-clamp-2">
                      {NEWSLETTER_PRESETS[key].intro}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <SectionTitle title="Basic information" />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Newsletter title" error={parseErrors.title}>
                  <Input
                    value={object.title}
                    onChange={(e) =>
                      setObject({ ...object, title: e.target.value })
                    }
                    placeholder="Enter newsletter title"
                    required
                  />
                </Field>
                <Field label="Topic / subject" error={parseErrors.topic}>
                  <Input
                    value={object.topic}
                    onChange={(e) =>
                      setObject({ ...object, topic: e.target.value })
                    }
                    placeholder="e.g., technology, business, lifestyle"
                    required
                  />
                </Field>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Field
                  label="Type"
                  hint="Optional"
                  error={parseErrors.newsletter_type}
                >
                  <Select
                    // className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-[14px] text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    placeholder={object.newsletterType || "Select type"}
                    // value={object.newsletterType}
                    onChange={(value) =>
                      setObject({ ...object, newsletterType: value })
                    }
                    options={NEWSLETTER_TYPES.map((t) => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))}
                  />
                    {/* <option value="">Select type</option>
                    {NEWSLETTER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select> */}
                </Field>
                <Field
                  label="Sections"
                  hint="2–8 (optional)"
                  error={parseErrors.sections}
                >
                  <Input
                    type="number"
                    min={2}
                    max={8}
                    placeholder="4"
                    value={object.sections as number | ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setObject({
                        ...object,
                        sections:
                          v === "" ? "" : Math.max(2, Math.min(8, Number(v))),
                      });
                    }}
                  />
                </Field>
                <div className="hidden md:block" />
              </div>
              <Field
                label="Introduction"
                hint="A short welcome or description for the top of your document."
              >
                <textarea
                  className="min-h-[88px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[14px] text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={object.intro}
                  onChange={(e) =>
                    setObject({ ...object, intro: e.target.value })
                  }
                  placeholder="Brief introduction or description"
                  required
                />
              </Field>
            </section>

            <Separator />

            <section className="space-y-4">
              <SectionTitle
                title="Date range"
                description="Use this to bound sources or summaries for your generator."
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Start date" error={parseErrors.start_date}>
                  <div className="relative">
                    <Input
                      type="date"
                      value={object.start}
                      onChange={(e) =>
                        setObject({ ...object, start: e.target.value })
                      }
                    />
                    {/* <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" /> */}
                  </div>
                </Field>
                <Field label="End date" error={parseErrors.end_date}>
                  <div className="relative">
                    <Input
                      type="date"
                      value={object.end}
                      onChange={(e) =>
                        setObject({ ...object, end: e.target.value })
                      }
                      
                    />
                    {/* <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" /> */}
                  </div>
                </Field>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <SectionTitle title="Content structure & tone" />
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  label="Add a feature"
                  hint="Select from common options or type your own and press Enter."
                >
                  <div className="flex gap-2">
                    <Select
                      placeholder="Select a feature"
                      // value={newFeature}
                      onChange={(value) => setNewFeature(value)}
                      options={FEATURE_OPTIONS.map((f) => ({ label: f.charAt(0).toUpperCase() + f.slice(1), value: f }))}
                    />
                    {/* <select
                      className="h-10 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-[14px] text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                    >
                      <option value="">Select a feature</option>
                      {FEATURE_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select> */}
                    <Button
                      type="button"
                      onClick={addFeature}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  {object.features.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {object.features.map((f) => (
                        <Chip
                          key={f}
                          text={f}
                          onRemove={() => removeFeature(f)}
                        />
                      ))}
                    </div>
                  ) : null}
                </Field>

                <Field
                  label="Add a tone"
                  hint="Multi-select; you can mix e.g. ‘concise’ + ‘warm’."
                >
                  <div className="flex gap-2">
                    <Select
                      placeholder="Select a tone"
                      // value={newTone}
                      onChange={(value) => setNewTone(value)}
                      options={TONE_OPTIONS.map((t) => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))}
                    />
                    {/* <select
                      className="h-10 flex-1 rounded-md border border-zinc-200 bg-white px-3 text-[14px] text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                      value={newTone}
                      onChange={(e) => setNewTone(e.target.value)}
                    >
                      <option value="">Select tone</option>
                      {TONE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select> */}
                    <Button type="button" onClick={addTone} className="gap-1">
                      <Plus className="h-4 w-4" /> Add
                    </Button>
                  </div>
                  {object.tone.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {object.tone.map((t) => (
                        <Chip key={t} text={t} onRemove={() => removeTone(t)} />
                      ))}
                    </div>
                  ) : null}
                </Field>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <SectionTitle title="Additional details" />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Location (optional)">
                  <Input
                    value={object.location}
                    onChange={(e) =>
                      setObject({ ...object, location: e.target.value })
                    }
                    placeholder="e.g., New York, Global"
                  />
                </Field>
                <div />
              </div>
              <Field label="Key details">
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[14px] text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={object.keyDetails}
                  onChange={(e) =>
                    setObject({ ...object, keyDetails: e.target.value })
                  }
                  placeholder="Highlights, constraints, or must-include notes"
                />
              </Field>
              <Field label="Additional content">
                <textarea
                  className="min-h-[96px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[14px] text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  value={object.content}
                  onChange={(e) =>
                    setObject({ ...object, content: e.target.value })
                  }
                  placeholder="Any context or specific requirements"
                />
              </Field>
            </section>

            <Separator />

            <section className="space-y-4">
              <SectionTitle
                title="Links"
                description="Add sources or references (validated URLs)."
              />
              <Field
                label="Add a link"
                hint="Paste a full URL and press Add."
                error={parseErrors.links}
              >
                <div className="flex gap-2">
                  <Input
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://example.com/article"
                  />
                  <Button type="button" onClick={addLink} className="gap-1">
                    <Link2 className="h-4 w-4" /> Add
                  </Button>
                </div>
              </Field>
              {object.links.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {object.links.map((l) => {
                    const host = (() => {
                      try {
                        return new URL(l).hostname;
                      } catch {
                        return l;
                      }
                    })();
                    return (
                      <div
                        key={l}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[14px] shadow-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-zinc-100 text-[11px] text-zinc-600">
                            ↗
                          </span>
                          <a
                            href={l}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-zinc-900 hover:underline"
                            title={l}
                          >
                            {host}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLink(l)}
                          className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <Card className="sticky top-[80px] border-zinc-200/70 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h4 className="text-[15px] font-semibold text-zinc-900">
                Live summary
              </h4>
              <div className="grid gap-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Preset</span>
                  <span>{object.preset || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Type</span>
                  <span>{object.newsletterType || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Sections</span>
                  <span>{object.sections || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Features</span>
                  <span>{object.features.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Tones</span>
                  <span>{object.tone.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Links</span>
                  <span>{object.links.length || 0}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h5 className="text-[13px] font-medium text-zinc-700">
                  Payload preview
                </h5>
                <pre className="max-h-[320px] overflow-auto rounded-lg bg-zinc-50 p-3 text-[12px] leading-relaxed text-zinc-800">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>

              {!canSubmit ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                  Some fields need attention before generating.
                </div>
              ) : (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
                  Looks good! Ready to generate.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RunAgentForm;
