import { z } from "zod";

// 데이터 소스 타입
export const dataSourceTypeSchema = z.enum([
  "timeseries",
  "realtime",
  "metric",
  "static",
  "rest-api",
]);

export type DataSourceType = z.infer<typeof dataSourceTypeSchema>;

// 데이터 소스 캐시 설정
export const dataSourceCacheSchema = z.object({
  staleTime: z.number().default(30000),
  gcTime: z.number().default(300000),
});

// 데이터 소스 반환 구조 (어떤 필드들이 있는지)
export const returnStructureSchema = z.object({
  dimensions: z.array(z.string()), // 카테고리/그룹핑 필드
  measurements: z.array(z.string()), // 수치 데이터 필드
  metadata: z.array(z.string()).optional(), // 메타데이터 필드
});

// 대시보드 내 데이터 소스 정의
export const dashboardDataSourceSchema = z.object({
  id: z.string(),
  type: dataSourceTypeSchema,
  name: z.string(),
  config: z.object({
    endpoint: z.string().optional(),
    model: z.string().optional(),
    method: z.string().optional(),
    defaultParams: z.record(z.string(), z.unknown()).optional(),
  }),
  cache: dataSourceCacheSchema.optional(),
  returnStructure: returnStructureSchema,
});

export type DashboardDataSource = z.infer<typeof dashboardDataSourceSchema>;
export type ReturnStructure = z.infer<typeof returnStructureSchema>;

// Measurement 매핑 (차트 시리즈 설정)
export const measurementMappingSchema = z.object({
  field: z.string(),
  label: z.string(),
  unit: z.string().optional(),
  color: z.string().optional(),
  format: z.string().optional(),
  aggregation: z.enum(["sum", "avg", "min", "max", "count", "latest"]).optional(),
});

export type MeasurementMapping = z.infer<typeof measurementMappingSchema>;

// 데이터 바인딩 설정
export const dataBindingSchema = z.object({
  dataSourceId: z.string(),
  requestParams: z.record(z.string(), z.unknown()).optional(),
  mapping: z.object({
    timeField: z.string().optional(),
    dimensions: z.array(z.string()).optional(),
    measurements: z.array(measurementMappingSchema),
    comparison: z
      .object({
        field: z.string(),
        type: z.enum(["split", "overlay"]),
      })
      .optional(),
  }),
  transform: z
    .object({
      calculatedFields: z.array(z.record(z.string(), z.unknown())).optional(),
      sort: z
        .object({
          field: z.string(),
          order: z.enum(["asc", "desc"]),
        })
        .optional(),
      limit: z.number().optional(),
    })
    .optional(),
});

export type DataBinding = z.infer<typeof dataBindingSchema>;

// 기본 데이터 소스 템플릿
export const DEFAULT_DATA_SOURCES: DashboardDataSource[] = [
  {
    id: "ds_inverter",
    type: "timeseries",
    name: "인버터 데이터",
    config: {
      endpoint: "/api/data/inverter",
      model: "pv_inverter",
    },
    cache: { staleTime: 30000, gcTime: 300000 },
    returnStructure: {
      dimensions: ["assetId", "assetName", "siteName", "timestamp"],
      measurements: ["activePower", "reactivePower", "dailyEnergy", "totalEnergy", "efficiency"],
      metadata: ["ratedCapacity", "manufacturer"],
    },
  },
  {
    id: "ds_weather",
    type: "rest-api",
    name: "기상 데이터",
    config: {
      endpoint: "/api/data/weather",
      method: "GET",
    },
    cache: { staleTime: 600000, gcTime: 1800000 },
    returnStructure: {
      dimensions: ["regionCode", "timestamp"],
      measurements: ["irradiance", "temperature", "humidity", "windSpeed"],
    },
  },
  {
    id: "ds_kpi",
    type: "metric",
    name: "KPI 지표",
    config: {
      endpoint: "/api/data/kpi",
    },
    cache: { staleTime: 60000, gcTime: 300000 },
    returnStructure: {
      dimensions: ["assetId", "date"],
      measurements: ["dailyGeneration", "monthlyGeneration", "pr", "availability"],
    },
  },
];
