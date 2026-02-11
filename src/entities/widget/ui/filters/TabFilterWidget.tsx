"use client";

import { ToggleLeft } from "lucide-react";
import type { Widget } from "@/src/entities/dashboard";

interface TabFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

export function TabFilterWidget({ widget, filterValues, onFilterChange }: TabFilterWidgetProps) {
  const opts = widget.options as {
    filterKey?: string;
    options?: { value: string; label: string }[];
    variant?: "pill" | "tab" | "button";
    fixedValue?: unknown;
  } | undefined;

  const filterKey = opts?.filterKey ?? "";
  const fixedValue = opts?.fixedValue;
  const isFixed = fixedValue !== undefined && fixedValue !== null;
  const currentValue = String(filterValues[filterKey] ?? "");
  const options = opts?.options ?? [];
  const variant = opts?.variant ?? "pill";

  if (!filterKey) {
    return (
      <div className="flex h-full items-center gap-2 px-3 text-muted-foreground">
        <ToggleLeft className="h-4 w-4" />
        <span className="text-xs">filterKey를 설정하세요</span>
      </div>
    );
  }

  const baseStyles = "text-xs font-medium transition-colors disabled:opacity-50";
  const variantStyles = {
    pill: {
      container: "flex items-center gap-0.5 rounded-lg bg-muted/50 p-1",
      active: "rounded-md bg-card px-3 py-1 shadow-sm text-foreground",
      inactive: "rounded-md px-3 py-1 text-muted-foreground hover:text-foreground",
    },
    tab: {
      container: "flex items-center border-b",
      active: "border-b-2 border-primary px-3 py-1.5 text-primary",
      inactive: "px-3 py-1.5 text-muted-foreground hover:text-foreground",
    },
    button: {
      container: "flex items-center gap-1",
      active: "rounded-md border border-primary bg-primary/10 px-3 py-1 text-primary",
      inactive: "rounded-md border border-border/50 px-3 py-1 text-muted-foreground hover:border-border",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="flex h-full flex-col justify-center gap-1 px-3">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        {widget.title}
      </label>
      <div className={styles.container}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterChange(filterKey, opt.value)}
            disabled={isFixed}
            className={`${baseStyles} ${
              currentValue === opt.value ? styles.active : styles.inactive
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {options.length === 0 && (
        <span className="text-xs text-muted-foreground">옵션을 설정하세요</span>
      )}
    </div>
  );
}
