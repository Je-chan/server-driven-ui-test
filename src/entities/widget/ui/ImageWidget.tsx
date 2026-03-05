"use client";

import { useLocale } from "next-intl";
import type { Widget } from "@/src/entities/dashboard";
import { resolveLabel, type I18nLabel } from "@/src/shared/lib";

interface ImageWidgetProps {
  widget: Widget;
}

export function ImageWidget({ widget }: ImageWidgetProps) {
  const locale = useLocale();
  const options = (widget.options ?? {}) as {
    src?: string;
    alt?: I18nLabel;
    fit?: "cover" | "contain" | "fill";
  };

  const src = options.src ?? "";
  const alt = resolveLabel(options.alt, locale) || resolveLabel(widget.title, locale) || "";
  const fit = options.fit ?? "contain";

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        No image source
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="h-full w-full"
        style={{ objectFit: fit }}
      />
    </div>
  );
}
