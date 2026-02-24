"use client";

import { ListFilter } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/src/shared/lib";
import type { Widget } from "@/src/entities/dashboard";

interface SelectFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

export function SelectFilterWidget({ widget, filterValues, onFilterChange }: SelectFilterWidgetProps) {
  const locale = useLocale();
  const t = useTranslations("common");

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
        <span className="text-xs">{t("setFilterKey")}</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-1 px-3">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        {resolveLabel(widget.title, locale)}
      </label>
      <select
        value={currentValue}
        onChange={(e) => onFilterChange(filterKey, e.target.value)}
        disabled={isFixed}
        className="h-8 w-full rounded-md border border-border/50 bg-card px-2 text-sm shadow-sm transition-colors hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
      >
        <option value="">{opts?.placeholder ?? t("select")}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {resolveLabel(opt.label, locale)}
          </option>
        ))}
      </select>
    </div>
  );
}
