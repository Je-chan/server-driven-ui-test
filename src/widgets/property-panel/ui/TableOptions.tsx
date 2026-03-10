"use client";

import { useTranslations } from "next-intl";

interface TableOptionsProps {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function TableOptions({ widget, onUpdate }: TableOptionsProps) {
  const tb = useTranslations("builder");
  const options = (widget.options ?? {}) as {
    pagination?: boolean;
    pageSize?: number;
    sortable?: boolean;
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
            checked={options.pagination ?? false}
            onChange={(e) => handleChange("pagination", e.target.checked)}
            className="rounded border"
          />
          {tb("pagination")}
        </label>
      </div>

      {options.pagination && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            {tb("pageSize")}
          </label>
          <input
            type="number"
            value={options.pageSize ?? 10}
            onChange={(e) => handleChange("pageSize", parseInt(e.target.value) || 10)}
            min={1}
            max={100}
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.sortable ?? false}
            onChange={(e) => handleChange("sortable", e.target.checked)}
            className="rounded border"
          />
          {tb("sortable")}
        </label>
      </div>
    </>
  );
}
