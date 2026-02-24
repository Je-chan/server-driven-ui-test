import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "@/src/shared/config/i18n";

export const routing = defineRouting({
  locales,
  defaultLocale,
});
