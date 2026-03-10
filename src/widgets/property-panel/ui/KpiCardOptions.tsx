"use client";

import { useTranslations } from "next-intl";

const ICON_OPTIONS = [
  "", "Zap", "Activity", "TrendingUp", "TrendingDown", "BarChart2",
  "Sun", "Battery", "Thermometer", "Wind", "Droplets",
  "Gauge", "Power", "Bolt", "Flame", "Leaf",
] as const;

interface KpiCardOptionsProps {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function KpiCardOptions({ widget, onUpdate }: KpiCardOptionsProps) {
  const tb = useTranslations("builder");
  const options = (widget.options ?? {}) as {
    showTrend?: boolean;
    icon?: string;
  };

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ options: { ...options, [key]: value } });
  };

  return (
    <>
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.showTrend ?? false}
            onChange={(e) => handleChange("showTrend", e.target.checked)}
            className="rounded border"
          />
          {tb("showTrend")}
        </label>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("icon")}
        </label>
        <select
          value={options.icon ?? ""}
          onChange={(e) => handleChange("icon", e.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">{tb("iconNone")}</option>
          {ICON_OPTIONS.filter(Boolean).map((icon) => (
            <option key={icon} value={icon}>
              {icon}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
