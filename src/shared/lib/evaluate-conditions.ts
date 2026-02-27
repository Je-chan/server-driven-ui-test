import type { WidgetConditions } from "@/src/entities/dashboard";

/**
 * 위젯의 조건부 표시(visibility) 여부를 평가하는 핵심 엔진.
 *
 * conditional-slot 위젯이 여러 자식 중 어떤 것을 렌더링할지 결정할 때 사용된다.
 * 각 자식 위젯은 conditions 객체를 가질 수 있으며, 이 함수가 filterValues와
 * 대조하여 true/false를 반환한다.
 *
 * @param conditions - 위젯에 설정된 조건 (logic + rules[])
 *                     없거나 rules가 비어있으면 항상 true (무조건 표시)
 * @param variables  - 현재 필터 값 (filterValues). rule.variable을 키로 조회
 * @returns true면 해당 위젯을 표시, false면 숨김
 *
 * 사용처:
 * - ConditionalSlotWidget: children 중 첫 번째 매칭 자식을 찾을 때
 * - 빌더 미리보기: 조건 평가 결과로 활성 자식을 결정할 때
 */
export function evaluateConditions(
  conditions: WidgetConditions | undefined,
  variables: Record<string, unknown>,
): boolean {
  // 조건이 없으면 항상 표시 (폴백 자식은 conditions가 없다)
  if (!conditions || !conditions.rules || conditions.rules.length === 0) {
    return true;
  }

  // logic: "and"면 모든 규칙 통과 필요, "or"면 하나만 통과하면 됨
  const { logic = "and", rules } = conditions;

  // 각 규칙을 개별 평가하여 boolean 배열 생성
  const results = rules.map((rule) => {
    // variables에서 rule.variable에 해당하는 현재 필터 값을 꺼냄
    // 예: rule.variable = "selectedSite" → actual = filterValues["selectedSite"]
    const actual = variables[rule.variable];

    switch (rule.operator) {
      // eq: 문자열로 변환 후 동등 비교 (타입 불일치 방지)
      case "eq":
        return String(actual ?? "") === String(rule.value ?? "");
      // neq: 문자열로 변환 후 비동등 비교
      case "neq":
        return String(actual ?? "") !== String(rule.value ?? "");
      // in: rule.value 배열 중 actual과 일치하는 항목이 하나라도 있으면 true
      case "in": {
        const arr = Array.isArray(rule.value) ? rule.value : [];
        return arr.some((v) => String(v) === String(actual ?? ""));
      }
      // notIn: rule.value 배열에 actual과 일치하는 항목이 없으면 true
      case "notIn": {
        const arr = Array.isArray(rule.value) ? rule.value : [];
        return !arr.some((v) => String(v) === String(actual ?? ""));
      }
      // exists: 값이 존재하고 빈 문자열이 아닌 경우
      case "exists":
        return actual !== undefined && actual !== null && actual !== "";
      // notExists: 값이 없거나 빈 문자열인 경우
      case "notExists":
        return actual === undefined || actual === null || actual === "";
      // 알 수 없는 연산자는 통과시킴 (안전 기본값)
      default:
        return true;
    }
  });

  // AND: 모든 규칙이 true여야 최종 true
  // OR:  하나 이상 규칙이 true면 최종 true
  return logic === "and"
    ? results.every(Boolean)
    : results.some(Boolean);
}
