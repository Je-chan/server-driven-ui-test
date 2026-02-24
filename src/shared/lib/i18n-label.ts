import { z } from "zod";

export type I18nLabel =
  | string
  | {
      defaultValue: string;
      i18nValue: Record<string, string>;
    };

export const i18nLabelSchema = z.union([
  z.string(),
  z.object({
    defaultValue: z.string(),
    i18nValue: z.record(z.string(), z.string()),
  }),
]);

export function resolveLabel(label: I18nLabel | undefined, locale: string): string {
  if (label === undefined || label === null) return "";
  if (typeof label === "string") return label;
  return label.i18nValue[locale] ?? label.defaultValue;
}
