/**
 * 필터 값 ↔ URL SearchParams 직렬화 유틸리티.
 *
 * 필터 상태를 URL에 저장하여 북마크/공유가 가능하게 한다.
 * useFilterValues 훅에서 appliedValues를 URL에 기록하고,
 * 페이지 로드 시 URL에서 필터 값을 복원하는 데 사용된다.
 *
 * 예시:
 *   { selectedSite: "site_002", startTime: "2026-02-19", tags: ["solar", "ess"] }
 *   → ?selectedSite=site_002&startTime=2026-02-19&tags=solar,ess
 */

/**
 * 필터 값 객체를 URLSearchParams로 직렬화.
 * - null/undefined/빈 문자열은 생략
 * - 배열은 쉼표로 결합하여 단일 파라미터로 저장
 * - 빈 배열은 생략
 */
export function serializeFiltersToParams(
  values: Record<string, unknown>
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === "") continue;

    if (Array.isArray(value)) {
      // 다중 선택 필터(filter-multiselect)의 값: ["solar", "ess"] → "solar,ess"
      if (value.length > 0) {
        params.set(key, value.join(","));
      }
    } else {
      params.set(key, String(value));
    }
  }

  return params;
}

/**
 * URLSearchParams를 필터 값 객체로 역직렬화.
 * @param arrayKeys - 배열로 복원해야 하는 키 목록 (filter-multiselect의 filterKey들)
 *                    이 키에 해당하는 값은 쉼표로 분리하여 string[]로 변환
 */
export function deserializeParamsToFilters(
  params: URLSearchParams,
  arrayKeys: Set<string>
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  params.forEach((value, key) => {
    if (arrayKeys.has(key)) {
      // 다중 선택 필터: "solar,ess" → ["solar", "ess"]
      values[key] = value.split(",").filter(Boolean);
    } else {
      values[key] = value;
    }
  });

  return values;
}
