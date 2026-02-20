import type { DashboardJson, Widget } from "../model/types";

// 기존 filter 타입을 filter-* 위젯 타입으로 매핑
const FILTER_TYPE_MAP: Record<string, string> = {
  select: "filter-select",
  "multi-select": "filter-multiselect",
  "tree-select": "filter-treeselect",
  "date-range": "filter-datepicker",
  input: "filter-input",
};

/**
 * schema.filters[]가 있으면 filter-* 위젯으로 자동 변환.
 * 기존 위젯의 y좌표를 이동시켜 필터 위젯을 상단에 배치.
 */
export function migrateFiltersToWidgets(schema: DashboardJson): DashboardJson {
  const filters = schema.filters;
  if (!filters || filters.length === 0) return schema;

  const filterRowHeight = 2; // 필터 위젯이 차지할 행 높이

  // 기존 위젯의 y좌표를 이동 (filter-submit은 필터 행에 유지)
  const shiftedWidgets = schema.widgets.map((w) => ({
    ...w,
    layout: {
      ...w.layout,
      y: w.type === "filter-submit" ? w.layout.y : w.layout.y + filterRowHeight,
    },
  }));

  // 필터를 위젯으로 변환
  let xOffset = 0;
  const filterWidgets: Widget[] = filters.map((filter, idx) => {
    const widgetType = FILTER_TYPE_MAP[filter.type] ?? "filter-select";
    const isDatepicker = filter.type === "date-range";

    // 크기 결정
    const w = isDatepicker ? 8 : 4;
    const h = 2;

    // 한 줄에 배치 (넘치면 다음 줄)
    if (xOffset + w > 24) xOffset = 0;
    const x = xOffset;
    xOffset += w;

    // options 변환
    const config = filter.config as Record<string, unknown>;
    const options: Record<string, unknown> = {
      filterKey: filter.key,
    };

    if (config.options) options.options = config.options;
    if (config.placeholder) options.placeholder = config.placeholder;
    if (config.presets) options.presets = config.presets;
    if (config.defaultValue !== undefined) options.defaultValue = config.defaultValue;
    if (config.outputKeys) options.outputKeys = config.outputKeys;
    if (filter.fixedValue !== undefined) options.fixedValue = filter.fixedValue;
    if (filter.visible !== undefined) options.visible = filter.visible;
    if (filter.dependsOn) options.dependsOn = filter.dependsOn;

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
    filters: [], // 기존 필터 비움
    widgets: [...filterWidgets, ...shiftedWidgets],
  };
}
