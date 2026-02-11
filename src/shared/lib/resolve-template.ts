/**
 * {{filter.xxx}} 템플릿 변수를 실제 필터 값으로 치환
 */
export function resolveTemplateParams(
  params: Record<string, unknown>,
  filterValues: Record<string, unknown>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      const match = value.match(/^\{\{filter\.(.+)\}\}$/);
      if (match) {
        const filterKey = match[1];
        const filterVal = filterValues[filterKey];
        if (filterVal !== undefined && filterVal !== null && filterVal !== "") {
          resolved[key] = filterVal;
        }
        // 값이 없으면 해당 파라미터를 생략 (빈값 전달 방지)
      } else {
        resolved[key] = value;
      }
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
