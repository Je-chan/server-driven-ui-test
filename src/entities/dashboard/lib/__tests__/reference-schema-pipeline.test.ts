import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeSchema } from "../normalize-schema";
import { dashboardJsonSchema, type DashboardJson } from "../../model/types";

/**
 * 레퍼런스 형식 스키마 → 정규화 → 마이그레이션 전체 파이프라인 통합 테스트.
 *
 * json-schema-reference.jsonc 스타일의 스키마가 런타임 내부 형식으로
 * 올바르게 변환되는지 End-to-End로 검증한다.
 *
 * 검증 항목:
 * - 동적 필터의 dataSourceId/valueField/labelField가 최종 위젯 options에 존재
 * - 종속 필터의 dependsOnParamKey가 최종 위젯 options에 존재
 * - 정적 필터(기존 seed 대시보드 형식)가 여전히 정상 동작
 * - number-card → kpi-card alias가 함께 동작
 */

function makeSchema(overrides: Partial<DashboardJson> = {}): DashboardJson {
  return {
    version: "1.0.0",
    settings: {
      refreshInterval: 30000,
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

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("레퍼런스 형식 스키마 전체 파이프라인", () => {
  it("발전소+인버터 종속 필터가 올바르게 변환됨 (Gap 1~3 통합 검증)", () => {
    // json-schema-reference.jsonc 스타일의 스키마
    const referenceSchema = makeSchema({
      filters: [
        {
          id: "filter_site",
          type: "select",
          field: "selectedSite",
          label: "발전소 선택",
          dataSourceId: "ds_sites",
          valueField: "id",
          labelField: "name",
        },
        {
          id: "filter_inverter",
          type: "select",
          field: "selectedInverter",
          label: "인버터 선택",
          dataSourceId: "ds_assets",
          valueField: "id",
          labelField: "name",
          dependsOn: {
            field: "selectedSite",
            paramKey: "siteId",
          },
        },
        {
          id: "filter_time",
          type: "date-range",
          field: "timeRange",
          label: "조회 기간",
          presets: ["today", "yesterday", "last7days", "last30days"],
          defaultValue: "today",
          outputFields: { start: "startTime", end: "endTime" },
        },
        {
          id: "filter_interval",
          type: "select",
          field: "interval",
          label: "집계 단위",
          options: [
            { value: "5m", label: "5분" },
            { value: "15m", label: "15분" },
            { value: "1h", label: "1시간" },
          ],
          defaultValue: "15m",
        },
      ] as unknown as DashboardJson["filters"],
      widgets: [
        {
          id: "w_kpi",
          type: "number-card",
          title: "금일 발전량",
          layout: { x: 0, y: 0, w: 4, h: 4 },
          dataBinding: {
            dataSourceId: "ds_realtime",
            requestParams: {
              assetId: "{{filter.selectedSite}}",
              startTime: "{{filter.startTime}}",
            },
          },
        },
        {
          id: "w_chart",
          type: "line-chart",
          title: "발전 추이",
          layout: { x: 4, y: 0, w: 12, h: 8 },
        },
      ] as DashboardJson["widgets"],
    });

    const result = normalizeSchema(referenceSchema);

    // ── 기본 검증 ──
    expect(result.filters).toEqual([]); // 필터가 위젯으로 변환됨

    // 전체 위젯 수: 필터 4개 + 데이터 위젯 2개 = 6개
    expect(result.widgets.length).toBe(6);

    // ── 발전소 필터 위젯 ──
    const siteFilter = result.widgets.find(
      (w) => (w.options as Record<string, unknown>)?.filterKey === "selectedSite"
    );
    expect(siteFilter).toBeDefined();
    expect(siteFilter!.type).toBe("filter-select");
    const siteOpts = siteFilter!.options as Record<string, unknown>;
    expect(siteOpts.dataSourceId).toBe("ds_sites");
    expect(siteOpts.valueField).toBe("id");
    expect(siteOpts.labelField).toBe("name");

    // ── 인버터 필터 위젯 (종속 필터) ──
    const inverterFilter = result.widgets.find(
      (w) => (w.options as Record<string, unknown>)?.filterKey === "selectedInverter"
    );
    expect(inverterFilter).toBeDefined();
    expect(inverterFilter!.type).toBe("filter-select");
    const invOpts = inverterFilter!.options as Record<string, unknown>;
    expect(invOpts.dataSourceId).toBe("ds_assets");
    expect(invOpts.valueField).toBe("id");
    expect(invOpts.labelField).toBe("name");
    expect(invOpts.dependsOnParamKey).toBe("siteId");
    expect(invOpts.dependsOn).toMatchObject({ filterKey: "selectedSite" });

    // ── 날짜 필터 위젯 ──
    const timeFilter = result.widgets.find(
      (w) => (w.options as Record<string, unknown>)?.filterKey === "timeRange"
    );
    expect(timeFilter).toBeDefined();
    expect(timeFilter!.type).toBe("filter-datepicker");
    const timeOpts = timeFilter!.options as Record<string, unknown>;
    expect(timeOpts.presets).toEqual(["today", "yesterday", "last7days", "last30days"]);
    expect(timeOpts.defaultValue).toBe("today");
    expect(timeOpts.outputKeys).toEqual({ start: "startTime", end: "endTime" });

    // ── 정적 필터 위젯 ──
    const intervalFilter = result.widgets.find(
      (w) => (w.options as Record<string, unknown>)?.filterKey === "interval"
    );
    expect(intervalFilter).toBeDefined();
    const intervalOpts = intervalFilter!.options as Record<string, unknown>;
    expect(intervalOpts.options).toEqual([
      { value: "5m", label: "5분" },
      { value: "15m", label: "15분" },
      { value: "1h", label: "1시간" },
    ]);
    expect(intervalOpts.defaultValue).toBe("15m");
    // 정적 필터에는 동적 필드가 없어야 함
    expect(intervalOpts.dataSourceId).toBeUndefined();

    // ── number-card → kpi-card 변환 ──
    const kpi = result.widgets.find((w) => w.id === "w_kpi");
    expect(kpi!.type).toBe("kpi-card");

    // ── 기존 위젯 y좌표 이동 ──
    expect(kpi!.layout.y).toBe(2); // 0 + filterRowHeight(2)
    const chart = result.widgets.find((w) => w.id === "w_chart");
    expect(chart!.layout.y).toBe(2); // 0 + 2

    // ── 필터 위젯은 y=0에 배치 ──
    const filterWidgets = result.widgets.filter((w) => w.type.startsWith("filter-"));
    expect(filterWidgets.every((w) => w.layout.y === 0)).toBe(true);
  });
});

describe("기존 내부 형식 스키마 하위 호환", () => {
  it("seed 대시보드 스타일 스키마가 변환 없이 통과", () => {
    // 기존 seed 대시보드는 이미 filter-* 위젯으로 되어 있음
    const seedSchema = makeSchema({
      widgets: [
        {
          id: "w_filter_site",
          type: "filter-select",
          title: "발전소",
          layout: { x: 0, y: 0, w: 4, h: 2 },
          options: {
            filterKey: "selectedSite",
            dataSourceId: "ds_sites",
            valueField: "id",
            labelField: "name",
          },
        },
        {
          id: "w_filter_time",
          type: "filter-datepicker",
          title: "기간",
          layout: { x: 4, y: 0, w: 8, h: 2 },
          options: {
            filterKey: "timeRange",
            presets: ["today", "last7days"],
            defaultValue: "today",
            outputKeys: { start: "startTime", end: "endTime" },
          },
        },
        {
          id: "w_kpi_1",
          type: "kpi-card",
          title: "발전량",
          layout: { x: 0, y: 2, w: 3, h: 2 },
          dataBinding: {
            dataSourceId: "ds_realtime",
            requestParams: { siteId: "{{filter.selectedSite}}" },
          },
        },
        {
          id: "w_chart_1",
          type: "line-chart",
          title: "추이",
          layout: { x: 0, y: 4, w: 12, h: 3 },
        },
      ] as DashboardJson["widgets"],
    });

    const result = normalizeSchema(seedSchema);

    // 위젯 수가 변하지 않아야 함
    expect(result.widgets.length).toBe(4);

    // 타입 변화 없음
    expect(result.widgets[0].type).toBe("filter-select");
    expect(result.widgets[1].type).toBe("filter-datepicker");
    expect(result.widgets[2].type).toBe("kpi-card");
    expect(result.widgets[3].type).toBe("line-chart");

    // y좌표 변화 없음 (filters가 비어있으므로 마이그레이션 안 함)
    expect(result.widgets[2].layout.y).toBe(2);
    expect(result.widgets[3].layout.y).toBe(4);

    // 옵션 보존
    const siteOpts = result.widgets[0].options as Record<string, unknown>;
    expect(siteOpts.dataSourceId).toBe("ds_sites");
    expect(siteOpts.filterKey).toBe("selectedSite");
  });

  it("레거시 형식(key+config) 정적 필터도 정상 변환", () => {
    // 레거시 형식: field 대신 key, config 블록 사용
    const legacySchema = makeSchema({
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
      widgets: [
        {
          id: "w1",
          type: "line-chart",
          title: "차트",
          layout: { x: 0, y: 0, w: 12, h: 8 },
        },
      ] as DashboardJson["widgets"],
    });

    const result = normalizeSchema(legacySchema);

    expect(result.filters).toEqual([]);

    const filterWidget = result.widgets.find((w) => w.type === "filter-select");
    expect(filterWidget).toBeDefined();
    const opts = filterWidget!.options as Record<string, unknown>;
    expect(opts.filterKey).toBe("interval");
    expect(opts.options).toEqual([
      { value: "5m", label: "5분" },
      { value: "1h", label: "1시간" },
    ]);
    expect(opts.defaultValue).toBe("5m");
  });
});

describe("서버 파싱 → 정규화 → Zod 검증 파이프라인 (parseDashboardSchema 시뮬레이션)", () => {
  it("레퍼런스 형식 스키마를 JSON.parse → normalizeSchema → Zod 통과 시 정상 결과", () => {
    const referenceJson = JSON.stringify({
      version: "1.0.0",
      settings: {
        refreshInterval: 30000,
        theme: "light",
        gridColumns: 24,
        rowHeight: 40,
        filterMode: "auto",
      },
      dataSources: [],
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
      ],
      widgets: [
        {
          id: "w1",
          type: "number-card",
          title: "발전량",
          layout: { x: 0, y: 0, w: 4, h: 4 },
        },
      ],
      linkages: [],
    });

    // parseDashboardSchema와 동일한 흐름
    const raw = JSON.parse(referenceJson);
    const normalized = normalizeSchema(raw as DashboardJson);
    const result = dashboardJsonSchema.parse(normalized);

    // 빈 스키마 fallback이 아닌 정상 결과
    expect(result.widgets.length).toBeGreaterThan(0);
    expect(result.filters).toEqual([]);

    // number-card → kpi-card 변환 확인
    const kpi = result.widgets.find((w) => w.id === "w1");
    expect(kpi!.type).toBe("kpi-card");

    // 필터 위젯이 생성됨
    const filterWidgets = result.widgets.filter((w) => w.type.startsWith("filter-"));
    expect(filterWidgets.length).toBe(2);
  });

  it("정규화 없이 Zod 직접 파싱하면 레퍼런스 형식 필터가 실패함 (P0 회귀 방지)", () => {
    const referenceJson = {
      version: "1.0.0",
      settings: {
        refreshInterval: 30000,
        theme: "light",
        gridColumns: 24,
        rowHeight: 40,
        filterMode: "auto",
      },
      dataSources: [],
      filters: [
        {
          id: "filter_site",
          type: "select",
          field: "selectedSite", // Zod는 key를 요구, field는 알 수 없는 필드
          label: "발전소",
        },
      ],
      widgets: [],
      linkages: [],
    };

    // Zod가 레퍼런스 형식을 직접 파싱하면 실패해야 함
    const zodResult = dashboardJsonSchema.safeParse(referenceJson);
    expect(zodResult.success).toBe(false);
  });
});

describe("혼합 필터 배열 정규화", () => {
  it("레퍼런스+레거시 혼합 필터를 항목별로 정규화", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "development");

    const schema = makeSchema({
      filters: [
        // 레거시 형식 (key + config)
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
        // 레퍼런스 형식 (field 기반)
        {
          id: "filter_site",
          type: "select",
          field: "selectedSite",
          label: "발전소",
          dataSourceId: "ds_sites",
          valueField: "id",
          labelField: "name",
        },
      ] as unknown as DashboardJson["filters"],
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

    expect(result.filters).toEqual([]);
    // 필터 2개 + 데이터 위젯 1개 = 3개
    expect(result.widgets.length).toBe(3);

    // 레거시 필터가 그대로 변환됨
    const intervalFilter = result.widgets.find(
      (w) => (w.options as Record<string, unknown>)?.filterKey === "interval"
    );
    expect(intervalFilter).toBeDefined();

    // 레퍼런스 필터도 정상 변환됨
    const siteFilter = result.widgets.find(
      (w) => (w.options as Record<string, unknown>)?.filterKey === "selectedSite"
    );
    expect(siteFilter).toBeDefined();
    expect((siteFilter!.options as Record<string, unknown>).dataSourceId).toBe("ds_sites");

    // 혼합 경고 발생
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("혼합 필터 입력 감지")
    );

    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
});
