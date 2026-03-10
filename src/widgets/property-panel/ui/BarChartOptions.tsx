"use client";

import { useTranslations } from "next-intl";

interface BarChartOptionsProps {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function BarChartOptions({ widget, onUpdate }: BarChartOptionsProps) {
  const tb = useTranslations("builder");
  const options = (widget.options ?? {}) as {
    showLegend?: boolean;
    horizontal?: boolean;
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
            checked={options.showLegend ?? true}
            onChange={(e) => handleChange("showLegend", e.target.checked)}
            className="rounded border"
          />
          {tb("showLegend")}
        </label>
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.horizontal ?? false}
            onChange={(e) => handleChange("horizontal", e.target.checked)}
            className="rounded border"
          />
          {tb("horizontal")}
        </label>
      </div>
    </>
  );
}
