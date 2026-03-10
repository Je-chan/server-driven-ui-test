"use client";

import { useTranslations } from "next-intl";

interface MapOptionsProps {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function MapOptions({ widget, onUpdate }: MapOptionsProps) {
  const tb = useTranslations("builder");
  const options = (widget.options ?? {}) as {
    center?: [number, number];
    zoom?: number;
  };

  const center = options.center ?? [36.5, 127.5];

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ options: { ...options, [key]: value } });
  };

  return (
    <>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("mapCenter")}
        </label>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">
              {tb("latitude")}
            </label>
            <input
              type="number"
              step="0.1"
              value={center[0]}
              onChange={(e) =>
                handleChange("center", [parseFloat(e.target.value) || 0, center[1]])
              }
              className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">
              {tb("longitude")}
            </label>
            <input
              type="number"
              step="0.1"
              value={center[1]}
              onChange={(e) =>
                handleChange("center", [center[0], parseFloat(e.target.value) || 0])
              }
              className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("zoom")}
        </label>
        <input
          type="number"
          min={1}
          max={18}
          value={options.zoom ?? 7}
          onChange={(e) =>
            handleChange("zoom", Math.max(1, Math.min(18, parseInt(e.target.value) || 7)))
          }
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>
    </>
  );
}
