"use client";

import { useTranslations } from "next-intl";

interface LineChartOptionsProps {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function LineChartOptions({ widget, onUpdate }: LineChartOptionsProps) {
  const tb = useTranslations("builder");
  const options = (widget.options ?? {}) as {
    showLegend?: boolean;
    smooth?: boolean;
    showArea?: boolean;
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
            checked={options.smooth ?? true}
            onChange={(e) => handleChange("smooth", e.target.checked)}
            className="rounded border"
          />
          {tb("smooth")}
        </label>
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.showArea ?? false}
            onChange={(e) => handleChange("showArea", e.target.checked)}
            className="rounded border"
          />
          {tb("showArea")}
        </label>
      </div>
    </>
  );
}
