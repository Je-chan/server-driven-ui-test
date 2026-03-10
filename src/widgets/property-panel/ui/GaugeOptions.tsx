"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Threshold {
  value: number;
  color: string;
  label: string;
}

interface GaugeOptionsProps {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function GaugeOptions({ widget, onUpdate }: GaugeOptionsProps) {
  const tb = useTranslations("builder");
  const tc = useTranslations("common");
  const options = (widget.options ?? {}) as {
    min?: number;
    max?: number;
    thresholds?: Threshold[];
  };

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ options: { ...options, [key]: value } });
  };

  const thresholds = options.thresholds ?? [];

  const handleAddThreshold = () => {
    handleChange("thresholds", [
      ...thresholds,
      { value: 0, color: "#10b981", label: "" },
    ]);
  };

  const handleThresholdChange = (
    index: number,
    key: keyof Threshold,
    value: string | number
  ) => {
    const updated = [...thresholds];
    updated[index] = { ...updated[index], [key]: value };
    handleChange("thresholds", updated);
  };

  const handleRemoveThreshold = (index: number) => {
    handleChange("thresholds", thresholds.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {tb("gaugeMin")}
          </label>
          <input
            type="number"
            value={options.min ?? 0}
            onChange={(e) => handleChange("min", parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {tb("gaugeMax")}
          </label>
          <input
            type="number"
            value={options.max ?? 100}
            onChange={(e) => handleChange("max", parseFloat(e.target.value) || 100)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">
            {tb("thresholds")}
          </label>
          <button
            onClick={handleAddThreshold}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            <Plus className="h-3 w-3" />
            {tc("add")}
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {thresholds.map((t, idx) => (
            <div key={idx} className="rounded-md border bg-muted/30 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">
                  {tb("thresholds")} {idx + 1}
                </span>
                <button
                  onClick={() => handleRemoveThreshold(idx)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">
                    {tb("thresholdValue")}
                  </label>
                  <input
                    type="number"
                    value={t.value}
                    onChange={(e) =>
                      handleThresholdChange(idx, "value", parseFloat(e.target.value) || 0)
                    }
                    className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">
                    {tb("thresholdColor")}
                  </label>
                  <input
                    type="color"
                    value={t.color}
                    onChange={(e) => handleThresholdChange(idx, "color", e.target.value)}
                    className="mt-0.5 h-7 w-full cursor-pointer rounded border"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">
                    {tb("thresholdLabel")}
                  </label>
                  <input
                    type="text"
                    value={t.label}
                    onChange={(e) => handleThresholdChange(idx, "label", e.target.value)}
                    className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
