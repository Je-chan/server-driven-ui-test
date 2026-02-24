/**
 * 필터 값 ↔ URL SearchParams 직렬화 유틸리티
 */

/** 필터 값을 URLSearchParams로 직렬화 */
export function serializeFiltersToParams(
  values: Record<string, unknown>
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === "") continue;

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(","));
      }
    } else {
      params.set(key, String(value));
    }
  }

  return params;
}

/** URLSearchParams를 필터 값 객체로 역직렬화 */
export function deserializeParamsToFilters(
  params: URLSearchParams,
  arrayKeys: Set<string>
): Record<string, unknown> {
  const values: Record<string, unknown> = {};

  params.forEach((value, key) => {
    if (arrayKeys.has(key)) {
      values[key] = value.split(",").filter(Boolean);
    } else {
      values[key] = value;
    }
  });

  return values;
}
