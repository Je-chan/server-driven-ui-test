import type { WidgetConditions } from "@/src/entities/dashboard";

/**
 * 위젯의 조건부 표시 여부를 평가한다.
 * conditions가 없거나 rules가 비어있으면 항상 true (표시).
 */
export function evaluateConditions(
  conditions: WidgetConditions | undefined,
  variables: Record<string, unknown>,
): boolean {
  if (!conditions || !conditions.rules || conditions.rules.length === 0) {
    return true;
  }

  const { logic = "and", rules } = conditions;

  const results = rules.map((rule) => {
    const actual = variables[rule.variable];

    switch (rule.operator) {
      case "eq":
        return String(actual ?? "") === String(rule.value ?? "");
      case "neq":
        return String(actual ?? "") !== String(rule.value ?? "");
      case "in": {
        const arr = Array.isArray(rule.value) ? rule.value : [];
        return arr.some((v) => String(v) === String(actual ?? ""));
      }
      case "notIn": {
        const arr = Array.isArray(rule.value) ? rule.value : [];
        return !arr.some((v) => String(v) === String(actual ?? ""));
      }
      case "exists":
        return actual !== undefined && actual !== null && actual !== "";
      case "notExists":
        return actual === undefined || actual === null || actual === "";
      default:
        return true;
    }
  });

  return logic === "and"
    ? results.every(Boolean)
    : results.some(Boolean);
}
