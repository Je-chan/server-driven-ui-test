"use client";

import { useTranslations } from "next-intl";

interface ImageOptionsProps {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function ImageOptions({ widget, onUpdate }: ImageOptionsProps) {
  const tb = useTranslations("builder");
  const options = (widget.options ?? {}) as {
    src?: string;
    alt?: string;
    fit?: string;
  };

  const handleChange = (key: string, value: unknown) => {
    onUpdate({ options: { ...options, [key]: value } });
  };

  return (
    <>
      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("imageSrc")}
        </label>
        <input
          type="text"
          value={options.src ?? ""}
          onChange={(e) => handleChange("src", e.target.value)}
          placeholder="https://..."
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("imageAlt")}
        </label>
        <input
          type="text"
          value={options.alt ?? ""}
          onChange={(e) => handleChange("alt", e.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("imageFit")}
        </label>
        <select
          value={options.fit ?? "contain"}
          onChange={(e) => handleChange("fit", e.target.value)}
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="contain">{tb("fitContain")}</option>
          <option value="cover">{tb("fitCover")}</option>
          <option value="fill">{tb("fitFill")}</option>
          <option value="none">{tb("fitNone")}</option>
        </select>
      </div>
    </>
  );
}
