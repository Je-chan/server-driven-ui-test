import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ====== 사이트 프로파일 ======

interface SiteProfile {
  name: string;
  location: string;
  capacity: number;
  latitude: number;
  longitude: number;
  inverterCount: number;
  inverterCapacity: number;
  // 특성 프로파일
  cloudProbability: number; // 흐린 날 확률 (0~1)
  windOffset: number; // 풍속 오프셋 (m/s)
  tempOffset: number; // 온도 오프셋 (°C)
  degradation: number; // 노후도 (0~1, 1이 최상)
  description: string;
}

const siteProfiles: SiteProfile[] = [
  {
    name: "서울 태양광 1호",
    location: "서울특별시 강남구",
    capacity: 500,
    latitude: 37.5172,
    longitude: 127.0473,
    inverterCount: 5,
    inverterCapacity: 100,
    cloudProbability: 0.25,
    windOffset: 0,
    tempOffset: 0,
    degradation: 0.95,
    description: "도심 옥상",
  },
  {
    name: "부산 태양광 2호",
    location: "부산광역시 해운대구",
    capacity: 750,
    latitude: 35.1631,
    longitude: 129.1635,
    inverterCount: 8,
    inverterCapacity: 93.75,
    cloudProbability: 0.2,
    windOffset: 2,
    tempOffset: 2,
    degradation: 0.97,
    description: "해안가",
  },
  {
    name: "제주 태양광 3호",
    location: "제주특별자치도 제주시",
    capacity: 1000,
    latitude: 33.4996,
    longitude: 126.5312,
    inverterCount: 10,
    inverterCapacity: 100,
    cloudProbability: 0.3,
    windOffset: 5,
    tempOffset: 3,
    degradation: 0.96,
    description: "섬, 강풍",
  },
  {
    name: "세종 태양광 4호",
    location: "세종특별자치시",
    capacity: 2000,
    latitude: 36.48,
    longitude: 127.2598,
    inverterCount: 15,
    inverterCapacity: 133.3,
    cloudProbability: 0.2,
    windOffset: 1,
    tempOffset: -1,
    degradation: 0.98,
    description: "대규모 지상",
  },
  {
    name: "전남 태양광 5호",
    location: "전라남도 영암군",
    capacity: 3000,
    latitude: 34.7996,
    longitude: 126.6965,
    inverterCount: 20,
    inverterCapacity: 150,
    cloudProbability: 0.15,
    windOffset: 1.5,
    tempOffset: 1,
    degradation: 0.99,
    description: "유틸리티급",
  },
  {
    name: "경북 태양광 6호",
    location: "경상북도 경주시",
    capacity: 1500,
    latitude: 35.8562,
    longitude: 129.2247,
    inverterCount: 12,
    inverterCapacity: 125,
    cloudProbability: 0.2,
    windOffset: 0.5,
    tempOffset: 0,
    degradation: 0.96,
    description: "산업용 옥상",
  },
  {
    name: "충남 태양광 7호",
    location: "충청남도 당진시",
    capacity: 500,
    latitude: 36.8895,
    longitude: 126.6297,
    inverterCount: 5,
    inverterCapacity: 100,
    cloudProbability: 0.25,
    windOffset: 2,
    tempOffset: -2,
    degradation: 0.88,
    description: "ESS 연계, 노후",
  },
];

// ====== 알람 / 유지보수 템플릿 ======

const alarmTemplates = [
  { code: "INV001", message: "인버터 과온 경보", category: "inverter", severity: "warning" as const },
  { code: "INV002", message: "인버터 통신 두절", category: "communication", severity: "critical" as const },
  { code: "INV003", message: "인버터 효율 저하", category: "inverter", severity: "info" as const },
  { code: "INV004", message: "인버터 절연저항 이상", category: "inverter", severity: "warning" as const },
  { code: "INV005", message: "인버터 출력 불균형", category: "inverter", severity: "warning" as const },
  { code: "GRD001", message: "계통 전압 이상", category: "grid", severity: "warning" as const },
  { code: "GRD002", message: "계통 주파수 이상", category: "grid", severity: "critical" as const },
  { code: "GRD003", message: "역송전력 초과", category: "grid", severity: "warning" as const },
  { code: "WTH001", message: "강풍 주의보", category: "weather", severity: "warning" as const },
  { code: "WTH002", message: "낙뢰 감지", category: "weather", severity: "critical" as const },
  { code: "WTH003", message: "폭설 경보", category: "weather", severity: "critical" as const },
  { code: "BAT001", message: "배터리 과온", category: "battery", severity: "warning" as const },
  { code: "BAT002", message: "배터리 SOC 저하", category: "battery", severity: "warning" as const },
  { code: "SYS001", message: "시스템 점검 필요", category: "system", severity: "info" as const },
  { code: "SYS002", message: "데이터 수집 지연", category: "system", severity: "info" as const },
];

const maintenanceTypes = [
  { type: "preventive", description: "정기 점검" },
  { type: "preventive", description: "패널 청소" },
  { type: "preventive", description: "접속함 점검" },
  { type: "corrective", description: "인버터 팬 교체" },
  { type: "corrective", description: "케이블 재접속" },
  { type: "corrective", description: "퓨즈 교체" },
  { type: "corrective", description: "서지보호기 교체" },
  { type: "inspection", description: "열화상 검사" },
  { type: "inspection", description: "접지저항 측정" },
  { type: "inspection", description: "I-V 커브 측정" },
];

// ====== 유틸리티 ======

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 태양 고도에 따른 발전 비율 (일출 7:30, 일몰 17:30)
function solarRatio(hour: number, minute: number = 0): number {
  const t = hour + minute / 60;
  if (t < 7.5 || t > 17.5) return 0;
  const mid = 12.5;
  const halfSpan = 5;
  const x = (t - mid) / halfSpan;
  return Math.max(0, 1 - x * x); // 포물선 커브
}

// 흐린 날 감쇠 계수 (일 단위)
function cloudFactor(dayHash: number, cloudProb: number): number {
  const seeded = Math.sin(dayHash * 12.9898 + 78.233) * 43758.5453;
  const r = seeded - Math.floor(seeded);
  if (r < cloudProb) {
    return 0.3 + (seeded * 0.618 - Math.floor(seeded * 0.618)) * 0.3; // 30~60% 감소
  }
  return 1;
}

// ====== 하이브리드 해상도 타임스탬프 생성 ======
// 최근 24시간: 1분 간격, 2~7일: 5분 간격, 8~30일: 1시간 간격

function generateTimestamps(): Date[] {
  const now = new Date();
  const timestamps: Date[] = [];

  const MS_MIN = 60 * 1000;
  const MS_HOUR = 60 * MS_MIN;
  const MS_DAY = 24 * MS_HOUR;

  // Zone 3 (oldest): 30~8 days ago, 1-hour intervals
  const z3Start = now.getTime() - 30 * MS_DAY;
  const z3End = now.getTime() - 7 * MS_DAY;
  for (let t = z3Start; t < z3End; t += MS_HOUR) {
    timestamps.push(new Date(t));
  }

  // Zone 2: 7~1 days ago, 5-minute intervals
  const z2End = now.getTime() - 1 * MS_DAY;
  for (let t = z3End; t < z2End; t += 5 * MS_MIN) {
    timestamps.push(new Date(t));
  }

  // Zone 1 (newest): Last 24 hours, 1-minute intervals
  for (let t = z2End; t <= now.getTime(); t += MS_MIN) {
    timestamps.push(new Date(t));
  }

  return timestamps; // already sorted oldest → newest
}

// ====== 데이터 생성 함수 ======

function generateInverterData(
  assetId: string,
  ratedCapacity: number,
  timestamps: Date[],
  profile: SiteProfile,
) {
  const data = [];
  const startMs = timestamps[0].getTime();

  for (const timestamp of timestamps) {
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();
    const dayHash = timestamp.getFullYear() * 1000 + Math.floor(timestamp.getTime() / 86400000);

    const solar = solarRatio(hour, minute);
    const cloud = cloudFactor(dayHash, profile.cloudProbability);
    const powerRatio = solar * cloud * profile.degradation * (0.85 + Math.random() * 0.15);

    const activePower = ratedCapacity * powerRatio;
    const dailyEnergyAccum = activePower * (1 + Math.random() * 0.05);
    const hoursFromStart = (timestamp.getTime() - startMs) / (60 * 60 * 1000);

    data.push({
      assetId,
      timestamp,
      activePower: Math.round(activePower * 100) / 100,
      reactivePower: Math.round(activePower * 0.08 * 100) / 100,
      voltage: activePower > 0 ? 375 + Math.random() * 15 : 0,
      current: activePower > 0 ? (activePower / 380) * 1000 : 0,
      frequency: 59.9 + Math.random() * 0.2,
      dailyEnergy: Math.round(dailyEnergyAccum * 100) / 100,
      totalEnergy: Math.round((10000 + ratedCapacity * hoursFromStart * 0.2) * 100) / 100,
      efficiency: powerRatio > 0 ? 94 + Math.random() * 5 : 0,
      temperature: powerRatio > 0 ? 30 + powerRatio * 20 + Math.random() * 5 : 20 + Math.random() * 5,
    });
  }
  return data;
}

function generateWeatherData(siteId: string, timestamps: Date[], profile: SiteProfile) {
  const data = [];

  for (const timestamp of timestamps) {
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();
    const dayHash = timestamp.getFullYear() * 1000 + Math.floor(timestamp.getTime() / 86400000);

    const solar = solarRatio(hour, minute);
    const cloud = cloudFactor(dayHash, profile.cloudProbability);
    const irradiance = solar * cloud * 1000 * (0.9 + Math.random() * 0.1);

    const baseTemp = 10 + profile.tempOffset + Math.sin(((hour - 6) * Math.PI) / 12) * 12;
    const cloudCoverPct = (1 - cloud) * 80 + Math.random() * 20;

    data.push({
      siteId,
      timestamp,
      irradiance: Math.round(irradiance * 10) / 10,
      temperature: Math.round((baseTemp + Math.random() * 3) * 10) / 10,
      humidity: Math.round((45 + cloudCoverPct * 0.3 + Math.random() * 15) * 10) / 10,
      windSpeed: Math.round((profile.windOffset + Math.random() * 6) * 10) / 10,
      windDirection: Math.random() * 360,
      rainfall: cloud < 0.7 ? Math.round(Math.random() * 3 * 10) / 10 : 0,
      cloudCover: Math.round(cloudCoverPct * 10) / 10,
    });
  }
  return data;
}

function generateKpiData(siteId: string, capacity: number, days: number, profile: SiteProfile) {
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);

    const dayHash = date.getFullYear() * 1000 + Math.floor(date.getTime() / 86400000);
    const cloud = cloudFactor(dayHash, profile.cloudProbability);

    // 여름(6~8월) 일조시간 더 많음
    const month = date.getMonth();
    const seasonalHours = month >= 5 && month <= 7 ? 6 + Math.random() * 2 : 4 + Math.random() * 3;
    const sunHours = seasonalHours * cloud;

    const dailyGeneration = capacity * sunHours * profile.degradation * (0.75 + Math.random() * 0.25);

    data.push({
      siteId,
      date,
      dailyGeneration: Math.round(dailyGeneration * 10) / 10,
      expectedGeneration: capacity * 6,
      pr: Math.round((70 + cloud * 20 + Math.random() * 5) * 10) / 10,
      availability: Math.round((93 + Math.random() * 7) * 10) / 10,
      capacityFactor: Math.round(((dailyGeneration / (capacity * 24)) * 100) * 10) / 10,
      peakPower: Math.round(capacity * cloud * profile.degradation * (0.85 + Math.random() * 0.15) * 10) / 10,
      operatingHours: Math.round(sunHours * 10) / 10,
    });
  }
  return data;
}

function generateAlarmData(siteId: string, assetIds: string[], count: number) {
  const data = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000);
    const template = pick(alarmTemplates);
    const isResolved = Math.random() > 0.3;

    data.push({
      siteId,
      assetId: Math.random() > 0.4 ? pick(assetIds) : null,
      timestamp,
      severity: template.severity,
      code: template.code,
      message: template.message,
      category: template.category,
      status: isResolved ? "resolved" : Math.random() > 0.5 ? "acknowledged" : "active",
      resolvedAt: isResolved ? new Date(timestamp.getTime() + Math.random() * 6 * 60 * 60 * 1000) : null,
    });
  }
  return data;
}

function generateMaintenanceData(siteId: string, assetIds: string[], count: number) {
  const data = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const scheduledDate = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
    const template = pick(maintenanceTypes);
    const isCompleted = scheduledDate < now && Math.random() > 0.2;

    data.push({
      siteId,
      assetId: Math.random() > 0.3 ? pick(assetIds) : null,
      scheduledDate,
      completedDate: isCompleted ? new Date(scheduledDate.getTime() + rand(0.5, 3) * 24 * 60 * 60 * 1000) : null,
      type: template.type,
      description: template.description,
      technician: pick(["김기사", "이기사", "박기사", "최기사", "정기사", "한기사"]),
      cost: Math.floor(rand(50000, 800000)),
      status: isCompleted ? "completed" : scheduledDate > now ? "scheduled" : "in_progress",
      notes: isCompleted ? "작업 완료" : null,
    });
  }
  return data;
}

function generateEnergyPriceData(hours: number) {
  const data = [];
  const now = new Date();
  const regions = ["수도권", "비수도권", "제주"];

  for (const region of regions) {
    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
      timestamp.setMinutes(0, 0, 0);
      const hour = timestamp.getHours();

      let baseSmp = 100;
      if (hour >= 10 && hour <= 12) baseSmp = 150;
      if (hour >= 17 && hour <= 21) baseSmp = 180;
      if (hour >= 23 || hour <= 5) baseSmp = 70;

      if (region === "제주") baseSmp *= 0.85;
      if (region === "비수도권") baseSmp *= 0.95;

      data.push({
        timestamp,
        region,
        smp: Math.round((baseSmp + rand(-15, 15)) * 10) / 10,
        rec: Math.round((30000 + rand(-5000, 5000)) * 10) / 10,
        priceType: "hourly",
      });
    }
  }
  return data;
}

function generateMeterData(siteId: string, timestamps: Date[], profile: SiteProfile) {
  const data = [];
  const meterId = `MTR-${siteId.slice(-4)}`;

  let cumulativeExport = 50000 + profile.capacity * 10;
  let cumulativeImport = 1000 + profile.capacity;

  for (let idx = 0; idx < timestamps.length; idx++) {
    const timestamp = timestamps[idx];
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();
    const deltaH = idx > 0
      ? (timestamps[idx].getTime() - timestamps[idx - 1].getTime()) / (60 * 60 * 1000)
      : 1 / 60;

    const solar = solarRatio(hour, minute);
    const exportRate = solar > 0 ? profile.capacity * solar * 0.15 * (0.8 + Math.random() * 0.2) : 0;
    const importRate = solar > 0 ? rand(1, 5) : rand(5, 15);

    cumulativeExport += exportRate * deltaH;
    cumulativeImport += importRate * deltaH;

    data.push({
      siteId,
      meterId,
      timestamp,
      activeExport: Math.round(cumulativeExport * 100) / 100,
      activeImport: Math.round(cumulativeImport * 100) / 100,
      reactiveExport: Math.round(cumulativeExport * 0.05 * 100) / 100,
      reactiveImport: Math.round(cumulativeImport * 0.1 * 100) / 100,
      maxDemand: Math.round((profile.capacity * 0.3 + rand(0, profile.capacity * 0.1)) * 10) / 10,
      powerFactor: Math.round((95 + Math.random() * 5) * 10) / 10,
    });
  }
  return data;
}

function generateBatteryData(siteId: string, timestamps: Date[]) {
  const data = [];
  const batteryId = `BAT-${siteId.slice(-4)}`;

  let soc = 50;

  for (let idx = 0; idx < timestamps.length; idx++) {
    const timestamp = timestamps[idx];
    const hour = timestamp.getHours();
    // deltaH: 시간 단위 간격 (SOC 변화율 스케일링용)
    const deltaH = idx > 0
      ? (timestamps[idx].getTime() - timestamps[idx - 1].getTime()) / (60 * 60 * 1000)
      : 1 / 60;

    let power = 0;
    let status = "idle";

    if (hour >= 10 && hour <= 14) {
      // 낮: 태양광 잉여전력으로 충전
      power = 50 + Math.random() * 50;
      soc = Math.min(95, soc + power * 0.08 * deltaH);
      status = "charging";
    } else if (hour >= 18 && hour <= 22) {
      // 저녁 피크: 방전
      power = -(40 + Math.random() * 60);
      soc = Math.max(15, soc + power * 0.08 * deltaH);
      status = "discharging";
    } else if (hour >= 2 && hour <= 5) {
      // 심야: 저렴한 전기로 소량 충전
      power = 20 + Math.random() * 20;
      soc = Math.min(60, soc + power * 0.05 * deltaH);
      status = "charging";
    }

    data.push({
      siteId,
      batteryId,
      timestamp,
      soc: Math.round(soc * 10) / 10,
      soh: Math.round((92 + Math.random() * 8) * 10) / 10,
      voltage: Math.round((740 + Math.random() * 60) * 10) / 10,
      current: power !== 0 ? Math.round((power / 750) * 1000) / 1000 : 0,
      power: Math.round(power * 10) / 10,
      temperature: Math.round((25 + Math.abs(power) * 0.05 + Math.random() * 5) * 10) / 10,
      cycleCount: Math.floor(400 + Math.random() * 200),
      status,
    });
  }
  return data;
}

function generateRevenueData(siteId: string, capacity: number, days: number, profile: SiteProfile) {
  const data = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);

    const dayHash = date.getFullYear() * 1000 + Math.floor(date.getTime() / 86400000);
    const cloud = cloudFactor(dayHash, profile.cloudProbability);
    const month = date.getMonth();
    const seasonalFactor = month >= 5 && month <= 7 ? 1.3 : month >= 11 || month <= 1 ? 0.7 : 1.0;

    const generationKwh = capacity * (4 + rand(0, 4)) * cloud * profile.degradation * seasonalFactor;
    const avgSmpPrice = 100 + rand(-20, 40);
    const smpRevenue = generationKwh * avgSmpPrice;
    const recSales = generationKwh * 0.001 * (30000 + rand(-5000, 5000));

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

function generateGridData(siteId: string, timestamps: Date[], profile: SiteProfile) {
  const data = [];

  for (const timestamp of timestamps) {
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();

    const solar = solarRatio(hour, minute);
    const exportPower = solar > 0 ? profile.capacity * solar * 0.6 * (0.8 + Math.random() * 0.2) : 0;
    const importPower = solar > 0 ? rand(1, 10) : rand(10, 40);

    data.push({
      siteId,
      timestamp,
      gridVoltage: Math.round((22900 + rand(-100, 100)) * 10) / 10,
      gridFrequency: Math.round((59.95 + Math.random() * 0.1) * 1000) / 1000,
      exportPower: Math.round(exportPower * 10) / 10,
      importPower: Math.round(importPower * 10) / 10,
      powerFactor: Math.round((95 + Math.random() * 5) * 10) / 10,
      gridStatus: "connected",
    });
  }
  return data;
}

function generateModuleData(siteId: string, timestamps: Date[], profile: SiteProfile, stringCount: number = 5) {
  const data = [];

  for (let s = 1; s <= stringCount; s++) {
    const stringId = `STR-${String(s).padStart(2, "0")}`;

    for (const timestamp of timestamps) {
      const hour = timestamp.getHours();
      const minute = timestamp.getMinutes();
      const dayHash = timestamp.getFullYear() * 1000 + Math.floor(timestamp.getTime() / 86400000);

      const solar = solarRatio(hour, minute);
      const cloud = cloudFactor(dayHash, profile.cloudProbability);
      const peakRatio = solar * cloud * profile.degradation * (0.85 + Math.random() * 0.15);
      const irradiance = solar * cloud * 1000;

      data.push({
        siteId,
        stringId,
        timestamp,
        voltage: peakRatio > 0 ? Math.round((600 + Math.random() * 50) * 10) / 10 : 0,
        current: peakRatio > 0 ? Math.round((peakRatio * (8 + Math.random() * 2)) * 100) / 100 : 0,
        power: Math.round((peakRatio * (5 + Math.random())) * 100) / 100,
        temperature: Math.round((25 + peakRatio * 20 + Math.random() * 5) * 10) / 10,
        irradiance: Math.round(irradiance * 10) / 10,
        soiling: Math.round(Math.random() * 10 * 10) / 10,
      });
    }
  }
  return data;
}

// ====== 대시보드 스키마 JSON 로딩 ======

/**
 * JSON 시드 파일에는 이전 seed 실행 시 생성된 사이트 ID가 하드코딩되어 있다.
 * seed 재실행 시 새로운 사이트 ID로 치환해야 한다.
 *
 * 치환 전략: siteProfiles 배열 순서(= 사이트 생성 순서)에 맞춰
 * old ID → new ID 문자열 치환을 수행한다.
 */
const OLD_SITE_IDS = [
  "cmmlb8nyh0002tauyjz04lpgy", // 서울 태양광 1호
  "cmmlb8oyo14d1tauy8rn1z48d", // 부산 태양광 2호
  "cmmlb8q7w2hc9tauycv78v26r", // 제주 태양광 3호
  "cmmlb8rnj402btauymlkivuzo", // 세종 태양광 4호
  "cmmlb8tjx5x5gtauy79tkl26x", // 전남 태양광 5호
  "cmmlb8vxh88lotauy6l5qiqzd", // 경북 태양광 6호
  "cmmlb8xon9x2ktauy2utip2d2", // 충남 태양광 7호
];

function loadDashboardSchema(
  filename: string,
  newSiteIds: string[],
): Record<string, unknown> {
  const filePath = path.join(__dirname, "seeds", filename);
  let text = fs.readFileSync(filePath, "utf-8");

  // old site ID → new site ID 치환
  for (let i = 0; i < OLD_SITE_IDS.length && i < newSiteIds.length; i++) {
    text = text.replaceAll(OLD_SITE_IDS[i], newSiteIds[i]);
  }

  return JSON.parse(text);
}


// ====== Main ======

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. 전체 데이터 클린업
  console.log("🗑️  Cleaning up existing data...");
  await prisma.dashboardPermission.deleteMany();
  await prisma.dashboard.deleteMany();
  await prisma.inverterData.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.weatherData.deleteMany();
  await prisma.kpiDaily.deleteMany();
  await prisma.alarm.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.meterData.deleteMany();
  await prisma.batteryData.deleteMany();
  await prisma.revenue.deleteMany();
  await prisma.gridData.deleteMany();
  await prisma.moduleData.deleteMany();
  await prisma.energyPrice.deleteMany();
  await prisma.site.deleteMany();
  await prisma.user.deleteMany();
  console.log("   Done.\n");

  // 2. 사용자 생성
  const adminUser = await prisma.user.create({
    data: { email: "admin@example.com", name: "관리자", role: "admin" },
  });
  const viewerUser = await prisma.user.create({
    data: { email: "viewer@example.com", name: "뷰어", role: "viewer" },
  });
  console.log(`👤 Users: ${adminUser.email}, ${viewerUser.email}\n`);

  // 3. 하이브리드 해상도 타임스탬프 생성
  const timestamps = generateTimestamps();
  const tsCount = timestamps.length;
  console.log(`📡 Generating hybrid-resolution data (30 days, ${tsCount} timestamps/entity)...`);
  console.log(`   Zone 3 (30~8d): 1h intervals | Zone 2 (7~1d): 5min | Zone 1 (24h): 1min\n`);

  const KPI_DAYS = 60;
  const REVENUE_DAYS = 60;
  const PRICE_HOURS = 720; // 30일

  const createdSites: { id: string; name: string; capacity: number }[] = [];
  const allAssetIds: Record<string, string[]> = {};

  for (const profile of siteProfiles) {
    const site = await prisma.site.create({
      data: {
        name: profile.name,
        location: profile.location,
        capacity: profile.capacity,
        latitude: profile.latitude,
        longitude: profile.longitude,
      },
    });
    createdSites.push({ id: site.id, name: site.name, capacity: site.capacity });
    console.log(`🏭 ${site.name} (${profile.description}, ${profile.capacity}kW)`);

    const assetIds: string[] = [];

    // 인버터 생성 + 시계열 데이터
    for (let i = 1; i <= profile.inverterCount; i++) {
      const asset = await prisma.asset.create({
        data: {
          siteId: site.id,
          name: `INV-${String(i).padStart(2, "0")}`,
          type: "inverter",
          manufacturer: pick(["SMA", "Huawei", "Sungrow", "ABB", "Fronius"]),
          model: `Model-${randInt(50, 200)}K`,
          ratedCapacity: profile.inverterCapacity,
          installDate: new Date(2023, randInt(0, 11), 1),
          status: Math.random() > 0.08 ? "active" : "maintenance",
        },
      });
      assetIds.push(asset.id);

      const inverterData = generateInverterData(asset.id, asset.ratedCapacity, timestamps, profile);
      for (let batch = 0; batch < inverterData.length; batch += 500) {
        await prisma.inverterData.createMany({ data: inverterData.slice(batch, batch + 500) });
      }
    }
    allAssetIds[site.id] = assetIds;
    console.log(`   ⚡ ${profile.inverterCount} inverters × ${tsCount} pts`);

    // 기상 데이터
    const weatherData = generateWeatherData(site.id, timestamps, profile);
    for (let batch = 0; batch < weatherData.length; batch += 500) {
      await prisma.weatherData.createMany({ data: weatherData.slice(batch, batch + 500) });
    }
    console.log(`   🌤️ Weather: ${weatherData.length}`);

    // KPI 데이터
    const kpiData = generateKpiData(site.id, site.capacity, KPI_DAYS, profile);
    await prisma.kpiDaily.createMany({ data: kpiData });
    console.log(`   📈 KPI: ${kpiData.length} days`);

    // 알람 데이터 (50건)
    const alarmData = generateAlarmData(site.id, assetIds, 50);
    await prisma.alarm.createMany({ data: alarmData });
    console.log(`   🚨 Alarms: ${alarmData.length}`);

    // 유지보수 기록 (30건)
    const maintenanceData = generateMaintenanceData(site.id, assetIds, 30);
    await prisma.maintenanceLog.createMany({ data: maintenanceData });
    console.log(`   🔧 Maintenance: ${maintenanceData.length}`);

    // 계량기 데이터
    const meterData = generateMeterData(site.id, timestamps, profile);
    for (let batch = 0; batch < meterData.length; batch += 500) {
      await prisma.meterData.createMany({ data: meterData.slice(batch, batch + 500) });
    }
    console.log(`   📊 Meter: ${meterData.length}`);

    // ESS 배터리 데이터
    const batteryData = generateBatteryData(site.id, timestamps);
    for (let batch = 0; batch < batteryData.length; batch += 500) {
      await prisma.batteryData.createMany({ data: batteryData.slice(batch, batch + 500) });
    }
    console.log(`   🔋 Battery: ${batteryData.length}`);

    // 수익 데이터
    const revenueData = generateRevenueData(site.id, site.capacity, REVENUE_DAYS, profile);
    await prisma.revenue.createMany({ data: revenueData });
    console.log(`   💰 Revenue: ${revenueData.length} days`);

    // 계통 데이터
    const gridData = generateGridData(site.id, timestamps, profile);
    for (let batch = 0; batch < gridData.length; batch += 500) {
      await prisma.gridData.createMany({ data: gridData.slice(batch, batch + 500) });
    }
    console.log(`   🔌 Grid: ${gridData.length}`);

    // 모듈 데이터 (5 스트링)
    const moduleData = generateModuleData(site.id, timestamps, profile, 5);
    for (let batch = 0; batch < moduleData.length; batch += 500) {
      await prisma.moduleData.createMany({ data: moduleData.slice(batch, batch + 500) });
    }
    console.log(`   ☀️ Module: ${moduleData.length} (5 strings)`);

    console.log("");
  }

  // 전력 가격 데이터 (30일)
  const priceData = generateEnergyPriceData(PRICE_HOURS);
  for (let batch = 0; batch < priceData.length; batch += 500) {
    await prisma.energyPrice.createMany({ data: priceData.slice(batch, batch + 500) });
  }
  console.log(`💵 Energy price: ${priceData.length} (3 regions × 30d hourly)\n`);

  // 4. 대시보드 생성
  console.log("📊 Creating dashboards...\n");

  const newSiteIds = createdSites.map((s) => s.id);

  const dashboards = [
    {
      title: "태양광 발전소 종합 모니터링",
      description: "전국 PV 발전소 실시간 현황 대시보드",
      schema: loadDashboardSchema("dashboard-main.json", newSiteIds),
      isPublished: true,
    },
    {
      title: "발전소 비교 분석",
      description: "전체 발전소 KPI, 발전량, 수익 비교 대시보드",
      schema: loadDashboardSchema("dashboard-comparison.json", newSiteIds),
      isPublished: true,
    },
    {
      title: "인버터 상세 분석",
      description: "인버터 성능, 온도, 스트링 출력 상세 분석 대시보드",
      schema: loadDashboardSchema("dashboard-inverter.json", newSiteIds),
      isPublished: true,
    },
    {
      title: "설비 점검 보고서",
      description: "현장 설비 점검 결과를 입력하고 제출하는 폼 대시보드",
      schema: loadDashboardSchema("dashboard-inspection.json", newSiteIds),
      isPublished: true,
    },
    {
      title: "조건부 렌더링 데모",
      description: "토글/탭 필터로 위젯을 조건부 표시하는 데모 대시보드",
      schema: loadDashboardSchema("dashboard-conditional.json", newSiteIds),
      isPublished: true,
    },
  ];

  for (const db of dashboards) {
    const created = await prisma.dashboard.create({
      data: {
        title: db.title,
        description: db.description,
        schema: JSON.stringify(db.schema),
        version: "1.0.0",
        isPublished: db.isPublished,
        createdBy: adminUser.id,
      },
    });

    if (db.isPublished) {
      await prisma.dashboardPermission.create({
        data: { dashboardId: created.id, userId: viewerUser.id, permission: "view" },
      });
    }

    console.log(`   ${db.isPublished ? "✅" : "📝"} ${db.title}`);
  }

  // 5. 통계 출력
  console.log("\n📊 Database Statistics:");
  const stats = {
    sites: await prisma.site.count(),
    assets: await prisma.asset.count(),
    dashboards: await prisma.dashboard.count(),
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

  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  console.log(`   Sites: ${stats.sites}`);
  console.log(`   Assets (Inverters): ${stats.assets}`);
  console.log(`   Dashboards: ${stats.dashboards}`);
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
  console.log(`   ─────────────────`);
  console.log(`   Total Records: ${total}`);
  console.log("\n✅ Seeding completed!\n");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
