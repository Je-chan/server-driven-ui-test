import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { parseDateStart, parseDateEnd } from "@/src/shared/lib/date-utils";
import { aggregateTimeBuckets, autoInterval } from "@/src/shared/lib/time-bucket";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const interval = searchParams.get("interval");

    // 시간 범위 설정
    const now = new Date();
    const defaultStartTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const start = startTime ? parseDateStart(startTime) : defaultStartTime;
    const end = endTime ? parseDateEnd(endTime) : now;

    if (!interval) {
      // 각 사이트의 최신 기상 데이터 (선택된 시간 범위 내)
      const sites = await prisma.site.findMany({
        where: siteId ? { id: siteId } : undefined,
        include: {
          weatherData: {
            where: { timestamp: { gte: start, lte: end } },
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

      return NextResponse.json({
        success: true,
        data,
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
    });

    const rawData = weatherData.map((d) => ({
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

    const bucketInterval = (!interval || interval === "auto") ? autoInterval(start, end) : interval;
    const data = aggregateTimeBuckets(rawData, {
      interval: bucketInterval,
      timeField: "timestamp",
      valueFields: ["irradiance", "temperature", "humidity", "windSpeed", "rainfall", "cloudCover"],
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Weather API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
