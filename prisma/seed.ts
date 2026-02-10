import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ====== 대시보드 JSON 스키마 ======

// 대시보드 1: 태양광 발전소 종합 모니터링
const mainDashboardSchema = {
  version: "1.0.0",
  settings: {
    refreshInterval: 30000,
    theme: "light",
    gridColumns: 24,
    rowHeight: 40,
  },
  dataSources: [
    {
      id: "ds_inverter",
      type: "timeseries",
      name: "인버터 데이터",
      config: { endpoint: "/api/data/inverter" },
      returnStructure: {
        dimensions: ["assetId", "assetName", "siteName", "timestamp"],
        measurements: ["activePower", "reactivePower", "dailyEnergy", "totalEnergy", "efficiency"],
      },
    },
    {
      id: "ds_weather",
      type: "rest-api",
      name: "기상 데이터",
      config: { endpoint: "/api/data/weather" },
      returnStructure: {
        dimensions: ["siteId", "siteName", "timestamp"],
        measurements: ["irradiance", "temperature", "humidity", "windSpeed"],
      },
    },
    {
      id: "ds_kpi",
      type: "metric",
      name: "KPI 지표",
      config: { endpoint: "/api/data/kpi" },
      returnStructure: {
        dimensions: ["siteId", "date"],
        measurements: ["dailyGeneration", "pr", "availability", "capacityFactor"],
      },
    },
    {
      id: "ds_alarm",
      type: "rest-api",
      name: "알람 데이터",
      config: { endpoint: "/api/data/alarm" },
      returnStructure: {
        dimensions: ["siteId", "severity", "category", "timestamp"],
        measurements: ["count"],
      },
    },
    {
      id: "ds_revenue",
      type: "metric",
      name: "수익 데이터",
      config: { endpoint: "/api/data/revenue" },
      returnStructure: {
        dimensions: ["siteId", "date"],
        measurements: ["energySales", "recSales", "totalRevenue", "generationKwh"],
      },
    },
    {
      id: "ds_battery",
      type: "timeseries",
      name: "ESS 데이터",
      config: { endpoint: "/api/data/battery" },
      returnStructure: {
        dimensions: ["siteId", "batteryId", "timestamp"],
        measurements: ["soc", "power", "temperature", "voltage", "current"],
      },
    },
    {
      id: "ds_grid",
      type: "timeseries",
      name: "계통 데이터",
      config: { endpoint: "/api/data/grid" },
      returnStructure: {
        dimensions: ["siteId", "timestamp"],
        measurements: ["gridVoltage", "gridFrequency", "exportPower", "importPower"],
      },
    },
    {
      id: "ds_price",
      type: "rest-api",
      name: "전력 가격",
      config: { endpoint: "/api/data/price" },
      returnStructure: {
        dimensions: ["region", "timestamp"],
        measurements: ["smp", "rec"],
      },
    },
  ],
  filters: [],
  widgets: [
    {
      id: "widget_power_chart",
      type: "line-chart",
      title: "실시간 발전 출력",
      layout: { x: 0, y: 2, w: 5, h: 2 },
      dataBinding: {
        dataSourceId: "ds_inverter",
        mapping: {
          timeField: "timestamp",
          measurements: [{ field: "activePower", label: "유효전력", unit: "kW", color: "#3b82f6" }],
        },
      },
      style: { backgroundColor: "#ffffff", borderRadius: 8, shadow: "sm" },
    },
    {
      id: "widget_total_power",
      type: "kpi-card",
      title: "현재 총 출력",
      layout: { x: 0, y: 0, w: 2, h: 2 },
      dataBinding: {
        dataSourceId: "ds_inverter",
        mapping: { measurements: [{ field: "activePower", label: "총 출력", unit: "kW", color: "#10b981" }] },
      },
      style: { backgroundColor: "#ffffff", borderRadius: 8, shadow: "sm" },
    },
    {
      id: "widget_daily_energy",
      type: "kpi-card",
      title: "금일 발전량",
      layout: { x: 2, y: 0, w: 3, h: 2 },
      dataBinding: {
        dataSourceId: "ds_inverter",
        mapping: { measurements: [{ field: "dailyEnergy", label: "일발전량", unit: "kWh", color: "#f59e0b" }] },
      },
      style: { backgroundColor: "#ffffff", borderRadius: 8, shadow: "sm" },
    },
    {
      id: "widget_weather",
      type: "kpi-card",
      title: "현재 일사량",
      layout: { x: 5, y: 0, w: 5, h: 2 },
      dataBinding: {
        dataSourceId: "ds_weather",
        mapping: { measurements: [{ field: "humidity", label: "일사량", unit: "W/m²", color: "#ef4444" }] },
      },
      style: { backgroundColor: "#ffffff", borderRadius: 8, shadow: "sm" },
    },
    {
      id: "widget_temperature",
      type: "kpi-card",
      title: "외기 온도",
      layout: { x: 10, y: 0, w: 2, h: 2 },
      dataBinding: {
        dataSourceId: "ds_weather",
        mapping: { measurements: [{ field: "temperature", label: "온도", unit: "°C", color: "#8b5cf6" }] },
      },
      style: { backgroundColor: "#ffffff", borderRadius: 8, shadow: "sm" },
    },
    {
      id: "widget_asset_table",
      type: "table",
      title: "인버터별 현황",
      layout: { x: 5, y: 2, w: 7, h: 2 },
      dataBinding: {
        dataSourceId: "ds_inverter",
        mapping: {
          dimensions: ["assetName", "siteName"],
          measurements: [
            { field: "activePower", label: "현재출력", unit: "kW" },
            { field: "dailyEnergy", label: "일발전량", unit: "kWh" },
            { field: "efficiency", label: "효율", unit: "%" },
          ],
        },
      },
      style: { backgroundColor: "#ffffff", borderRadius: 8, shadow: "sm" },
    },
    {
      id: "widget_grid_chart",
      type: "line-chart",
      title: "Line Chart 7",
      layout: { x: 0, y: 4, w: 12, h: 4, minW: 6, minH: 4 },
      dataBinding: {
        dataSourceId: "ds_grid",
        mapping: {
          measurements: [
            { field: "gridVoltage", label: "23", unit: "ㅇ" },
            { field: "exportPower", label: "231", unit: "ㅇㅇ" },
          ],
          timeField: "timestamp",
        },
      },
      style: { backgroundColor: "#ffffff", borderRadius: 8, padding: 16, shadow: "sm" },
      options: { showLegend: true, smooth: true, showArea: false },
    },
    {
      id: "widget_revenue_bar",
      type: "bar-chart",
      title: "Bar Chart 8",
      layout: { x: 0, y: 8, w: 12, h: 4, minW: 6, minH: 4 },
      dataBinding: {
        dataSourceId: "ds_revenue",
        mapping: {
          measurements: [
            { field: "energySales", label: "에너지", unit: "", color: "#f7483b" },
            { field: "recSales", label: "REC", unit: "", color: "#f7b23b" },
            { field: "generationKwh", label: "발전", unit: "", color: "#eaf73b" },
            { field: "totalRevenue", label: "총 이득", unit: "", color: "#20bc4f" },
          ],
          timeField: "siteId",
        },
      },
      style: { backgroundColor: "#ffffff", borderRadius: 8, padding: 16, shadow: "sm" },
      options: { showLegend: true, horizontal: false },
    },
  ],
  linkages: [],
};

// 대시보드 2: 테스트 대시보드
const testDashboardSchema = {
  version: "1.0.0",
  settings: {
    refreshInterval: 0,
    theme: "light",
    gridColumns: 24,
    rowHeight: 40,
  },
  dataSources: [],
  filters: [],
  widgets: [
    {
      id: "widget_test_bar",
      type: "bar-chart",
      title: "Bar Chart 2",
      layout: { x: 3, y: 0, w: 9, h: 4, minW: 6, minH: 4 },
      dataBinding: {
        dataSourceId: "ds_inverter",
        mapping: {
          measurements: [{ field: "totalEnergy", label: "d", unit: "fd" }],
          timeField: "assetName",
        },
      },
      style: { backgroundColor: "#ffffff", borderRadius: 8, padding: 16, shadow: "sm" },
      options: { showLegend: true, horizontal: false },
    },
    {
      id: "widget_test_kpi",
      type: "kpi-card",
      title: "KPI Card 2",
      layout: { x: 0, y: 0, w: 3, h: 3, minW: 3, minH: 3 },
      style: { backgroundColor: "#ffffff", borderRadius: 8, padding: 16, shadow: "sm" },
      options: { showTrend: true, icon: "Activity" },
    },
  ],
  linkages: [],
};

// 대시보드 3: 빈 대시보드
const emptyDashboardSchema = {
  version: "1.0.0",
  settings: {
    refreshInterval: 0,
    theme: "light",
    gridColumns: 24,
    rowHeight: 40,
  },
  dataSources: [],
  filters: [],
  widgets: [],
  linkages: [],
};

// 발전소 데이터
const sites = [
  { name: "서울 태양광 1호", location: "서울특별시 강남구", capacity: 500, latitude: 37.5172, longitude: 127.0473 },
  { name: "부산 태양광 2호", location: "부산광역시 해운대구", capacity: 750, latitude: 35.1631, longitude: 129.1635 },
  { name: "제주 태양광 3호", location: "제주특별자치도 제주시", capacity: 1000, latitude: 33.4996, longitude: 126.5312 },
];

// 알람 메시지 템플릿
const alarmTemplates = [
  { code: "INV001", message: "인버터 과온 경보", category: "inverter", severity: "warning" },
  { code: "INV002", message: "인버터 통신 두절", category: "communication", severity: "critical" },
  { code: "INV003", message: "인버터 효율 저하", category: "inverter", severity: "info" },
  { code: "GRD001", message: "계통 전압 이상", category: "grid", severity: "warning" },
  { code: "GRD002", message: "계통 주파수 이상", category: "grid", severity: "critical" },
  { code: "WTH001", message: "강풍 주의보", category: "weather", severity: "warning" },
  { code: "WTH002", message: "낙뢰 감지", category: "weather", severity: "critical" },
  { code: "SYS001", message: "시스템 점검 필요", category: "system", severity: "info" },
];

// 유지보수 타입
const maintenanceTypes = [
  { type: "preventive", description: "정기 점검" },
  { type: "preventive", description: "패널 청소" },
  { type: "corrective", description: "인버터 팬 교체" },
  { type: "corrective", description: "케이블 재접속" },
  { type: "inspection", description: "열화상 검사" },
  { type: "inspection", description: "접지저항 측정" },
];

// 인버터 데이터 생성
function generateInverterData(assetId: string, ratedCapacity: number, hours: number = 24) {
  const data = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    let powerRatio = 0;
    if (hour >= 6 && hour <= 18) {
      const peakHour = 12;
      const distanceFromPeak = Math.abs(hour - peakHour);
      powerRatio = Math.max(0, 1 - distanceFromPeak / 6) * (0.7 + Math.random() * 0.3);
    }

    const activePower = ratedCapacity * powerRatio;

    data.push({
      assetId,
      timestamp,
      activePower: Math.round(activePower * 100) / 100,
      reactivePower: Math.round(activePower * 0.1 * 100) / 100,
      voltage: 380 + Math.random() * 10,
      current: activePower > 0 ? (activePower / 380) * 1000 : 0,
      frequency: 59.9 + Math.random() * 0.2,
      dailyEnergy: Math.round(activePower * (1 + Math.random() * 0.1) * 100) / 100,
      totalEnergy: Math.round((10000 + activePower * i) * 100) / 100,
      efficiency: powerRatio > 0 ? 95 + Math.random() * 4 : 0,
      temperature: 25 + Math.random() * 15,
    });
  }
  return data;
}

// 기상 데이터 생성
function generateWeatherData(siteId: string, hours: number = 24) {
  const data = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    let irradiance = 0;
    if (hour >= 6 && hour <= 18) {
      const peakHour = 12;
      const distanceFromPeak = Math.abs(hour - peakHour);
      irradiance = Math.max(0, 1000 * (1 - distanceFromPeak / 6)) * (0.8 + Math.random() * 0.2);
    }

    data.push({
      siteId,
      timestamp,
      irradiance: Math.round(irradiance * 10) / 10,
      temperature: 15 + Math.sin(((hour - 6) * Math.PI) / 12) * 10 + Math.random() * 3,
      humidity: 40 + Math.random() * 30,
      windSpeed: Math.random() * 8,
      windDirection: Math.random() * 360,
      rainfall: Math.random() > 0.9 ? Math.random() * 5 : 0,
      cloudCover: Math.random() * 50,
    });
  }
  return data;
}

// KPI 데이터 생성
function generateKpiData(siteId: string, capacity: number, days: number = 30) {
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);

    const sunHours = 4 + Math.random() * 4;
    const dailyGeneration = capacity * sunHours * (0.7 + Math.random() * 0.3);

    data.push({
      siteId,
      date,
      dailyGeneration: Math.round(dailyGeneration * 10) / 10,
      expectedGeneration: capacity * 6,
      pr: 75 + Math.random() * 15,
      availability: 95 + Math.random() * 5,
      capacityFactor: (dailyGeneration / (capacity * 24)) * 100,
      peakPower: capacity * (0.85 + Math.random() * 0.15),
      operatingHours: sunHours,
    });
  }
  return data;
}

// 알람 데이터 생성
function generateAlarmData(siteId: string, assetIds: string[], days: number = 7) {
  const data = [];
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * days * 24 * 60 * 60 * 1000);
    const template = alarmTemplates[Math.floor(Math.random() * alarmTemplates.length)];
    const isResolved = Math.random() > 0.3;

    data.push({
      siteId,
      assetId: Math.random() > 0.5 ? assetIds[Math.floor(Math.random() * assetIds.length)] : null,
      timestamp,
      severity: template.severity,
      code: template.code,
      message: template.message,
      category: template.category,
      status: isResolved ? "resolved" : Math.random() > 0.5 ? "acknowledged" : "active",
      resolvedAt: isResolved ? new Date(timestamp.getTime() + Math.random() * 4 * 60 * 60 * 1000) : null,
    });
  }
  return data;
}

// 유지보수 기록 생성
function generateMaintenanceData(siteId: string, assetIds: string[], months: number = 6) {
  const data = [];
  const now = new Date();

  for (let i = 0; i < 15; i++) {
    const scheduledDate = new Date(now.getTime() - Math.random() * months * 30 * 24 * 60 * 60 * 1000);
    const template = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
    const isCompleted = scheduledDate < now && Math.random() > 0.2;

    data.push({
      siteId,
      assetId: Math.random() > 0.3 ? assetIds[Math.floor(Math.random() * assetIds.length)] : null,
      scheduledDate,
      completedDate: isCompleted ? new Date(scheduledDate.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000) : null,
      type: template.type,
      description: template.description,
      technician: ["김기사", "이기사", "박기사", "최기사"][Math.floor(Math.random() * 4)],
      cost: Math.floor(Math.random() * 500000) + 50000,
      status: isCompleted ? "completed" : scheduledDate > now ? "scheduled" : "in_progress",
      notes: isCompleted ? "작업 완료" : null,
    });
  }
  return data;
}

// 전력 가격 데이터 생성
function generateEnergyPriceData(hours: number = 72) {
  const data = [];
  const now = new Date();
  const regions = ["수도권", "비수도권", "제주"];

  for (const region of regions) {
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      timestamp.setMinutes(0, 0, 0);
      const hour = timestamp.getHours();

      // 피크 시간대 가격 변동
      let baseSmp = 100;
      if (hour >= 10 && hour <= 12) baseSmp = 150; // 오전 피크
      if (hour >= 17 && hour <= 21) baseSmp = 180; // 저녁 피크
      if (hour >= 23 || hour <= 5) baseSmp = 70; // 심야

      if (region === "제주") baseSmp *= 0.85;

      data.push({
        timestamp,
        region,
        smp: baseSmp + Math.random() * 30 - 15,
        rec: 30000 + Math.random() * 10000,
        priceType: "hourly",
      });
    }
  }
  return data;
}

// 계량기 데이터 생성
function generateMeterData(siteId: string, hours: number = 24) {
  const data = [];
  const now = new Date();
  const meterId = `MTR-${siteId.slice(-4)}`;

  let cumulativeExport = 50000;
  let cumulativeImport = 1000;

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    const isGenerating = hour >= 6 && hour <= 18;
    const hourlyExport = isGenerating ? 50 + Math.random() * 100 : 0;
    const hourlyImport = isGenerating ? Math.random() * 5 : 5 + Math.random() * 10;

    cumulativeExport += hourlyExport;
    cumulativeImport += hourlyImport;

    data.push({
      siteId,
      meterId,
      timestamp,
      activeExport: Math.round(cumulativeExport * 100) / 100,
      activeImport: Math.round(cumulativeImport * 100) / 100,
      reactiveExport: Math.round(cumulativeExport * 0.05 * 100) / 100,
      reactiveImport: Math.round(cumulativeImport * 0.1 * 100) / 100,
      maxDemand: 100 + Math.random() * 50,
      powerFactor: 95 + Math.random() * 5,
    });
  }
  return data;
}

// ESS 배터리 데이터 생성
function generateBatteryData(siteId: string, hours: number = 24) {
  const data = [];
  const now = new Date();
  const batteryId = `BAT-${siteId.slice(-4)}`;

  let soc = 50;

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    // 충전/방전 패턴
    let power = 0;
    let status = "idle";

    if (hour >= 10 && hour <= 14) {
      // 낮: 충전
      power = 50 + Math.random() * 50;
      soc = Math.min(100, soc + power * 0.1);
      status = "charging";
    } else if (hour >= 18 && hour <= 21) {
      // 저녁 피크: 방전
      power = -(50 + Math.random() * 50);
      soc = Math.max(10, soc + power * 0.1);
      status = "discharging";
    }

    data.push({
      siteId,
      batteryId,
      timestamp,
      soc: Math.round(soc * 10) / 10,
      soh: 95 + Math.random() * 5,
      voltage: 750 + Math.random() * 50,
      current: power > 0 ? power / 750 : power / 750,
      power: Math.round(power * 10) / 10,
      temperature: 25 + Math.random() * 10,
      cycleCount: Math.floor(500 + Math.random() * 100),
      status,
    });
  }
  return data;
}

// 수익 데이터 생성
function generateRevenueData(siteId: string, capacity: number, days: number = 30) {
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);

    const generationKwh = capacity * (4 + Math.random() * 4) * (0.7 + Math.random() * 0.3);
    const avgSmpPrice = 100 + Math.random() * 50;
    const smpRevenue = generationKwh * avgSmpPrice;
    const recSales = generationKwh * 0.001 * (30000 + Math.random() * 10000);

    data.push({
      siteId,
      date,
      energySales: Math.round(smpRevenue),
      recSales: Math.round(recSales),
      smpRevenue: Math.round(smpRevenue),
      totalRevenue: Math.round(smpRevenue + recSales),
      generationKwh: Math.round(generationKwh * 10) / 10,
      avgSmpPrice: Math.round(avgSmpPrice * 10) / 10,
    });
  }
  return data;
}

// 계통 데이터 생성
function generateGridData(siteId: string, hours: number = 24) {
  const data = [];
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    const isGenerating = hour >= 6 && hour <= 18;
    const peakRatio = isGenerating ? Math.max(0, 1 - Math.abs(hour - 12) / 6) : 0;

    data.push({
      siteId,
      timestamp,
      gridVoltage: 22900 + Math.random() * 200 - 100,
      gridFrequency: 59.95 + Math.random() * 0.1,
      exportPower: peakRatio * (300 + Math.random() * 200),
      importPower: isGenerating ? Math.random() * 10 : 20 + Math.random() * 30,
      powerFactor: 95 + Math.random() * 5,
      gridStatus: "connected",
    });
  }
  return data;
}

// 모듈 데이터 생성
function generateModuleData(siteId: string, hours: number = 24) {
  const data = [];
  const now = new Date();
  const stringCount = 10;

  for (let s = 1; s <= stringCount; s++) {
    const stringId = `STR-${String(s).padStart(2, "0")}`;

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = timestamp.getHours();

      const isGenerating = hour >= 6 && hour <= 18;
      const peakRatio = isGenerating ? Math.max(0, 1 - Math.abs(hour - 12) / 6) * (0.8 + Math.random() * 0.2) : 0;
      const irradiance = peakRatio * 1000;

      data.push({
        siteId,
        stringId,
        timestamp,
        voltage: isGenerating ? 600 + Math.random() * 50 : 0,
        current: isGenerating ? peakRatio * (8 + Math.random() * 2) : 0,
        power: peakRatio * (5 + Math.random()),
        temperature: 25 + peakRatio * 20 + Math.random() * 5,
        irradiance,
        soiling: Math.random() * 10,
      });
    }
  }
  return data;
}

async function main() {
  console.log("🌱 Seeding database...");

  // 기존 데이터 확인
  const existingUsers = await prisma.user.count();
  const existingSites = await prisma.site.count();

  if (existingUsers > 0 && existingSites > 0) {
    console.log("✅ Database already seeded. Skipping...");
    return;
  }

  // 사용자 생성
  if (existingUsers === 0) {
    const adminUser = await prisma.user.create({
      data: { email: "admin@example.com", name: "관리자", role: "admin" },
    });
    console.log(`👤 Created admin user: ${adminUser.email}`);

    const viewerUser = await prisma.user.create({
      data: { email: "viewer@example.com", name: "뷰어", role: "viewer" },
    });
    console.log(`👤 Created viewer user: ${viewerUser.email}`);

    // 대시보드 1: 태양광 발전소 종합 모니터링
    const dashboard1 = await prisma.dashboard.create({
      data: {
        title: "태양광 발전소 종합 모니터링",
        description: "전국 PV 발전소 실시간 현황 대시보드",
        schema: JSON.stringify(mainDashboardSchema),
        version: "1.0.0",
        isPublished: true,
        createdBy: adminUser.id,
      },
    });
    console.log(`📊 Created dashboard: ${dashboard1.title}`);

    await prisma.dashboardPermission.create({
      data: { dashboardId: dashboard1.id, userId: viewerUser.id, permission: "view" },
    });

    // 대시보드 2: 테스트 대시보드
    const dashboard2 = await prisma.dashboard.create({
      data: {
        title: "Untitled Dashboard",
        schema: JSON.stringify(testDashboardSchema),
        version: "1.0.0",
        isPublished: false,
        createdBy: adminUser.id,
      },
    });
    console.log(`📊 Created dashboard: ${dashboard2.title} (test)`);

    // 대시보드 3: 빈 대시보드
    const dashboard3 = await prisma.dashboard.create({
      data: {
        title: "Untitled Dashboard",
        schema: JSON.stringify(emptyDashboardSchema),
        version: "1.0.0",
        isPublished: false,
        createdBy: adminUser.id,
      },
    });
    console.log(`📊 Created dashboard: ${dashboard3.title} (empty)`);
  }

  // ====== Mock 데이터 생성 ======
  console.log("\n📡 Creating mock monitoring data...\n");

  // 발전소 생성
  const createdSites = [];
  for (const siteData of sites) {
    const site = await prisma.site.create({ data: siteData });
    createdSites.push(site);
    console.log(`🏭 Created site: ${site.name}`);
  }

  const inverterConfigs = [
    { prefix: "INV", count: 5, capacityBase: 100 },
    { prefix: "INV", count: 8, capacityBase: 93.75 },
    { prefix: "INV", count: 10, capacityBase: 100 },
  ];

  for (let siteIdx = 0; siteIdx < createdSites.length; siteIdx++) {
    const site = createdSites[siteIdx];
    const config = inverterConfigs[siteIdx];
    const assetIds: string[] = [];

    // 인버터 생성
    for (let i = 1; i <= config.count; i++) {
      const asset = await prisma.asset.create({
        data: {
          siteId: site.id,
          name: `${config.prefix}-${String(i).padStart(2, "0")}`,
          type: "inverter",
          manufacturer: ["SMA", "Huawei", "Sungrow"][Math.floor(Math.random() * 3)],
          model: `Model-${Math.floor(Math.random() * 100)}K`,
          ratedCapacity: config.capacityBase,
          installDate: new Date(2023, Math.floor(Math.random() * 12), 1),
          status: Math.random() > 0.1 ? "active" : "maintenance",
        },
      });
      assetIds.push(asset.id);

      // 인버터 시계열 데이터
      const inverterData = generateInverterData(asset.id, asset.ratedCapacity, 24);
      await prisma.inverterData.createMany({ data: inverterData });
    }
    console.log(`  ⚡ ${config.count} inverters with time-series data`);

    // 기상 데이터
    const weatherData = generateWeatherData(site.id, 24);
    await prisma.weatherData.createMany({ data: weatherData });
    console.log(`  🌤️ Weather data (24h)`);

    // KPI 데이터
    const kpiData = generateKpiData(site.id, site.capacity, 30);
    await prisma.kpiDaily.createMany({ data: kpiData });
    console.log(`  📈 KPI data (30 days)`);

    // 알람 데이터
    const alarmData = generateAlarmData(site.id, assetIds, 7);
    await prisma.alarm.createMany({ data: alarmData });
    console.log(`  🚨 Alarm data (20 records)`);

    // 유지보수 기록
    const maintenanceData = generateMaintenanceData(site.id, assetIds, 6);
    await prisma.maintenanceLog.createMany({ data: maintenanceData });
    console.log(`  🔧 Maintenance logs (15 records)`);

    // 계량기 데이터
    const meterData = generateMeterData(site.id, 24);
    await prisma.meterData.createMany({ data: meterData });
    console.log(`  📊 Meter data (24h)`);

    // ESS 배터리 데이터
    const batteryData = generateBatteryData(site.id, 24);
    await prisma.batteryData.createMany({ data: batteryData });
    console.log(`  🔋 Battery/ESS data (24h)`);

    // 수익 데이터
    const revenueData = generateRevenueData(site.id, site.capacity, 30);
    await prisma.revenue.createMany({ data: revenueData });
    console.log(`  💰 Revenue data (30 days)`);

    // 계통 데이터
    const gridData = generateGridData(site.id, 24);
    await prisma.gridData.createMany({ data: gridData });
    console.log(`  🔌 Grid data (24h)`);

    // 모듈 데이터 (첫번째 사이트만)
    if (siteIdx === 0) {
      const moduleData = generateModuleData(site.id, 24);
      await prisma.moduleData.createMany({ data: moduleData });
      console.log(`  ☀️ Module/String data (10 strings × 24h)`);
    }

    console.log("");
  }

  // 전력 가격 데이터 (전체)
  const priceData = generateEnergyPriceData(72);
  await prisma.energyPrice.createMany({ data: priceData });
  console.log(`💵 Energy price data (3 regions × 72h)`);

  console.log("\n✅ Seeding completed!\n");

  // 통계 출력
  const stats = {
    sites: await prisma.site.count(),
    assets: await prisma.asset.count(),
    inverterData: await prisma.inverterData.count(),
    weatherData: await prisma.weatherData.count(),
    kpiData: await prisma.kpiDaily.count(),
    alarms: await prisma.alarm.count(),
    maintenance: await prisma.maintenanceLog.count(),
    meterData: await prisma.meterData.count(),
    batteryData: await prisma.batteryData.count(),
    revenue: await prisma.revenue.count(),
    gridData: await prisma.gridData.count(),
    moduleData: await prisma.moduleData.count(),
    priceData: await prisma.energyPrice.count(),
  };

  console.log("📊 Database Statistics:");
  console.log(`   Sites: ${stats.sites}`);
  console.log(`   Assets (Inverters): ${stats.assets}`);
  console.log(`   Inverter Data: ${stats.inverterData}`);
  console.log(`   Weather Data: ${stats.weatherData}`);
  console.log(`   KPI Data: ${stats.kpiData}`);
  console.log(`   Alarms: ${stats.alarms}`);
  console.log(`   Maintenance Logs: ${stats.maintenance}`);
  console.log(`   Meter Data: ${stats.meterData}`);
  console.log(`   Battery Data: ${stats.batteryData}`);
  console.log(`   Revenue Data: ${stats.revenue}`);
  console.log(`   Grid Data: ${stats.gridData}`);
  console.log(`   Module Data: ${stats.moduleData}`);
  console.log(`   Price Data: ${stats.priceData}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
