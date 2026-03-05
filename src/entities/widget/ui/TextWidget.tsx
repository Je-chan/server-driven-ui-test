"use client";

import { useLocale } from "next-intl";
import type { Widget } from "@/src/entities/dashboard";
import { resolveLabel, type I18nLabel } from "@/src/shared/lib";

interface TextWidgetProps {
  widget: Widget;
}

export function TextWidget({ widget }: TextWidgetProps) {
  const locale = useLocale();
  const options = (widget.options ?? {}) as {
    content?: I18nLabel;
    align?: "left" | "center" | "right";
    fontSize?: number;
  };

  const content = resolveLabel(options.content, locale) || "";
  const align = options.align ?? "left";
  const fontSize = options.fontSize ?? 14;

  return (
    <div
      className="flex h-full w-full overflow-auto p-3"
      style={{
        textAlign: align,
        fontSize,
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        alignItems: "center",
      }}
    >
      <p className="whitespace-pre-wrap">{content}</p>
    </div>
  );
}
