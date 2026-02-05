import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const assetId = searchParams.get("assetId");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const aggregation = searchParams.get("aggregation") ?? "latest"; // latest, avg, sum

    // 시간 범위 설정
    const now = new Date();
    const defaultStartTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24시간 전
    const start = startTime ? new Date(startTime) : defaultStartTime;
    const end = endTime ? new Date(endTime) : now;

    // 인버터 데이터 조회
    const whereClause: {
      timestamp: { gte: Date; lte: Date };
      assetId?: string;
      asset?: { siteId: string };
    } = {
      timestamp: { gte: start, lte: end },
    };

    if (assetId) {
      whereClause.assetId = assetId;
    } else if (siteId) {
      whereClause.asset = { siteId };
    }

    if (aggregation === "latest") {
      // 각 인버터의 최신 데이터
      const assets = await prisma.asset.findMany({
        where: siteId ? { siteId } : assetId ? { id: assetId } : undefined,
        include: {
          site: true,
          inverterData: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      const data = assets
        .filter((asset) => asset.inverterData.length > 0)
        .map((asset) => {
          const latest = asset.inverterData[0];
          return {
            assetId: asset.id,
            assetName: asset.name,
            siteId: asset.siteId,
            siteName: asset.site.name,
            timestamp: latest.timestamp,
            activePower: latest.activePower,
            reactivePower: latest.reactivePower,
            dailyEnergy: latest.dailyEnergy,
            totalEnergy: latest.totalEnergy,
            efficiency: latest.efficiency,
            temperature: latest.temperature,
            ratedCapacity: asset.ratedCapacity,
            manufacturer: asset.manufacturer,
            status: asset.status,
          };
        });

      // 집계 데이터
      const summary = {
        totalActivePower: data.reduce((sum, d) => sum + d.activePower, 0),
        totalDailyEnergy: data.reduce((sum, d) => sum + d.dailyEnergy, 0),
        avgEfficiency: data.length > 0
          ? data.reduce((sum, d) => sum + (d.efficiency ?? 0), 0) / data.length
          : 0,
        activeCount: data.filter((d) => d.activePower > 0).length,
        totalCount: data.length,
      };

      return NextResponse.json({
        success: true,
        data,
        summary,
        meta: {
          startTime: start,
          endTime: end,
          count: data.length,
        },
      });
    }

    // 시계열 데이터 (차트용)
    const inverterData = await prisma.inverterData.findMany({
      where: whereClause,
      include: {
        asset: {
          include: { site: true },
        },
      },
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    const data = inverterData.map((d) => ({
      assetId: d.assetId,
      assetName: d.asset.name,
      siteId: d.asset.siteId,
      siteName: d.asset.site.name,
      timestamp: d.timestamp,
      activePower: d.activePower,
      reactivePower: d.reactivePower,
      dailyEnergy: d.dailyEnergy,
      totalEnergy: d.totalEnergy,
      efficiency: d.efficiency,
      temperature: d.temperature,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: {
        startTime: start,
        endTime: end,
        count: data.length,
      },
    });
  } catch (error) {
    console.error("Inverter API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inverter data" },
      { status: 500 }
    );
  }
}
