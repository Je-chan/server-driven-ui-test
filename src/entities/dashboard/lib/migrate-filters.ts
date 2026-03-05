import type { DashboardJson, Widget } from "../model/types";

/**
 * 레거시 filter 타입 → 현재 filter-* 위젯 타입 매핑 테이블.
 * 이전 스키마에서는 필터가 schema.filters[] 배열에 별도 정의되었으나,
 * 현재는 모든 필터가 widgets[] 배열에 filter-* 타입으로 통합되었다.
 */
const FILTER_TYPE_MAP: Record<string, string> = {
  select: "filter-select",
  "multi-select": "filter-multiselect",
  "tree-select": "filter-treeselect",
  "date-range": "filter-datepicker",
  input: "filter-input",
};

/**
 * 레거시 schema.filters[] 배열을 filter-* 위젯으로 자동 변환하는 마이그레이션 함수.
 *
 * 변환 시 동작:
 * 1. filters[] 배열의 각 필터를 대응하는 filter-* 위젯으로 생성
 * 2. 필터 위젯을 캔버스 최상단(y=0)에 배치
 * 3. 기존 위젯의 y좌표를 filterRowHeight(2)만큼 하향 이동
 * 4. filter.config의 속성들을 widget.options로 매핑
 * 5. 변환 완료 후 schema.filters를 빈 배열로 설정
 *
 * 사용처:
 * - PresentationPage: 발표 모드에서 스키마를 읽을 때
 * - DashboardViewerPage: 뷰어에서 대시보드를 로드할 때
 * - BuilderCanvas: 빌더에서 레거시 스키마를 열 때
 *
 * @param schema - 원본 대시보드 JSON 스키마
 * @returns 필터가 위젯으로 변환된 새 스키마 (원본 불변)
 */
export function migrateFiltersToWidgets(schema: DashboardJson): DashboardJson {
  const filters = schema.filters;
  // 마이그레이션 대상이 없으면 원본 그대로 반환
  if (!filters || filters.length === 0) return schema;

  // 필터 위젯이 차지할 그리드 행 수 (캔버스 상단에 이만큼 공간을 확보)
  const filterRowHeight = 2;

  // 기존 위젯의 y좌표를 아래로 이동하여 필터 위젯 공간 확보
  // filter-submit 위젯은 이미 필터 행에 있으므로 이동하지 않음
  const shiftedWidgets = schema.widgets.map((w) => ({
    ...w,
    layout: {
      ...w.layout,
      y: w.type === "filter-submit" ? w.layout.y : w.layout.y + filterRowHeight,
    },
  }));

  // 필터를 위젯으로 변환 — 24컬럼 그리드에 좌에서 우로 순서대로 배치
  let xOffset = 0; // 현재 x 위치 추적
  const filterWidgets: Widget[] = filters.map((filter, idx) => {
    const widgetType = FILTER_TYPE_MAP[filter.type] ?? "filter-select";
    const isDatepicker = filter.type === "date-range";

    // 크기 결정: datepicker는 넓게(8), 나머지는 보통(4)
    const w = isDatepicker ? 8 : 4;
    const h = 2;

    // 24컬럼에 안 들어가면 다음 줄로 줄바꿈
    if (xOffset + w > 24) xOffset = 0;
    const x = xOffset;
    xOffset += w;

    // filter.config → widget.options 매핑
    const config = filter.config as Record<string, unknown>;
    const options: Record<string, unknown> = {
      filterKey: filter.key, // 이 키로 filterValues에 저장/참조됨
    };

    // 선택지 목록, 플레이스홀더, 프리셋, 기본값, 출력 키 등 옵션 복사
    if (config.options) options.options = config.options;
    if (config.placeholder) options.placeholder = config.placeholder;
    if (config.presets) options.presets = config.presets;
    if (config.defaultValue !== undefined) options.defaultValue = config.defaultValue;
    if (config.outputKeys) options.outputKeys = config.outputKeys;
    if (filter.fixedValue !== undefined) options.fixedValue = filter.fixedValue;
    if (filter.visible !== undefined) options.visible = filter.visible;
    if (filter.dependsOn) options.dependsOn = filter.dependsOn;

    // 동적 필터 옵션 조회 필드 (normalize-schema에서 config에 넣은 값)
    if (config.dataSourceId) options.dataSourceId = config.dataSourceId;
    if (config.valueField) options.valueField = config.valueField;
    if (config.labelField) options.labelField = config.labelField;
    if (config.dependsOnParamKey) options.dependsOnParamKey = config.dependsOnParamKey;

    return {
      id: filter.id.startsWith("filter_") ? `widget_migrated_${filter.id}` : `widget_${filter.id}`,
      type: widgetType,
      title: filter.label,
      layout: { x, y: 0, w, h, minW: 3, minH: 2 },
      style: { backgroundColor: "#ffffff", borderRadius: 4, padding: 8, shadow: "none" as const },
      options,
    };
  });

  return {
    ...schema,
    filters: [], // 레거시 필터 배열 비움 (이제 widgets에 포함)
    widgets: [...filterWidgets, ...shiftedWidgets],
  };
}
