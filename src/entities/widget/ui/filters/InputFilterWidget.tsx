/**
 * InputFilterWidget — 텍스트 입력 필터.
 *
 * 자유 텍스트 입력으로 필터링하는 위젯.
 * 디바운스(debounce) 패턴을 적용하여 타이핑 중에는
 * onFilterChange를 호출하지 않고, 입력이 멈춘 후 300ms 뒤에 호출한다.
 *
 * 상태 관리:
 * - localValue: 입력창에 즉시 반영되는 로컬 상태
 * - externalValue: filterValues에서 가져온 외부 값 (동기화용)
 * - timerRef: 디바운스 타이머 참조
 *
 * 스키마 예시:
 * { type: "filter-input", options: { filterKey: "searchQuery", placeholder: "검색...", debounceMs: 300 } }
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { TextCursorInput } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/src/shared/lib";
import type { Widget } from "@/src/entities/dashboard";

interface InputFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

export function InputFilterWidget({ widget, filterValues, onFilterChange }: InputFilterWidgetProps) {
  const locale = useLocale();
  const t = useTranslations("common");
  const tf = useTranslations("filter");

  const opts = widget.options as {
    filterKey?: string;
    placeholder?: string;
    fixedValue?: unknown;
    debounceMs?: number;
  } | undefined;

  const filterKey = opts?.filterKey ?? "";
  const fixedValue = opts?.fixedValue;
  const isFixed = fixedValue !== undefined && fixedValue !== null;
  const externalValue = String(filterValues[filterKey] ?? "");
  const debounceMs = opts?.debounceMs ?? 300;

  const [localValue, setLocalValue] = useState(externalValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 외부 값 동기화
  useEffect(() => {
    setLocalValue(externalValue);
  }, [externalValue]);

  if (!filterKey) {
    return (
      <div className="flex h-full items-center gap-2 px-3 text-muted-foreground">
        <TextCursorInput className="h-4 w-4" />
        <span className="text-xs">{t("setFilterKey")}</span>
      </div>
    );
  }

  const handleChange = (value: string) => {
    setLocalValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onFilterChange(filterKey, value);
    }, debounceMs);
  };

  return (
    <div className="flex h-full flex-col justify-center gap-1 px-3">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        {resolveLabel(widget.title, locale)}
      </label>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isFixed}
        placeholder={opts?.placeholder ?? tf("inputPlaceholder")}
        className="h-8 w-full rounded-md border border-border/50 bg-card px-2 text-sm shadow-sm transition-colors hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );
}
