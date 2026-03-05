import { describe, it, expect } from "vitest";
import { migrateFiltersToWidgets } from "../migrate-filters";
import type { DashboardJson } from "../../model/types";

/** 테스트용 최소 스키마 팩토리 */
function makeSchema(overrides: Partial<DashboardJson> = {}): DashboardJson {
  return {
    version: "1.0.0",
    settings: {
      refreshInterval: 0,
      theme: "light",
      gridColumns: 24,
      rowHeight: 40,
      filterMode: "auto",
    },
    dataSources: [],
    filters: [],
    widgets: [],
    linkages: [],
    ...overrides,
  };
}

describe("migrateFiltersToWidgets", () => {
  it("filters가 비어있으면 원본 그대로 반환", () => {
    const schema = makeSchema({ filters: [] });
    const result = migrateFiltersToWidgets(schema);
    expect(result).toBe(schema); // 참조 동일
  });

  it("정적 select 필터를 filter-select 위젯으로 변환", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_site",
          type: "select",
          key: "selectedSite",
          label: "발전소",
          config: {
            options: [
              { value: "s1", label: "사이트1" },
              { value: "s2", label: "사이트2" },
            ],
            defaultValue: "s1",
          },
        },
      ] as DashboardJson["filters"],
    });

    const result = migrateFiltersToWidgets(schema);

    // filters가 비워져야 함
    expect(result.filters).toEqual([]);

    // 위젯이 1개 생성되어야 함
    const filterWidget = result.widgets.find((w) => w.type === "filter-select");
    expect(filterWidget).toBeDefined();
    expect(filterWidget!.options).toMatchObject({
      filterKey: "selectedSite",
      options: [
        { value: "s1", label: "사이트1" },
        { value: "s2", label: "사이트2" },
      ],
      defaultValue: "s1",
    });
  });

  it("date-range 필터를 filter-datepicker 위젯으로 변환 (폭 8)", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_time",
          type: "date-range",
          key: "timeRange",
          label: "조회 기간",
          config: {
            presets: ["today", "last7days"],
            defaultValue: "today",
            outputKeys: { start: "startTime", end: "endTime" },
          },
        },
      ] as DashboardJson["filters"],
    });

    const result = migrateFiltersToWidgets(schema);
    const dpWidget = result.widgets.find((w) => w.type === "filter-datepicker");
    expect(dpWidget).toBeDefined();
    expect(dpWidget!.layout.w).toBe(8); // datepicker는 넓게
    expect(dpWidget!.options).toMatchObject({
      filterKey: "timeRange",
      presets: ["today", "last7days"],
      defaultValue: "today",
      outputKeys: { start: "startTime", end: "endTime" },
    });
  });

  it("dependsOn 필드가 위젯 options에 전달됨", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_inverter",
          type: "select",
          key: "selectedInverter",
          label: "인버터",
          config: {},
          dependsOn: {
            filterKey: "selectedSite",
            optionsMap: {
              s1: [{ value: "inv1", label: "인버터1" }],
            },
          },
        },
      ] as DashboardJson["filters"],
    });

    const result = migrateFiltersToWidgets(schema);
    const widget = result.widgets.find((w) => w.type === "filter-select");
    expect(widget!.options).toHaveProperty("dependsOn");
    expect((widget!.options as Record<string, unknown>).dependsOn).toMatchObject({
      filterKey: "selectedSite",
      optionsMap: { s1: [{ value: "inv1", label: "인버터1" }] },
    });
  });

  it("fixedValue와 visible 필드가 위젯 options에 전달됨", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_hidden",
          type: "select",
          key: "hiddenFilter",
          label: "숨김 필터",
          config: {},
          fixedValue: "fixed_val",
          visible: false,
        },
      ] as DashboardJson["filters"],
    });

    const result = migrateFiltersToWidgets(schema);
    const widget = result.widgets[0];
    expect((widget.options as Record<string, unknown>).fixedValue).toBe("fixed_val");
    expect((widget.options as Record<string, unknown>).visible).toBe(false);
  });

  // === Gap 1 핵심 테스트: 동적 필터 필드 전달 ===
  it("config의 dataSourceId, valueField, labelField가 위젯 options에 전달됨", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_site",
          type: "select",
          key: "selectedSite",
          label: "발전소",
          config: {
            dataSourceId: "ds_sites",
            valueField: "id",
            labelField: "name",
          },
        },
      ] as DashboardJson["filters"],
    });

    const result = migrateFiltersToWidgets(schema);
    const widget = result.widgets.find((w) => w.type === "filter-select");
    const opts = widget!.options as Record<string, unknown>;
    expect(opts.dataSourceId).toBe("ds_sites");
    expect(opts.valueField).toBe("id");
    expect(opts.labelField).toBe("name");
  });

  it("config의 dependsOnParamKey가 위젯 options에 전달됨", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_asset",
          type: "select",
          key: "selectedAsset",
          label: "인버터",
          config: {
            dataSourceId: "ds_assets",
            valueField: "id",
            labelField: "name",
            dependsOnParamKey: "siteId",
          },
          dependsOn: {
            filterKey: "selectedSite",
            optionsMap: {},
          },
        },
      ] as DashboardJson["filters"],
    });

    const result = migrateFiltersToWidgets(schema);
    const widget = result.widgets.find((w) => w.type === "filter-select");
    const opts = widget!.options as Record<string, unknown>;
    expect(opts.dependsOnParamKey).toBe("siteId");
    expect(opts.dataSourceId).toBe("ds_assets");
  });

  it("동적 필터 필드가 없는 정적 필터는 영향 없음 (하위 호환)", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_interval",
          type: "select",
          key: "interval",
          label: "집계 단위",
          config: {
            options: [
              { value: "5m", label: "5분" },
              { value: "1h", label: "1시간" },
            ],
            defaultValue: "5m",
          },
        },
      ] as DashboardJson["filters"],
    });

    const result = migrateFiltersToWidgets(schema);
    const widget = result.widgets[0];
    const opts = widget.options as Record<string, unknown>;
    expect(opts.dataSourceId).toBeUndefined();
    expect(opts.valueField).toBeUndefined();
    expect(opts.labelField).toBeUndefined();
    expect(opts.dependsOnParamKey).toBeUndefined();
  });

  it("기존 위젯의 y좌표가 filterRowHeight(2)만큼 하향 이동", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_site",
          type: "select",
          key: "selectedSite",
          label: "사이트",
          config: {},
        },
      ] as DashboardJson["filters"],
      widgets: [
        {
          id: "widget_chart",
          type: "line-chart",
          title: "차트",
          layout: { x: 0, y: 0, w: 12, h: 8 },
        },
      ] as DashboardJson["widgets"],
    });

    const result = migrateFiltersToWidgets(schema);
    const chart = result.widgets.find((w) => w.id === "widget_chart");
    expect(chart!.layout.y).toBe(2); // 0 + 2(filterRowHeight)
  });

  it("여러 필터를 순서대로 x좌표 배치 (24 넘으면 줄바꿈)", () => {
    const schema = makeSchema({
      filters: [
        { id: "f1", type: "select", key: "k1", label: "F1", config: {} },
        { id: "f2", type: "select", key: "k2", label: "F2", config: {} },
        { id: "f3", type: "select", key: "k3", label: "F3", config: {} },
        { id: "f4", type: "select", key: "k4", label: "F4", config: {} },
        { id: "f5", type: "select", key: "k5", label: "F5", config: {} },
        { id: "f6", type: "select", key: "k6", label: "F6", config: {} },
        // 6 * 4 = 24 → f7은 다음 줄
        { id: "f7", type: "select", key: "k7", label: "F7", config: {} },
      ] as DashboardJson["filters"],
    });

    const result = migrateFiltersToWidgets(schema);
    const filterWidgets = result.widgets.filter((w) => w.type === "filter-select");
    expect(filterWidgets[0].layout.x).toBe(0);
    expect(filterWidgets[1].layout.x).toBe(4);
    expect(filterWidgets[5].layout.x).toBe(20);
    expect(filterWidgets[6].layout.x).toBe(0); // 줄바꿈
  });
});
