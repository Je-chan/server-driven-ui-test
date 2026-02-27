/**
 * 위젯의 dataBinding.requestParams에 포함된 {{filter.xxx}} 템플릿 변수를
 * 실제 필터 값(appliedValues)으로 치환하는 함수.
 *
 * Server-Driven UI에서 위젯과 필터를 연결하는 핵심 메커니즘이다.
 * 위젯 스키마의 requestParams에 "{{filter.selectedSite}}" 같은 템플릿을 넣으면,
 * 런타임에 useFilterValues에서 관리하는 실제 필터 값으로 교체된다.
 *
 * @param params      - 위젯의 dataBinding.requestParams 객체
 *                      예: { siteId: "{{filter.selectedSite}}", aggregation: "avg" }
 * @param filterValues - 현재 적용된 필터 값 (appliedValues)
 *                      예: { selectedSite: "site_002", startTime: "2026-02-19" }
 * @returns 치환된 파라미터 객체
 *          예: { siteId: "site_002", aggregation: "avg" }
 *
 * 사용처: DataWidgetRenderer에서 useWidgetData 호출 전 파라미터 준비
 */
export function resolveTemplateParams(
  params: Record<string, unknown>,
  filterValues: Record<string, unknown>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      // {{filter.xxx}} 패턴 매칭 — 전체 문자열이 템플릿인 경우만 (부분 매칭 미지원)
      const match = value.match(/^\{\{filter\.(.+)\}\}$/);
      if (match) {
        // 템플릿 변수에서 필터 키 추출 (예: "selectedSite")
        const filterKey = match[1];
        const filterVal = filterValues[filterKey];
        // 값이 존재할 때만 결과에 포함 — 비어있으면 파라미터 자체를 생략
        // 이렇게 하면 API에 빈값이 전달되는 것을 방지할 수 있다
        if (filterVal !== undefined && filterVal !== null && filterVal !== "") {
          resolved[key] = filterVal;
        }
      } else {
        // 템플릿이 아닌 리터럴 값은 그대로 전달
        resolved[key] = value;
      }
    } else {
      // 문자열이 아닌 값(숫자, 불리언 등)은 그대로 전달
      resolved[key] = value;
    }
  }

  return resolved;
}
