"use client";

import { ListFilter } from "lucide-react";
import type { Widget } from "@/src/entities/dashboard";

interface SelectFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

export function SelectFilterWidget({ widget, filterValues, onFilterChange }: SelectFilterWidgetProps) {
  const opts = widget.options as {
    filterKey?: string;
    options?: { value: string; label: string }[];
    placeholder?: string;
    visible?: boolean;
    fixedValue?: unknown;
    dependsOn?: {
      filterKey: string;
      optionsMap: Record<string, { value: string; label: string }[]>;
    };
  } | undefined;

  const filterKey = opts?.filterKey ?? "";
  const fixedValue = opts?.fixedValue;
  const isFixed = fixedValue !== undefined && fixedValue !== null;
  const currentValue = String(filterValues[filterKey] ?? "");

  // 의존 필터: 부모 값에 따라 옵션 변경
  let options = opts?.options ?? [];
  if (opts?.dependsOn) {
    const parentValue = String(filterValues[opts.dependsOn.filterKey] ?? "");
    if (parentValue && opts.dependsOn.optionsMap[parentValue]) {
      options = opts.dependsOn.optionsMap[parentValue];
    }
  }

  if (!filterKey) {
    return (
      <div className="flex h-full items-center gap-2 px-3 text-muted-foreground">
        <ListFilter className="h-4 w-4" />
        <span className="text-xs">filterKey를 설정하세요</span>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center gap-2 px-3">
      <label className="shrink-0 text-xs font-medium text-muted-foreground">
        {widget.title}
      </label>
      <select
        value={currentValue}
        onChange={(e) => onFilterChange(filterKey, e.target.value)}
        disabled={isFixed}
        className="h-7 flex-1 rounded border bg-background px-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
      >
        <option value="">{opts?.placeholder ?? "선택..."}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
