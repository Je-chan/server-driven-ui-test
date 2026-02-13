export interface ValidationRule {
  type: "required" | "min" | "max" | "minLength" | "maxLength" | "pattern";
  value?: unknown;
  message: string;
}

export function runValidation(value: unknown, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case "required": {
        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          return rule.message;
        }
        break;
      }
      case "min": {
        const num = Number(value);
        if (!isNaN(num) && num < Number(rule.value)) {
          return rule.message;
        }
        break;
      }
      case "max": {
        const num = Number(value);
        if (!isNaN(num) && num > Number(rule.value)) {
          return rule.message;
        }
        break;
      }
      case "minLength": {
        const str = String(value ?? "");
        if (str.length < Number(rule.value)) {
          return rule.message;
        }
        break;
      }
      case "maxLength": {
        const str = String(value ?? "");
        if (str.length > Number(rule.value)) {
          return rule.message;
        }
        break;
      }
      case "pattern": {
        const str = String(value ?? "");
        try {
          const regex = new RegExp(String(rule.value));
          if (!regex.test(str)) {
            return rule.message;
          }
        } catch {
          return rule.message;
        }
        break;
      }
    }
  }
  return null;
}
