/**
 * ToggleFilterWidget — ON/OFF 토글 스위치 필터.
 *
 * 이진(Boolean) 값을 토글하는 스위치 형태의 필터.
 * ON/OFF 각각에 대응하는 값과 라벨을 커스터마이즈할 수 있다.
 *
 * 설정 옵션:
 * - onValue/offValue: ON/OFF 시 저장될 실제 값 (기본: "on"/"off")
 * - onLabel/offLabel: 화면에 표시될 라벨 (기본: "ON"/"OFF", 다국어 지원)
 *
 * 스키마 예시:
 * { type: "filter-toggle", options: { filterKey: "showInactive", onValue: "true", offValue: "false" } }
 */
"use client";

import { ToggleLeft, ToggleRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel, type I18nLabel } from "@/src/shared/lib";
import type { Widget } from "@/src/entities/dashboard";

interface ToggleFilterWidgetProps {
  widget: Widget;
  filterValues: Record<string, unknown>;
  onFilterChange: (key: string, value: unknown) => void;
}

export function ToggleFilterWidget({ widget, filterValues, onFilterChange }: ToggleFilterWidgetProps) {
  const locale = useLocale();
  const t = useTranslations("common");

  const opts = widget.options as {
    filterKey?: string;
    onValue?: string;
    offValue?: string;
    onLabel?: I18nLabel;
    offLabel?: I18nLabel;
    fixedValue?: unknown;
  } | undefined;

  const filterKey = opts?.filterKey ?? "";
  const onValue = opts?.onValue ?? "on";
  const offValue = opts?.offValue ?? "off";
  const onLabel = resolveLabel(opts?.onLabel, locale) || "ON";
  const offLabel = resolveLabel(opts?.offLabel, locale) || "OFF";
  const fixedValue = opts?.fixedValue;
  const isFixed = fixedValue !== undefined && fixedValue !== null;

  const currentValue = String(filterValues[filterKey] ?? offValue);
  const isOn = currentValue === onValue;

  if (!filterKey) {
    return (
      <div className="flex h-full items-center gap-2 px-3 text-muted-foreground">
        <ToggleLeft className="h-4 w-4" />
        <span className="text-xs">{t("setFilterKey")}</span>
      </div>
    );
  }

  const handleToggle = () => {
    if (isFixed) return;
    onFilterChange(filterKey, isOn ? offValue : onValue);
  };

  return (
    <div className="flex h-full flex-col justify-center gap-1 px-3">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
        {resolveLabel(widget.title, locale)}
      </label>
      <button
        onClick={handleToggle}
        disabled={isFixed}
        className="flex items-center gap-2 disabled:opacity-50"
      >
        {isOn ? (
          <ToggleRight className="h-6 w-6 text-primary" />
        ) : (
          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
        )}
        <span className={`text-sm font-medium ${isOn ? "text-primary" : "text-muted-foreground"}`}>
          {isOn ? onLabel : offLabel}
        </span>
      </button>
    </div>
  );
}
