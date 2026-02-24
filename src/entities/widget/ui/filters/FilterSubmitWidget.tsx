"use client";

import { Search } from "lucide-react";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/src/shared/lib";
import type { Widget } from "@/src/entities/dashboard";

interface FilterSubmitWidgetProps {
  widget: Widget;
  applyFilters: () => void;
  hasPendingChanges: boolean;
}

export function FilterSubmitWidget({ widget, applyFilters, hasPendingChanges }: FilterSubmitWidgetProps) {
  const locale = useLocale();

  const opts = widget.options as {
    label?: string;
    variant?: "primary" | "outline";
  } | undefined;

  const rawLabel = opts?.label ?? "조회";
  const variant = opts?.variant ?? "primary";

  const baseClasses =
    "flex h-full w-full items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  const variantClasses =
    variant === "outline"
      ? "border border-primary text-primary hover:bg-primary/10 disabled:hover:bg-transparent"
      : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:hover:bg-primary";

  return (
    <div className="flex h-full items-center justify-center p-2">
      <button
        onClick={applyFilters}
        disabled={!hasPendingChanges}
        className={`${baseClasses} ${variantClasses}`}
      >
        <Search className="h-4 w-4" />
        {resolveLabel(rawLabel, locale)}
      </button>
    </div>
  );
}
