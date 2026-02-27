/**
 * TabFilterWidget — 탭/버튼 그룹 필터.
 *
 * 여러 선택지를 시각적인 탭 또는 버튼 그룹으로 표시하고,
 * 하나를 선택하면 즉시 onFilterChange를 호출한다.
 *
 * 3가지 비주얼 변형(variant):
 * - "pill": 둥근 알약 형태 (기본값) — 세그먼트 컨트롤 스타일
 * - "tab": 하단 보더 강조 — 탭 바 스타일
 * - "button": 테두리 버튼 — 독립 버튼 스타일
 *
 * SelectFilterWidget과 기능은 같지만 UI가 다르다.
 * 선택지가 적고(2~5개) 한눈에 보여야 할 때 적합.
 *
 * 스키마 예시:
 * { type: "filter-tab", options: { filterKey: "viewMode", variant: "pill", options: [...] } }
 */
"use client";

import { ToggleLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/src/shared/lib";
import type { Widget } from "@/src/entities/dashboard";

interface TabFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

export function TabFilterWidget({ widget, filterValues, onFilterChange }: TabFilterWidgetProps) {
  const locale = useLocale();
  const t = useTranslations("common");

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
        <span className="text-xs">{t("setFilterKey")}</span>
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
        {resolveLabel(widget.title, locale)}
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
            {resolveLabel(opt.label, locale)}
          </button>
        ))}
      </div>
      {options.length === 0 && (
        <span className="text-xs text-muted-foreground">{t("setOptions")}</span>
      )}
    </div>
  );
}
