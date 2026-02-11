"use client";

import { ListChecks } from "lucide-react";
import type { Widget } from "@/src/entities/dashboard";

interface MultiSelectFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

export function MultiSelectFilterWidget({ widget, filterValues, onFilterChange }: MultiSelectFilterWidgetProps) {
  const opts = widget.options as {
    filterKey?: string;
    options?: { value: string; label: string }[];
    fixedValue?: unknown;
  } | undefined;

  const filterKey = opts?.filterKey ?? "";
  const fixedValue = opts?.fixedValue;
  const isFixed = fixedValue !== undefined && fixedValue !== null;
  const selected = (filterValues[filterKey] as string[] | undefined) ?? [];
  const options = opts?.options ?? [];

  if (!filterKey) {
    return (
      <div className="flex h-full items-center gap-2 px-3 text-muted-foreground">
        <ListChecks className="h-4 w-4" />
        <span className="text-xs">filterKey를 설정하세요</span>
      </div>
    );
  }

  const toggleOption = (value: string) => {
    if (isFixed) return;
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onFilterChange(filterKey, next);
  };

  return (
    <div className="flex h-full flex-col justify-center gap-1 overflow-auto px-3">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        {widget.title}
      </label>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isChecked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggleOption(opt.value)}
              disabled={isFixed}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                isChecked
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              } disabled:opacity-50`}
            >
              {opt.label}
            </button>
          );
        })}
        {options.length === 0 && (
          <span className="text-xs text-muted-foreground">옵션을 설정하세요</span>
        )}
      </div>
    </div>
  );
}
