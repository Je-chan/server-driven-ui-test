/**
 * 대시보드 JSON 스키마의 Zod 검증 스키마 및 TypeScript 타입 정의.
 *
 * 이 파일은 Server-Driven UI의 핵심인 대시보드 JSON 스키마의
 * 런타임 검증(Zod)과 정적 타입(TypeScript)을 모두 제공한다.
 *
 * 주요 타입:
 * - Widget: 위젯 인스턴스 (type, layout, dataBinding, style, options, children, conditions)
 * - ChildWidget: conditional-slot의 자식 위젯 (children 필드 없음, conditions 포함)
 * - WidgetConditions: 조건부 렌더링 규칙 (logic + rules[])
 * - ConditionRule: 개별 조건 규칙 (variable, operator, value)
 * - DashboardJson: 대시보드 전체 스키마 (settings, dataSources, filters, widgets, linkages)
 * - DashboardEntity: DB 레코드 + 파싱된 스키마
 *
 * 사용처:
 * - API Routes: 대시보드 저장/조회 시 JSON 검증
 * - 빌더: 위젯 CRUD 시 타입 안전성 보장
 * - 뷰어: 스키마 파싱 및 위젯 렌더링
 */
import { z } from "zod";
import { i18nLabelSchema } from "@/src/shared/lib";

/** 위젯의 그리드 레이아웃 — react-grid-layout 좌표 시스템 기반 */
export const widgetLayoutSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  minW: z.number().optional(),
  minH: z.number().optional(),
});

/** 위젯의 시각적 스타일 — 배경색, 테두리, 그림자 등 */
export const widgetStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  padding: z.number().optional(),
  shadow: z.enum(["none", "sm", "md", "lg"]).optional(),
});

/**
 * 조건부 렌더링 규칙 스키마.
 * conditional-slot 위젯의 자식이 표시될 조건을 정의한다.
 *
 * - variable: 필터 키 (filterValues[variable]로 실제 값을 조회)
 * - operator: 비교 연산자 (eq, neq, in, notIn, exists, notExists)
 * - value: 비교 대상 값 (exists/notExists는 value 불필요)
 *
 * 예: { variable: "viewMode", operator: "eq", value: "detail" }
 *     → filterValues.viewMode === "detail" 이면 true
 */
export const conditionRuleSchema = z.object({
  variable: z.string(),                                               // 필터 키 이름
  operator: z.enum(["eq", "neq", "in", "notIn", "exists", "notExists"]), // 비교 연산자
  value: z.unknown().optional(),                                      // 비교 대상 값
});

/**
 * 위젯 조건부 표시 설정.
 * - logic: "and"면 모든 rules 통과 필요, "or"면 하나만 통과하면 됨
 * - rules: 개별 조건 규칙 배열
 * evaluateConditions() 함수가 이 스키마를 평가한다.
 */
export const widgetConditionsSchema = z.object({
  logic: z.enum(["and", "or"]).default("and"),
  rules: z.array(conditionRuleSchema),
});

/** 자식 위젯 스키마 — conditional-slot 컨테이너 내부의 후보 위젯.
 *  일반 위젯과 달리 children 필드가 없고, conditions 필드를 가진다. */
export const childWidgetSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: i18nLabelSchema,
  layout: widgetLayoutSchema,
  dataBinding: z.record(z.string(), z.unknown()).optional(),
  style: widgetStyleSchema.optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  conditions: widgetConditionsSchema.optional(),
});

/** 위젯 인스턴스 스키마 — 대시보드에 배치되는 모든 위젯의 공통 구조.
 *  filter-*, data 위젯, form, conditional-slot 등 모든 타입이 이 스키마를 따른다. */
export const widgetSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: i18nLabelSchema,
  layout: widgetLayoutSchema,
  dataBinding: z.record(z.string(), z.unknown()).optional(),
  style: widgetStyleSchema.optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  children: z.array(childWidgetSchema).optional(),
  conditions: widgetConditionsSchema.optional(),
});

/** 필터 의존관계 — 부모 필터 값에 따라 자식 필터의 옵션이 동적으로 변경.
 *  예: 발전소 필터의 값에 따라 인버터 필터의 선택지가 달라지는 경우. */
export const filterDependencySchema = z.object({
  filterKey: z.string(),
  optionsMap: z.record(
    z.string(),
    z.array(z.object({ value: z.string(), label: i18nLabelSchema }))
  ),
});

/** 레거시 필터 스키마 — schema.filters[] 배열용.
 *  현재는 filter-* 위젯으로 대체됨. migrateFiltersToWidgets()가 자동 변환. */
export const filterSchema = z.object({
  id: z.string(),
  type: z.enum(["select", "multi-select", "tree-select", "date-range", "input"]),
  key: z.string(),
  label: i18nLabelSchema,
  config: z.record(z.string(), z.unknown()),
  visible: z.boolean().optional(),
  fixedValue: z.unknown().optional(),
  dependsOn: filterDependencySchema.optional(),
});

/** 대시보드 전역 설정 — 그리드, 테마, 갱신 주기, 필터 모드 */
export const dashboardSettingsSchema = z.object({
  refreshInterval: z.number().default(0),
  theme: z.enum(["light", "dark", "system"]).default("light"),
  gridColumns: z.number().default(24),
  rowHeight: z.number().default(40),
  breakpoints: z.object({
    lg: z.number().default(1200),
    md: z.number().default(996),
    sm: z.number().default(768),
  }).optional(),
  filterMode: z.enum(["auto", "manual"]).default("auto"),
});

/** 대시보드 JSON 최상위 스키마 — DB의 dashboards.schema JSONB에 저장되는 전체 구조 */
export const dashboardJsonSchema = z.object({
  version: z.string().default("1.0.0"),
  settings: dashboardSettingsSchema,
  dataSources: z.array(z.record(z.string(), z.unknown())).default([]),
  filters: z.array(filterSchema).default([]),
  widgets: z.array(widgetSchema).default([]),
  linkages: z.array(z.record(z.string(), z.unknown())).default([]),
});

export type WidgetLayout = z.infer<typeof widgetLayoutSchema>;
export type WidgetStyle = z.infer<typeof widgetStyleSchema>;
export type ConditionRule = z.infer<typeof conditionRuleSchema>;
export type WidgetConditions = z.infer<typeof widgetConditionsSchema>;
export type ChildWidget = z.infer<typeof childWidgetSchema>;
export type Widget = z.infer<typeof widgetSchema>;
export type Filter = z.infer<typeof filterSchema>;
export type FilterDependency = z.infer<typeof filterDependencySchema>;
export type DashboardSettings = z.infer<typeof dashboardSettingsSchema>;
export type DashboardJson = z.infer<typeof dashboardJsonSchema>;

/** 대시보드 엔티티 — Prisma에서 조회한 DB 레코드 + 파싱된 JSON 스키마 */
export interface DashboardEntity {
  id: string;
  title: string;
  description: string | null;
  schema: DashboardJson;
  version: string;
  isPublished: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
