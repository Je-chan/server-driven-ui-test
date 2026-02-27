/**
 * DatepickerFilterWidget — 날짜 범위 필터.
 *
 * 시간축 데이터를 다루는 에너지 대시보드에서 가장 중요한 필터.
 * 프리셋 버튼(오늘/어제/최근 7일 등)과 커스텀 날짜 입력을 지원한다.
 *
 * outputKeys 메커니즘:
 * - 하나의 필터 위젯이 여러 filterValues 키를 동시에 업데이트
 * - outputKeys: { start: "startTime", end: "endTime" }
 * - 프리셋 클릭 시 3번의 onFilterChange를 연속 호출:
 *   1. onFilterChange("startTime", "2026-02-27...")
 *   2. onFilterChange("endTime", "2026-02-27...")
 *   3. onFilterChange("__preset_timeRange", "today")
 * - useFilterValues의 queueMicrotask 배치가 이를 단일 URL 업데이트로 병합
 *
 * 커스텀 모드:
 * - 프리셋 대신 직접 시작/종료일을 입력
 * - "적용" 버튼 클릭 시 onFilterChange 호출
 *
 * 스키마 예시:
 * { type: "filter-datepicker", options: { filterKey: "timeRange", presets: [...], outputKeys: { start: "startTime", end: "endTime" } } }
 */
"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatLocalDate, resolveLabel } from "@/src/shared/lib";
import type { Widget } from "@/src/entities/dashboard";

interface DatepickerFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

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
  const locale = useLocale();
  const t = useTranslations("common");
  const tf = useTranslations("filter");

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
        <span className="text-xs">{t("setFilterKey")}</span>
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
    <div className="flex h-full flex-col justify-center gap-1 overflow-auto px-3">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        {resolveLabel(widget.title, locale)}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-1">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              disabled={isFixed}
              className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                currentPreset === preset
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              } disabled:opacity-50`}
            >
              {tf.has(preset) ? tf(preset as "today" | "yesterday" | "last7days" | "last30days" | "thisMonth") : preset}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(!showCustom)}
            disabled={isFixed}
            className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              currentPreset === "custom"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            } disabled:opacity-50`}
          >
            {tf("custom")}
          </button>
        </div>

        {showCustom && (
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              disabled={isFixed}
              className="h-7 rounded-md border border-border/50 bg-card px-1.5 text-xs shadow-sm disabled:opacity-50"
            />
            <span className="text-xs text-muted-foreground">~</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              disabled={isFixed}
              className="h-7 rounded-md border border-border/50 bg-card px-1.5 text-xs shadow-sm disabled:opacity-50"
            />
            <button
              onClick={handleCustomApply}
              disabled={isFixed}
              className="shrink-0 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {t("apply")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
