import type { DashboardJson } from "../model/types";
import { migrateFiltersToWidgets } from "./migrate-filters";

/**
 * 위젯 타입 alias 매핑.
 * 문서 계약(json-schema-reference.jsonc)에서 사용하는 타입명을 내부 런타임 타입명으로 변환한다.
 */
const WIDGET_TYPE_ALIAS: Record<string, string> = {
  "number-card": "kpi-card",
};

/**
 * 레퍼런스 형식 필터 타입 → 레거시 필터 타입 매핑.
 * 레퍼런스에서는 "text"를 사용하지만 레거시에서는 "input"으로 정의되어 있다.
 */
const FILTER_TYPE_ALIAS: Record<string, string> = {
  text: "input",
};

/**
 * 레퍼런스 형식 필터인지 판별.
 * 레퍼런스 형식: { id, type, label, field, ... } (field 속성 사용)
 * 레거시 형식: { id, type, key, label, config: {...} } (key + config 구조)
 */
function isReferenceFilter(filter: Record<string, unknown>): boolean {
  return "field" in filter && !("key" in filter);
}

/**
 * 레퍼런스 형식의 필터를 레거시 형식으로 변환.
 *
 * 변환 규칙:
 * - field → key
 * - type "text" → "input"
 * - options, presets, defaultValue, outputFields → config 하위로 이동
 * - outputFields → config.outputKeys (키 이름 변경)
 * - dataSourceId, valueField, labelField → config 하위로 전달
 * - dependsOn: { field, paramKey } → dependsOn: { filterKey: field } + config에 paramKey 저장
 */
function normalizeReferenceFilter(
  filter: Record<string, unknown>,
): Record<string, unknown> {
  const filterType = FILTER_TYPE_ALIAS[filter.type as string] ?? (filter.type as string);

  const config: Record<string, unknown> = {};

  // 정적 옵션
  if (filter.options) config.options = filter.options;
  if (filter.presets) config.presets = filter.presets;
  if (filter.defaultValue !== undefined) config.defaultValue = filter.defaultValue;
  if (filter.placeholder) config.placeholder = filter.placeholder;

  // outputFields → outputKeys
  if (filter.outputFields) config.outputKeys = filter.outputFields;

  // 동적 필터 옵션 조회용 (Phase 6에서 사용)
  if (filter.dataSourceId) config.dataSourceId = filter.dataSourceId;
  if (filter.valueField) config.valueField = filter.valueField;
  if (filter.labelField) config.labelField = filter.labelField;

  // dependsOn 변환
  let dependsOn: Record<string, unknown> | undefined;
  if (filter.dependsOn) {
    const dep = filter.dependsOn as Record<string, unknown>;
    dependsOn = { filterKey: dep.field as string };
    // paramKey를 config에 저장 (동적 필터 재조회 시 사용)
    if (dep.paramKey) config.dependsOnParamKey = dep.paramKey;
  }

  return {
    id: filter.id,
    type: filterType,
    key: filter.field, // field → key
    label: filter.label,
    config,
    ...(dependsOn ? { dependsOn } : {}),
  };
}

/**
 * 위젯 타입 alias를 내부 런타임 타입으로 변환.
 * "number-card" → "kpi-card" 등.
 */
function normalizeWidgetTypes(widgets: DashboardJson["widgets"]): DashboardJson["widgets"] {
  return widgets.map((widget) => {
    const alias = WIDGET_TYPE_ALIAS[widget.type];
    if (!alias) return widget;
    return { ...widget, type: alias };
  });
}

/**
 * 문서 계약 형식 또는 레거시 형식의 대시보드 JSON을 내부 런타임 형식으로 정규화.
 *
 * 처리 순서:
 * 1. 레퍼런스 형식 필터 감지 및 레거시 형식으로 변환
 * 2. 위젯 타입 alias 변환 (number-card → kpi-card 등)
 * 3. migrateFiltersToWidgets()로 레거시 filters[] → filter-* 위젯 변환
 *
 * 이미 내부 형식(filter-* 위젯 기반)인 스키마는 그대로 통과한다.
 *
 * @param schema - 원본 대시보드 JSON 스키마 (레퍼런스/레거시/내부 형식 모두 허용)
 * @returns 내부 런타임 형식의 스키마
 */
export function normalizeSchema(schema: DashboardJson): DashboardJson {
  let normalized = { ...schema };

  // Step 1: 레퍼런스 형식 필터를 레거시 형식으로 변환
  if (
    normalized.filters &&
    normalized.filters.length > 0 &&
    isReferenceFilter(normalized.filters[0] as unknown as Record<string, unknown>)
  ) {
    normalized = {
      ...normalized,
      filters: (normalized.filters as unknown as Record<string, unknown>[]).map(
        normalizeReferenceFilter,
      ) as DashboardJson["filters"],
    };
  }

  // Step 2: 위젯 타입 alias 변환
  if (normalized.widgets && normalized.widgets.length > 0) {
    normalized = {
      ...normalized,
      widgets: normalizeWidgetTypes(normalized.widgets),
    };
  }

  // Step 3: 레거시 filters[] → filter-* 위젯 변환 (기존 마이그레이션 로직 재사용)
  normalized = migrateFiltersToWidgets(normalized);

  return normalized;
}
