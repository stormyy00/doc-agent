"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const Payload = z.object({
  topic: z.string().min(2),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  title: z.string().min(2),
  intro: z.string().optional(),
  newsletter_type: z.string().optional(),
  features: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  location: z.string().optional(),
  content: z.string().optional(),
  key_details: z.string().optional(),
  tone: z.array(z.string()).optional(),
  sections: z.number().int().min(2).max(8).optional(),
  preset: z.string().optional(),
});

type Props = {
  onRun: (payload: any) => Promise<void>;
  onStreamRun: (payload: any) => Promise<void>;
};

// Newsletter presets
const NEWSLETTER_PRESETS = {
  tech: {
    title: "Tech Weekly",
    topic: "technology",
    intro: "Latest in tech innovation and development",
    newsletter_type: "technology",
    features: ["product launches", "industry news", "developer tools"],
    tone: ["professional", "informative"],
    sections: 4
  },
  business: {
    title: "Business Brief",
    topic: "business",
    intro: "Key business insights and market updates",
    newsletter_type: "business",
    features: ["market analysis", "company news", "financial updates"],
    tone: ["analytical", "formal"],
    sections: 3
  },
  lifestyle: {
    title: "Lifestyle Weekly",
    topic: "lifestyle",
    intro: "Trends and tips for modern living",
    newsletter_type: "lifestyle",
    features: ["health tips", "travel guides", "food reviews"],
    tone: ["friendly", "engaging"],
    sections: 5
  },
  education: {
    title: "Learning Digest",
    topic: "education",
    intro: "Educational content and learning resources",
    newsletter_type: "education",
    features: ["tutorials", "research findings", "skill development"],
    tone: ["educational", "clear"],
    sections: 4
  }
};

const NEWSLETTER_TYPES = [
  "technology", "business", "lifestyle", "education", "news", 
  "entertainment", "sports", "health", "finance", "travel", "food", "fashion"
];

const FEATURE_OPTIONS = [
  "product launches", "industry news", "developer tools", "market analysis",
  "company news", "financial updates", "health tips", "travel guides",
  "food reviews", "tutorials", "research findings", "skill development",
  "interviews", "reviews", "opinions", "events", "announcements"
];

const TONE_OPTIONS = [
  "professional", "informative", "analytical", "formal", "friendly",
  "engaging", "educational", "clear", "warm", "expert", "concise",
  "practical", "playful", "crisp", "casual", "authoritative"
];

const RunAgentForm = ({ onRun, onStreamRun }: Props) => {
  const [topic, setTopic] = useState("dev tools");
  const [start, setStart] = useState("2025-01-15");
  const [end, setEnd] = useState("2025-01-22");
  const [title, setTitle] = useState("Weekly Dev Digest");
  const [intro, setIntro] = useState("Hand-picked updates for the week.");
  const [newsletterType, setNewsletterType] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [keyDetails, setKeyDetails] = useState("");
  const [tone, setTone] = useState<string[]>([]);
  const [sections, setSections] = useState<number | "">("");
  const [preset, setPreset] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newTone, setNewTone] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Helper functions for managing arrays
  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  const addLink = () => {
    if (newLink.trim() && !links.includes(newLink.trim())) {
      setLinks([...links, newLink.trim()]);
      setNewLink("");
    }
  };

  const removeLink = (link: string) => {
    setLinks(links.filter(l => l !== link));
  };

  const addTone = () => {
    if (newTone.trim() && !tone.includes(newTone.trim())) {
      setTone([...tone, newTone.trim()]);
      setNewTone("");
    }
  };

  const removeTone = (toneItem: string) => {
    setTone(tone.filter(t => t !== toneItem));
  };

  const applyPreset = (presetKey: string) => {
    const selectedPreset = NEWSLETTER_PRESETS[presetKey as keyof typeof NEWSLETTER_PRESETS];
    if (selectedPreset) {
      setTitle(selectedPreset.title);
      setTopic(selectedPreset.topic);
      setIntro(selectedPreset.intro);
      setNewsletterType(selectedPreset.newsletter_type);
      setFeatures(selectedPreset.features);
      setTone(selectedPreset.tone);
      setSections(selectedPreset.sections);
      setPreset(presetKey);
    }
  };

  function buildPayload() {
    const data = {
      topic,
      start_date: start || undefined,
      end_date: end || undefined,
      title,
      intro: intro || undefined,
      newsletter_type: newsletterType || undefined,
      features: features.length > 0 ? features : undefined,
      links: links.length > 0 ? links : undefined,
      location: location || undefined,
      content: content || undefined,
      key_details: keyDetails || undefined,
      tone: tone.length > 0 ? tone : undefined,
      sections: sections === "" ? undefined : Number(sections),
      preset: preset || undefined,
    };
    const parse = Payload.safeParse(data);
    if (!parse.success) {
      throw new Error(parse.error.issues.map((i) => i.message).join("; "));
    }
    return parse.data;
  }

  return (
    <Card>
      <CardContent className="p-6 grid gap-4">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Newsletter Drafting Tool</h2>
          <p className="text-gray-600">Create comprehensive newsletters with enhanced customization</p>
        </div>

        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            try {
              const payload = buildPayload();
              await onRun(payload);
            } catch (err: any) {
              setError(String(err.message || err));
            }
          }}
        >
          {/* Preset Templates */}
          <div className="grid gap-2">
            <Label className="text-lg font-semibold">Quick Start Templates</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(NEWSLETTER_PRESETS).map(([key, presetData]) => (
                <Button
                  key={key}
                  type="button"
                  variant={preset === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(key)}
                  className="text-xs"
                >
                  {presetData.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Basic Information</h3>
            
            <div className="grid gap-1">
              <Label>Newsletter Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter newsletter title" />
            </div>

            <div className="grid gap-1">
              <Label>Topic/Subject</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., technology, business, lifestyle" />
            </div>

            <div className="grid gap-1">
              <Label>Newsletter Type</Label>
              <select
                className="border rounded h-10 px-3"
                value={newsletterType}
                onChange={(e) => setNewsletterType(e.target.value)}
              >
                <option value="">Select newsletter type</option>
                {NEWSLETTER_TYPES.map((type) => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1">
              <Label>Introduction</Label>
              <textarea
                className="border rounded p-3 min-h-[80px]"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="Brief introduction or description of the newsletter"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Date Range</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Start Date</Label>
                <Input 
                  type="date" 
                  value={start} 
                  onChange={(e) => setStart(e.target.value)} 
                />
              </div>
              <div className="grid gap-1">
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  value={end} 
                  onChange={(e) => setEnd(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Content Features */}
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Content Features</h3>
            
            <div className="grid gap-2">
              <Label>Features (Content Types)</Label>
              <div className="flex gap-2">
                <select
                  className="border rounded h-10 px-3 flex-1"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                >
                  <option value="">Select a feature</option>
                  {FEATURE_OPTIONS.map((feature) => (
                    <option key={feature} value={feature}>{feature}</option>
                  ))}
                </select>
                <Button type="button" onClick={addFeature} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(feature)}
                      className="ml-1 text-xs hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Additional Information</h3>
            
            <div className="grid gap-1">
              <Label>Location (Optional)</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., New York, Global, Local" />
            </div>

            <div className="grid gap-1">
              <Label>Key Details</Label>
              <textarea
                className="border rounded p-3 min-h-[80px]"
                value={keyDetails}
                onChange={(e) => setKeyDetails(e.target.value)}
                placeholder="Important details, highlights, or special notes"
              />
            </div>

            <div className="grid gap-1">
              <Label>Additional Content</Label>
              <textarea
                className="border rounded p-3 min-h-[80px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Any additional content, context, or specific requirements"
              />
            </div>
          </div>

          {/* Links */}
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Links</h3>
            <div className="grid gap-2">
              <div className="flex gap-2">
                <Input
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="Add relevant links (URLs, resources, etc.)"
                />
                <Button type="button" onClick={addLink} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {links.map((link) => (
                  <Badge key={link} variant="outline" className="flex items-center gap-1">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {link.length > 30 ? link.substring(0, 30) + "..." : link}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeLink(link)}
                      className="ml-1 text-xs hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Tone and Style */}
          <div className="grid gap-3">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Tone and Style</h3>
            
            <div className="grid gap-2">
              <Label>Tone (Multi-select)</Label>
              <div className="flex gap-2">
                <select
                  className="border rounded h-10 px-3 flex-1"
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                >
                  <option value="">Select tone</option>
                  {TONE_OPTIONS.map((toneOption) => (
                    <option key={toneOption} value={toneOption}>{toneOption}</option>
                  ))}
                </select>
                <Button type="button" onClick={addTone} size="sm">Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tone.map((toneItem) => (
                  <Badge key={toneItem} variant="secondary" className="flex items-center gap-1">
                    {toneItem}
                    <button
                      type="button"
                      onClick={() => removeTone(toneItem)}
                      className="ml-1 text-xs hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid gap-1">
              <Label>Sections (2–8, optional)</Label>
              <Input
                type="number"
                min={2}
                max={8}
                placeholder="4"
                value={sections as number | ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSections(v === "" ? "" : Math.max(2, Math.min(8, Number(v))));
                }}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">Generate Newsletter</Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={async () => {
                setError(null);
                try {
                  const payload = buildPayload();
                  await onStreamRun(payload);
                } catch (err: any) {
                  setError(String(err.message || err));
                }
              }}
            >
              Stream Generate
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RunAgentForm;
