"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Palette, RefreshCw, Check } from "lucide-react";
import { PRESET_THEMES } from "@/data/presets";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

interface ThemeCustomizerProps {
  onThemeChange: (colors: ThemeColors) => void;
  initialColors?: ThemeColors;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  onThemeChange,
  initialColors,
}) => {
  const [colors, setColors] = useState<ThemeColors>(
    initialColors || PRESET_THEMES.default.colors
  );
  const [customHex, setCustomHex] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string>("default");

  const handleColorChange = (colorType: keyof ThemeColors, value: string) => {
    const newColors = {
      ...colors,
      [colorType]: value,
    };
    setColors(newColors);
    setSelectedPreset("custom");
    onThemeChange(newColors);
  };

  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESET_THEMES[presetKey as keyof typeof PRESET_THEMES];
    if (preset) {
      setColors(preset.colors);
      setSelectedPreset(presetKey);
      onThemeChange(preset.colors);
    }
  };

  const handleCustomHex = (colorType: keyof ThemeColors) => {
    if (customHex && /^#[0-9A-Fa-f]{6}$/.test(customHex)) {
      handleColorChange(colorType, customHex);
      setCustomHex("");
    }
  };

  const resetToDefault = () => {
    setColors(PRESET_THEMES.default.colors);
    setSelectedPreset("default");
    onThemeChange(PRESET_THEMES.default.colors);
  };

  const ColorPreview = ({ color, label }: { color: string; label: string }) => (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded border border-gray-300"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Customization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Preset Themes</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(PRESET_THEMES).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => handlePresetSelect(key)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedPreset === key
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: theme.colors.secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: theme.colors.accent }}
                    />
                  </div>
                  <p className="text-sm font-medium">{theme.name}</p>
                </div>
                {selectedPreset === key && (
                  <Check className="h-4 w-4 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-sm font-medium">Custom Colors</Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="text-xs">
                Primary Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={colors.primary}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={colors.primary}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color" className="text-xs">
                Secondary Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={colors.secondary}
                  onChange={(e) =>
                    handleColorChange("secondary", e.target.value)
                  }
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={colors.secondary}
                  onChange={(e) =>
                    handleColorChange("secondary", e.target.value)
                  }
                  placeholder="#64748b"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color" className="text-xs">
                Accent Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={colors.accent}
                  onChange={(e) => handleColorChange("accent", e.target.value)}
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={colors.accent}
                  onChange={(e) => handleColorChange("accent", e.target.value)}
                  placeholder="#f59e0b"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-color" className="text-xs">
                Background
              </Label>
              <div className="flex gap-2">
                <Input
                  id="background-color"
                  type="color"
                  value={colors.background}
                  onChange={(e) =>
                    handleColorChange("background", e.target.value)
                  }
                  className="w-12 h-10 p-1 border rounded"
                />
                <Input
                  value={colors.background}
                  onChange={(e) =>
                    handleColorChange("background", e.target.value)
                  }
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-sm font-medium">Color Preview</Label>
          <div
            className="p-4 rounded-lg border"
            style={{ backgroundColor: colors.background }}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.background,
                  }}
                >
                  Primary
                </Badge>
                <Badge
                  style={{
                    backgroundColor: colors.secondary,
                    color: colors.background,
                  }}
                >
                  Secondary
                </Badge>
                <Badge
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.background,
                  }}
                >
                  Accent
                </Badge>
              </div>
              <p style={{ color: colors.foreground }} className="text-sm">
                This is how your text will look with the selected colors.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.background,
                  }}
                >
                  Button
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  style={{ borderColor: colors.primary, color: colors.primary }}
                >
                  Outline
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={resetToDefault} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset to Default
          </Button>

          {selectedPreset === "custom" && (
            <Badge variant="secondary" className="gap-1">
              <Palette className="h-3 w-3" />
              Custom Theme
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeCustomizer;
