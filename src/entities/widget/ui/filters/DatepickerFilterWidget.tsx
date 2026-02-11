"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { formatLocalDate } from "@/src/shared/lib";
import type { Widget } from "@/src/entities/dashboard";

interface DatepickerFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

const PRESET_LABELS: Record<string, string> = {
  today: "오늘",
  yesterday: "어제",
  last7days: "최근 7일",
  last30days: "최근 30일",
  thisMonth: "이번 달",
};

function getDatePresetRange(preset: string): { start: string; end: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
  const fmt = formatLocalDate;

  switch (preset) {
    case "today":
      return { start: fmt(today), end: fmt(endOfToday) };
    case "yesterday": {
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return { start: fmt(yesterday), end: fmt(today) };
    }
    case "last7days": {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: fmt(weekAgo), end: fmt(endOfToday) };
    }
    case "last30days": {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start: fmt(monthAgo), end: fmt(endOfToday) };
    }
    case "thisMonth":
      return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: fmt(endOfToday) };
    default:
      return { start: fmt(today), end: fmt(endOfToday) };
  }
}

export function DatepickerFilterWidget({ widget, filterValues, onFilterChange }: DatepickerFilterWidgetProps) {
  const opts = widget.options as {
    filterKey?: string;
    presets?: string[];
    defaultValue?: string;
    outputKeys?: { start: string; end: string };
    fixedValue?: unknown;
  } | undefined;

  const filterKey = opts?.filterKey ?? "timeRange";
  const outputKeys = opts?.outputKeys ?? { start: "startTime", end: "endTime" };
  const presets = opts?.presets ?? ["today", "yesterday", "last7days", "last30days", "thisMonth"];
  const fixedValue = opts?.fixedValue;
  const isFixed = fixedValue !== undefined && fixedValue !== null;

  const currentPreset = String(filterValues[`__preset_${filterKey}`] ?? "");
  const startValue = String(filterValues[outputKeys.start] ?? "");
  const endValue = String(filterValues[outputKeys.end] ?? "");

  const [showCustom, setShowCustom] = useState(currentPreset === "custom");
  const [customStart, setCustomStart] = useState(startValue.slice(0, 10));
  const [customEnd, setCustomEnd] = useState(endValue.slice(0, 10));

  useEffect(() => {
    setShowCustom(currentPreset === "custom");
    setCustomStart(startValue.slice(0, 10));
    setCustomEnd(endValue.slice(0, 10));
  }, [currentPreset, startValue, endValue]);

  if (!filterKey) {
    return (
      <div className="flex h-full items-center gap-2 px-3 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="text-xs">filterKey를 설정하세요</span>
      </div>
    );
  }

  const handlePresetClick = (preset: string) => {
    if (isFixed) return;
    const range = getDatePresetRange(preset);
    onFilterChange(outputKeys.start, range.start);
    onFilterChange(outputKeys.end, range.end);
    onFilterChange(`__preset_${filterKey}`, preset);
    setShowCustom(false);
  };

  const handleCustomApply = () => {
    if (isFixed || !customStart || !customEnd) return;
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    onFilterChange(outputKeys.start, formatLocalDate(start));
    onFilterChange(outputKeys.end, formatLocalDate(end));
    onFilterChange(`__preset_${filterKey}`, "custom");
  };

  return (
    <div className="flex h-full items-center gap-2 overflow-auto px-3">
      <label className="shrink-0 text-xs font-medium text-muted-foreground">
        {widget.title}
      </label>
      <div className="flex items-center gap-1">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            disabled={isFixed}
            className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors ${
              currentPreset === preset
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            } disabled:opacity-50`}
          >
            {PRESET_LABELS[preset] ?? preset}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          disabled={isFixed}
          className={`shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors ${
            currentPreset === "custom"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          } disabled:opacity-50`}
        >
          직접입력
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            disabled={isFixed}
            className="h-7 rounded border bg-background px-1.5 text-xs disabled:opacity-50"
          />
          <span className="text-xs text-muted-foreground">~</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            disabled={isFixed}
            className="h-7 rounded border bg-background px-1.5 text-xs disabled:opacity-50"
          />
          <button
            onClick={handleCustomApply}
            disabled={isFixed}
            className="shrink-0 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            적용
          </button>
        </div>
      )}
    </div>
  );
}
