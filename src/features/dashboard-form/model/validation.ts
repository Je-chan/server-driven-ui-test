import { resolveLabel, type I18nLabel } from "@/src/shared/lib";

export interface ValidationRule {
  type: "required" | "min" | "max" | "minLength" | "maxLength" | "pattern";
  value?: unknown;
  message: I18nLabel;
}

export function runValidation(value: unknown, rules: ValidationRule[], locale: string): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case "required": {
        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          return resolveLabel(rule.message, locale);
        }
        break;
      }
      case "min": {
        const num = Number(value);
        if (!isNaN(num) && num < Number(rule.value)) {
          return resolveLabel(rule.message, locale);
        }
        break;
      }
      case "max": {
        const num = Number(value);
        if (!isNaN(num) && num > Number(rule.value)) {
          return resolveLabel(rule.message, locale);
        }
        break;
      }
      case "minLength": {
        const str = String(value ?? "");
        if (str.length < Number(rule.value)) {
          return resolveLabel(rule.message, locale);
        }
        break;
      }
      case "maxLength": {
        const str = String(value ?? "");
        if (str.length > Number(rule.value)) {
          return resolveLabel(rule.message, locale);
        }
        break;
      }
      case "pattern": {
        const str = String(value ?? "");
        try {
          const regex = new RegExp(String(rule.value));
          if (!regex.test(str)) {
            return resolveLabel(rule.message, locale);
          }
        } catch {
          return resolveLabel(rule.message, locale);
        }
        break;
      }
    }
  }
  return null;
}
