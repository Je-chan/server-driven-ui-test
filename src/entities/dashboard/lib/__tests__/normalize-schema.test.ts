import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { normalizeSchema } from "../normalize-schema";
import type { DashboardJson } from "../../model/types";

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

describe("normalizeSchema", () => {
  // === 위젯 타입 alias 변환 ===
  it("number-card → kpi-card alias 변환", () => {
    const schema = makeSchema({
      widgets: [
        {
          id: "w1",
          type: "number-card",
          title: "KPI",
          layout: { x: 0, y: 0, w: 4, h: 4 },
        },
      ] as DashboardJson["widgets"],
    });

    const result = normalizeSchema(schema);
    expect(result.widgets.find((w) => w.id === "w1")!.type).toBe("kpi-card");
  });

  it("알 수 없는 위젯 타입은 그대로 유지", () => {
    const schema = makeSchema({
      widgets: [
        {
          id: "w1",
          type: "line-chart",
          title: "차트",
          layout: { x: 0, y: 0, w: 12, h: 8 },
        },
      ] as DashboardJson["widgets"],
    });

    const result = normalizeSchema(schema);
    expect(result.widgets.find((w) => w.id === "w1")!.type).toBe("line-chart");
  });

  // === 레퍼런스 형식 필터 변환 ===
  it("레퍼런스 형식 필터(field 기반)를 레거시 형식(key 기반)으로 변환 후 위젯으로 마이그레이션", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_site",
          type: "select",
          field: "selectedSite", // 레퍼런스 형식: field 사용
          label: "발전소 선택",
          dataSourceId: "ds_sites",
          valueField: "id",
          labelField: "name",
        },
      ] as unknown as DashboardJson["filters"],
    });

    const result = normalizeSchema(schema);

    // 필터가 위젯으로 변환되었으므로 filters는 비어야 함
    expect(result.filters).toEqual([]);

    // filter-select 위젯이 생성되어야 함
    const filterWidget = result.widgets.find((w) => w.type === "filter-select");
    expect(filterWidget).toBeDefined();

    const opts = filterWidget!.options as Record<string, unknown>;
    expect(opts.filterKey).toBe("selectedSite");
    // Gap 1 검증: 동적 필터 필드가 위젯까지 전달되는지
    expect(opts.dataSourceId).toBe("ds_sites");
    expect(opts.valueField).toBe("id");
    expect(opts.labelField).toBe("name");
  });

  it("레퍼런스 형식 필터의 dependsOn 변환 (field→filterKey, paramKey→dependsOnParamKey)", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_site",
          type: "select",
          field: "selectedSite",
          label: "발전소",
          dataSourceId: "ds_sites",
          valueField: "id",
          labelField: "name",
        },
        {
          id: "filter_asset",
          type: "select",
          field: "selectedAsset",
          label: "인버터",
          dataSourceId: "ds_assets",
          valueField: "id",
          labelField: "name",
          dependsOn: {
            field: "selectedSite", // 레퍼런스 형식
            paramKey: "siteId",
          },
        },
      ] as unknown as DashboardJson["filters"],
    });

    const result = normalizeSchema(schema);

    // 인버터 필터 위젯 찾기
    const assetWidget = result.widgets.find(
      (w) => w.type === "filter-select" && (w.options as Record<string, unknown>)?.filterKey === "selectedAsset"
    );
    expect(assetWidget).toBeDefined();

    const opts = assetWidget!.options as Record<string, unknown>;
    // dependsOn이 레거시 형식으로 변환됨
    expect(opts.dependsOn).toMatchObject({ filterKey: "selectedSite" });
    // Gap 1 검증: dependsOnParamKey가 전달됨
    expect(opts.dependsOnParamKey).toBe("siteId");
    // 동적 필터 필드도 전달됨
    expect(opts.dataSourceId).toBe("ds_assets");
  });

  it("레퍼런스 형식 필터 type 'text' → 'input' → 'filter-select' 변환", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_search",
          type: "text",
          field: "searchQuery",
          label: "검색",
          placeholder: "키워드 입력",
        },
      ] as unknown as DashboardJson["filters"],
    });

    const result = normalizeSchema(schema);
    // text → input → filter-select (FILTER_TYPE_MAP에 input 매핑)
    const widget = result.widgets.find(
      (w) => (w.options as Record<string, unknown>)?.filterKey === "searchQuery"
    );
    expect(widget).toBeDefined();
    // input은 filter-select로 매핑됨 (FILTER_TYPE_MAP에 없으면 fallback)
    // 실제로 FILTER_TYPE_MAP에 input: "filter-input"이 있음
    expect(widget!.type).toBe("filter-input");
  });

  it("레퍼런스 형식 outputFields → outputKeys 변환", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_time",
          type: "date-range",
          field: "timeRange",
          label: "기간",
          presets: ["today", "last7days"],
          defaultValue: "today",
          outputFields: { start: "startTime", end: "endTime" },
        },
      ] as unknown as DashboardJson["filters"],
    });

    const result = normalizeSchema(schema);
    const dpWidget = result.widgets.find((w) => w.type === "filter-datepicker");
    expect(dpWidget).toBeDefined();
    expect((dpWidget!.options as Record<string, unknown>).outputKeys).toEqual({
      start: "startTime",
      end: "endTime",
    });
  });

  // === 이미 내부 형식인 스키마 ===
  it("이미 내부 형식(filter-* 위젯)인 스키마는 그대로 통과", () => {
    const schema = makeSchema({
      widgets: [
        {
          id: "w_filter_1",
          type: "filter-select",
          title: "사이트",
          layout: { x: 0, y: 0, w: 4, h: 2 },
          options: { filterKey: "selectedSite", options: [{ value: "s1", label: "S1" }] },
        },
        {
          id: "w_chart_1",
          type: "line-chart",
          title: "차트",
          layout: { x: 0, y: 2, w: 12, h: 8 },
        },
      ] as DashboardJson["widgets"],
    });

    const result = normalizeSchema(schema);
    // 필터 위젯이 이미 있으므로 마이그레이션 발생 안 함
    expect(result.widgets.length).toBe(2);
    expect(result.widgets[0].type).toBe("filter-select");
    expect(result.widgets[1].type).toBe("line-chart");
  });

  // === 레퍼런스 → 정규화 → 마이그레이션 전체 파이프라인 (End-to-End) ===
  it("레퍼런스 형식 스키마 전체 파이프라인: 필터+위젯 타입 변환+마이그레이션", () => {
    const schema = makeSchema({
      filters: [
        {
          id: "filter_site",
          type: "select",
          field: "selectedSite",
          label: "발전소",
          dataSourceId: "ds_sites",
          valueField: "id",
          labelField: "name",
        },
        {
          id: "filter_time",
          type: "date-range",
          field: "timeRange",
          label: "기간",
          presets: ["today", "last7days"],
          defaultValue: "today",
          outputFields: { start: "startTime", end: "endTime" },
        },
      ] as unknown as DashboardJson["filters"],
      widgets: [
        {
          id: "w1",
          type: "number-card",
          title: "발전량",
          layout: { x: 0, y: 0, w: 4, h: 4 },
        },
        {
          id: "w2",
          type: "line-chart",
          title: "추이",
          layout: { x: 4, y: 0, w: 12, h: 8 },
        },
      ] as DashboardJson["widgets"],
    });

    const result = normalizeSchema(schema);

    // filters가 비워짐
    expect(result.filters).toEqual([]);

    // 위젯 수: 필터 2개 + 데이터 위젯 2개 = 4개
    expect(result.widgets.length).toBe(4);

    // number-card → kpi-card
    const kpi = result.widgets.find((w) => w.id === "w1");
    expect(kpi!.type).toBe("kpi-card");

    // 기존 위젯 y좌표가 2만큼 이동
    expect(kpi!.layout.y).toBe(2); // 0 + 2

    // 필터 위젯들이 y=0에 배치
    const filterWidgets = result.widgets.filter((w) => w.type.startsWith("filter-"));
    expect(filterWidgets.every((w) => w.layout.y === 0)).toBe(true);

    // 발전소 필터에 동적 필드 전달 확인
    const siteFilter = filterWidgets.find(
      (w) => (w.options as Record<string, unknown>)?.filterKey === "selectedSite"
    );
    expect((siteFilter!.options as Record<string, unknown>).dataSourceId).toBe("ds_sites");
  });

  // === 스키마 계약 검증 경고 (Step 5) ===
  describe("스키마 계약 검증 경고 (dev mode)", () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = "development";
      warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
      vi.restoreAllMocks();
    });

    it("filterKey가 없는 필터 위젯에 대해 경고", () => {
      const schema = makeSchema({
        widgets: [
          {
            id: "w1",
            type: "filter-select",
            title: "필터",
            layout: { x: 0, y: 0, w: 4, h: 2 },
            options: {}, // filterKey 누락
          },
        ] as DashboardJson["widgets"],
      });

      normalizeSchema(schema);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('missing "filterKey"')
      );
    });

    it("정상 위젯에는 경고 없음", () => {
      const schema = makeSchema({
        widgets: [
          {
            id: "w1",
            type: "filter-select",
            title: "필터",
            layout: { x: 0, y: 0, w: 4, h: 2 },
            options: { filterKey: "selectedSite" },
          },
          {
            id: "w2",
            type: "line-chart",
            title: "차트",
            layout: { x: 0, y: 2, w: 12, h: 8 },
          },
        ] as DashboardJson["widgets"],
      });

      normalizeSchema(schema);

      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("filter-submit 위젯은 filterKey 검증 대상 아님", () => {
      const schema = makeSchema({
        widgets: [
          {
            id: "w1",
            type: "filter-submit",
            title: "조회",
            layout: { x: 0, y: 0, w: 2, h: 2 },
          },
        ] as DashboardJson["widgets"],
      });

      normalizeSchema(schema);

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
