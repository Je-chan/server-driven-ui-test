"use client";

import { useTranslations } from "next-intl";

interface TextOptionsProps {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function TextOptions({ widget, onUpdate }: TextOptionsProps) {
  const tb = useTranslations("builder");
  const options = (widget.options ?? {}) as {
    content?: string;
    align?: string;
    fontSize?: number;
  };

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ options: { ...options, [key]: value } });
  };

  return (
    <>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("textContent")}
        </label>
        <textarea
          value={(options.content as string) ?? ""}
          onChange={(e) => handleChange("content", e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("textAlign")}
        </label>
        <select
          value={options.align ?? "left"}
          onChange={(e) => handleChange("align", e.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="left">{tb("alignLeft")}</option>
          <option value="center">{tb("alignCenter")}</option>
          <option value="right">{tb("alignRight")}</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("fontSize")}
        </label>
        <input
          type="number"
          min={8}
          max={72}
          value={options.fontSize ?? 14}
          onChange={(e) => handleChange("fontSize", parseInt(e.target.value) || 14)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        />
      </div>
    </>
  );
}
