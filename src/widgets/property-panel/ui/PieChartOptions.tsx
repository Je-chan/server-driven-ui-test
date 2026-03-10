"use client";

import { useTranslations } from "next-intl";

interface PieChartOptionsProps {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function PieChartOptions({ widget, onUpdate }: PieChartOptionsProps) {
  const tb = useTranslations("builder");
  const options = (widget.options ?? {}) as {
    showLegend?: boolean;
    donut?: boolean;
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
            checked={options.donut ?? false}
            onChange={(e) => handleChange("donut", e.target.checked)}
            className="rounded border"
          />
          {tb("donut")}
        </label>
      </div>
    </>
  );
}
