import { z } from "zod";

// 위젯 레이아웃 스키마
export const widgetLayoutSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  minW: z.number().optional(),
  minH: z.number().optional(),
});

// 위젯 스타일 스키마
export const widgetStyleSchema = z.object({
  backgroundColor: z.string().optional(),
  borderRadius: z.number().optional(),
  padding: z.number().optional(),
  shadow: z.enum(["none", "sm", "md", "lg"]).optional(),
});

// 위젯 스키마
export const widgetSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  layout: widgetLayoutSchema,
  dataBinding: z.record(z.string(), z.unknown()).optional(),
  style: widgetStyleSchema.optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

// 필터 스키마
export const filterSchema = z.object({
  id: z.string(),
  type: z.enum(["select", "multi-select", "tree-select", "date-range", "input"]),
  key: z.string(),
  label: z.string(),
  config: z.record(z.string(), z.unknown()),
});

// 대시보드 설정 스키마
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
});

// 대시보드 JSON 스키마
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
export type Widget = z.infer<typeof widgetSchema>;
export type Filter = z.infer<typeof filterSchema>;
export type DashboardSettings = z.infer<typeof dashboardSettingsSchema>;
export type DashboardJson = z.infer<typeof dashboardJsonSchema>;

// 대시보드 엔티티 (DB + 파싱된 스키마)
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
