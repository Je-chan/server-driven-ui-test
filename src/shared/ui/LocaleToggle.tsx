"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Languages } from "lucide-react";
import type { Locale } from "@/src/shared/config/i18n";

export function LocaleToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const newLocale: Locale = locale === "ko" ? "en" : "ko";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
      title={locale === "ko" ? "Switch to English" : "한국어로 전환"}
    >
      <Languages className="h-4 w-4" />
      {locale === "ko" ? "KO" : "EN"}
    </button>
  );
}
