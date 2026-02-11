import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { parseDateStart, parseDateEnd } from "@/src/shared/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const startDate = searchParams.get("startDate") ?? searchParams.get("startTime");
    const endDate = searchParams.get("endDate") ?? searchParams.get("endTime");
    const limit = parseInt(searchParams.get("limit") ?? "30");

    // 날짜 범위 설정
    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = startDate ? parseDateStart(startDate) : defaultStartDate;
    const end = endDate ? parseDateEnd(endDate) : now;

    const whereClause: {
      date: { gte: Date; lte: Date };
      siteId?: string;
    } = {
      date: { gte: start, lte: end },
    };

    if (siteId) {
      whereClause.siteId = siteId;
    }

    // KPI 데이터 조회
    const kpiData = await prisma.kpiDaily.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: limit,
    });

    // 사이트 정보 가져오기
    const siteIds = [...new Set(kpiData.map((d) => d.siteId))];
    const sites = await prisma.site.findMany({
      where: { id: { in: siteIds } },
    });
    const siteMap = new Map(sites.map((s) => [s.id, s]));

    const data = kpiData.map((d) => {
      const site = siteMap.get(d.siteId);
      return {
        siteId: d.siteId,
        siteName: site?.name ?? "Unknown",
        date: d.date,
        dailyGeneration: d.dailyGeneration,
        expectedGeneration: d.expectedGeneration,
        pr: d.pr,
        availability: d.availability,
        capacityFactor: d.capacityFactor,
        peakPower: d.peakPower,
        operatingHours: d.operatingHours,
      };
    });

    // 요약 통계 (전체 기간)
    const summary = {
      totalGeneration: data.reduce((sum, d) => sum + d.dailyGeneration, 0),
      avgDailyGeneration: data.length > 0
        ? data.reduce((sum, d) => sum + d.dailyGeneration, 0) / data.length
        : 0,
      avgPr: data.length > 0
        ? data.reduce((sum, d) => sum + (d.pr ?? 0), 0) / data.length
        : 0,
      avgAvailability: data.length > 0
        ? data.reduce((sum, d) => sum + (d.availability ?? 0), 0) / data.length
        : 0,
      maxPeakPower: Math.max(...data.map((d) => d.peakPower ?? 0)),
    };

    return NextResponse.json({
      success: true,
      data,
      summary,
      meta: {
        startDate: start,
        endDate: end,
        count: data.length,
      },
    });
  } catch (error) {
    console.error("KPI API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch KPI data" },
      { status: 500 }
    );
  }
}
