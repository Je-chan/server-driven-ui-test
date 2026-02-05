import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const aggregation = searchParams.get("aggregation") ?? "latest";

    // 시간 범위 설정
    const now = new Date();
    const defaultStartTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const start = startTime ? new Date(startTime) : defaultStartTime;
    const end = endTime ? new Date(endTime) : now;

    if (aggregation === "latest") {
      // 각 사이트의 최신 기상 데이터
      const sites = await prisma.site.findMany({
        where: siteId ? { id: siteId } : undefined,
        include: {
          weatherData: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      });

      const data = sites
        .filter((site) => site.weatherData.length > 0)
        .map((site) => {
          const latest = site.weatherData[0];
          return {
            siteId: site.id,
            siteName: site.name,
            location: site.location,
            timestamp: latest.timestamp,
            irradiance: latest.irradiance,
            temperature: latest.temperature,
            humidity: latest.humidity,
            windSpeed: latest.windSpeed,
            windDirection: latest.windDirection,
            rainfall: latest.rainfall,
            cloudCover: latest.cloudCover,
          };
        });

      // 평균 데이터
      const summary = {
        avgIrradiance: data.length > 0
          ? data.reduce((sum, d) => sum + d.irradiance, 0) / data.length
          : 0,
        avgTemperature: data.length > 0
          ? data.reduce((sum, d) => sum + d.temperature, 0) / data.length
          : 0,
        avgHumidity: data.length > 0
          ? data.reduce((sum, d) => sum + (d.humidity ?? 0), 0) / data.length
          : 0,
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

    // 시계열 데이터
    const whereClause: {
      timestamp: { gte: Date; lte: Date };
      siteId?: string;
    } = {
      timestamp: { gte: start, lte: end },
    };

    if (siteId) {
      whereClause.siteId = siteId;
    }

    const weatherData = await prisma.weatherData.findMany({
      where: whereClause,
      include: {
        site: true,
      },
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    const data = weatherData.map((d) => ({
      siteId: d.siteId,
      siteName: d.site.name,
      timestamp: d.timestamp,
      irradiance: d.irradiance,
      temperature: d.temperature,
      humidity: d.humidity,
      windSpeed: d.windSpeed,
      windDirection: d.windDirection,
      rainfall: d.rainfall,
      cloudCover: d.cloudCover,
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
    console.error("Weather API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
