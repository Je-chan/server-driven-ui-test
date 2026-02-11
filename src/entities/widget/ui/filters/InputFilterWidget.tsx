"use client";

import { useState, useEffect, useRef } from "react";
import { TextCursorInput } from "lucide-react";
import type { Widget } from "@/src/entities/dashboard";

interface InputFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

export function InputFilterWidget({ widget, filterValues, onFilterChange }: InputFilterWidgetProps) {
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
        <span className="text-xs">filterKey를 설정하세요</span>
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
    <div className="flex h-full items-center gap-2 px-3">
      <label className="shrink-0 text-xs font-medium text-muted-foreground">
        {widget.title}
      </label>
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isFixed}
        placeholder={opts?.placeholder ?? "입력..."}
        className="h-7 flex-1 rounded border bg-background px-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
      />
    </div>
  );
}
