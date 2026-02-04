import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 샘플 대시보드 JSON 스키마
const sampleDashboardSchema = {
  version: "1.0.0",
  settings: {
    refreshInterval: 30000,
    theme: "light",
    gridColumns: 24,
    rowHeight: 40,
    breakpoints: {
      lg: 1200,
      md: 996,
      sm: 768,
    },
  },
  dataSources: [
    {
      id: "ds_realtime_inverter",
      type: "timeseries",
      name: "인버터 실시간 데이터",
      config: {
        endpoint: "/api/data/timeseries",
        model: "pv_inverter",
        defaultParams: {
          aggregation: "avg",
          interval: "5m",
        },
      },
      cache: {
        staleTime: 30000,
        gcTime: 300000,
      },
      returnStructure: {
        dimensions: ["assetId", "assetName", "siteName", "timestamp"],
        measurements: [
          "activePower",
          "reactivePower",
          "dailyEnergy",
          "totalEnergy",
          "efficiency",
        ],
        metadata: ["ratedCapacity", "manufacturer", "model"],
      },
    },
    {
      id: "ds_weather",
      type: "rest-api",
      name: "기상청 날씨 데이터",
      config: {
        endpoint: "/api/data/weather",
        method: "GET",
      },
      cache: {
        staleTime: 600000,
        gcTime: 1800000,
      },
      returnStructure: {
        dimensions: ["regionCode", "timestamp"],
        measurements: ["irradiance", "temperature", "humidity", "windSpeed"],
        metadata: [],
      },
    },
  ],
  filters: [
    {
      id: "filter_asset",
      type: "tree-select",
      key: "selectedAsset",
      label: "발전소 선택",
      config: {
        dataSourceId: "ds_asset_tree",
        valueField: "assetId",
        labelField: "assetName",
        parentField: "parentId",
        multiple: false,
        defaultValue: "asset_root",
      },
    },
    {
      id: "filter_time",
      type: "date-range",
      key: "timeRange",
      label: "조회 기간",
      config: {
        presets: [
          "today",
          "yesterday",
          "last7days",
          "last30days",
          "thisMonth",
          "custom",
        ],
        defaultValue: "today",
        maxRange: 365,
        outputKeys: {
          start: "startTime",
          end: "endTime",
        },
      },
    },
    {
      id: "filter_interval",
      type: "select",
      key: "interval",
      label: "집계 단위",
      config: {
        options: [
          { value: "1m", label: "1분" },
          { value: "5m", label: "5분" },
          { value: "15m", label: "15분" },
          { value: "1h", label: "1시간" },
          { value: "1d", label: "1일" },
        ],
        defaultValue: "15m",
      },
    },
  ],
  widgets: [
    {
      id: "widget_001",
      type: "line-chart",
      title: "인버터 출력 추이",
      layout: { x: 0, y: 0, w: 12, h: 8, minW: 6, minH: 4 },
      dataBinding: {
        dataSourceId: "ds_realtime_inverter",
        requestParams: {
          assetId: "{{filter.selectedAsset}}",
          startTime: "{{filter.startTime}}",
          endTime: "{{filter.endTime}}",
          aggregation: "avg",
          interval: "15m",
        },
        mapping: {
          timeField: "timestamp",
          dimensions: ["assetName"],
          measurements: [
            {
              field: "activePower",
              label: "유효전력",
              unit: "kW",
              color: "#3b82f6",
              aggregation: "avg",
            },
            {
              field: "dailyEnergy",
              label: "일발전량",
              unit: "kWh",
              color: "#10b981",
              aggregation: "sum",
            },
          ],
          comparison: {
            field: "siteName",
            type: "split",
          },
        },
        transform: {
          sort: { field: "timestamp", order: "asc" },
          limit: 1000,
        },
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 16,
        shadow: "sm",
      },
      options: {
        showLegend: true,
        legendPosition: "bottom",
        smooth: true,
        showArea: false,
        yAxisMin: 0,
        showTooltip: true,
        showDataZoom: true,
      },
    },
    {
      id: "widget_002",
      type: "kpi-card",
      title: "금일 총 발전량",
      layout: { x: 12, y: 0, w: 4, h: 4 },
      dataBinding: {
        dataSourceId: "ds_realtime_inverter",
        requestParams: {
          assetId: "{{filter.selectedAsset}}",
          aggregation: "sum",
        },
        mapping: {
          measurements: [
            {
              field: "dailyEnergy",
              label: "금일 발전량",
              unit: "MWh",
              format: "0,0.00",
              color: "#10b981",
            },
          ],
        },
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 16,
        shadow: "sm",
      },
      options: {
        icon: "Zap",
        showTrend: true,
        trendCompare: "yesterday",
        thresholds: [
          { value: 0, color: "#ef4444", label: "미달" },
          { value: 80, color: "#f59e0b", label: "보통" },
          { value: 100, color: "#10b981", label: "정상" },
        ],
      },
    },
    {
      id: "widget_003",
      type: "kpi-card",
      title: "현재 출력",
      layout: { x: 16, y: 0, w: 4, h: 4 },
      dataBinding: {
        dataSourceId: "ds_realtime_inverter",
        requestParams: {
          assetId: "{{filter.selectedAsset}}",
          aggregation: "latest",
        },
        mapping: {
          measurements: [
            {
              field: "activePower",
              label: "현재 출력",
              unit: "kW",
              format: "0,0.0",
              color: "#3b82f6",
            },
          ],
        },
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 16,
        shadow: "sm",
      },
      options: {
        icon: "Activity",
        showTrend: false,
      },
    },
    {
      id: "widget_004",
      type: "kpi-card",
      title: "설비 이용률",
      layout: { x: 20, y: 0, w: 4, h: 4 },
      dataBinding: {
        dataSourceId: "ds_realtime_inverter",
        requestParams: {
          assetId: "{{filter.selectedAsset}}",
          aggregation: "avg",
        },
        mapping: {
          measurements: [
            {
              field: "efficiency",
              label: "이용률",
              unit: "%",
              format: "0.0",
              color: "#8b5cf6",
            },
          ],
        },
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 16,
        shadow: "sm",
      },
      options: {
        icon: "Gauge",
        showTrend: true,
        trendCompare: "yesterday",
      },
    },
    {
      id: "widget_005",
      type: "table",
      title: "발전소별 현황",
      layout: { x: 12, y: 4, w: 12, h: 8 },
      dataBinding: {
        dataSourceId: "ds_realtime_inverter",
        requestParams: {
          aggregation: "latest",
        },
        mapping: {
          dimensions: ["assetId", "assetName", "siteName"],
          measurements: [
            { field: "activePower", label: "현재출력", unit: "kW" },
            { field: "dailyEnergy", label: "일발전량", unit: "kWh" },
            { field: "efficiency", label: "이용률", unit: "%" },
          ],
        },
      },
      style: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
        padding: 16,
        shadow: "sm",
      },
      options: {
        pagination: true,
        pageSize: 10,
        sortable: true,
        filterable: true,
      },
    },
  ],
  linkages: [
    {
      id: "link_001",
      type: "widget-to-widget",
      trigger: {
        widgetId: "widget_005",
        event: "rowClick",
        outputField: "assetId",
      },
      target: {
        widgetId: "widget_001",
        inputParam: "assetId",
      },
    },
  ],
};

// 데이터 소스 설정
const dataSourceConfigs = [
  {
    name: "인버터 실시간 데이터",
    type: "timeseries",
    config: JSON.stringify({
      endpoint: "/api/data/timeseries",
      model: "pv_inverter",
      defaultParams: {
        aggregation: "avg",
        interval: "5m",
      },
    }),
  },
  {
    name: "기상청 날씨 데이터",
    type: "rest-api",
    config: JSON.stringify({
      endpoint: "/api/data/weather",
      method: "GET",
    }),
  },
  {
    name: "설비 사양 정보",
    type: "static",
    config: JSON.stringify({
      fileId: "file_001",
      format: "csv",
    }),
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // 데이터가 이미 있는지 확인
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log("✅ Database already seeded. Skipping...");
    return;
  }

  // Admin 사용자 생성
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "관리자",
      role: "admin",
    },
  });
  console.log(`👤 Created admin user: ${adminUser.email}`);

  // Viewer 사용자 생성
  const viewerUser = await prisma.user.create({
    data: {
      email: "viewer@example.com",
      name: "뷰어",
      role: "viewer",
    },
  });
  console.log(`👤 Created viewer user: ${viewerUser.email}`);

  // 샘플 대시보드 생성
  const dashboard = await prisma.dashboard.create({
    data: {
      title: "태양광 발전소 종합 모니터링",
      description: "전국 PV 발전소 실시간 현황 대시보드",
      schema: JSON.stringify(sampleDashboardSchema),
      version: "1.0.0",
      isPublished: true,
      createdBy: adminUser.id,
    },
  });
  console.log(`📊 Created dashboard: ${dashboard.title}`);

  // 대시보드 권한 설정
  await prisma.dashboardPermission.create({
    data: {
      dashboardId: dashboard.id,
      userId: viewerUser.id,
      permission: "view",
    },
  });
  console.log(`🔐 Created dashboard permission for viewer`);

  // 데이터 소스 설정 생성
  for (const ds of dataSourceConfigs) {
    await prisma.dataSourceConfig.create({
      data: ds,
    });
    console.log(`📡 Created data source config: ${ds.name}`);
  }

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
