import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { parseDateStart, parseDateEnd } from "@/src/shared/lib/date-utils";
import { aggregateTimeBuckets, autoInterval } from "@/src/shared/lib/time-bucket";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const interval = searchParams.get("interval");
    const aggregation = searchParams.get("aggregation") ?? "latest";

    // 시간 범위 설정
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const start = startTime ? parseDateStart(startTime) : defaultStart;
    const end = endTime ? parseDateEnd(endTime) : now;

    const baseWhere = region ? { region } : {};

    if (aggregation === "latest") {
      // 각 지역의 최신 가격
      const latestData = await prisma.energyPrice.findMany({
        where: {
          ...baseWhere,
          timestamp: { gte: start, lte: end },
        },
        orderBy: { timestamp: "desc" },
        distinct: ["region"],
      });

      const summary = {
        avgSmp: latestData.length > 0 ? latestData.reduce((sum, d) => sum + d.smp, 0) / latestData.length : 0,
        avgRec: latestData.length > 0 ? latestData.reduce((sum, d) => sum + (d.rec ?? 0), 0) / latestData.length : 0,
        regions: latestData.map((d) => ({ region: d.region, smp: d.smp, rec: d.rec })),
      };

      return NextResponse.json({
        success: true,
        data: latestData,
        summary,
        meta: { startTime: start, endTime: end, count: latestData.length },
      });
    }

    // 시계열 데이터
    const priceData = await prisma.energyPrice.findMany({
      where: {
        ...baseWhere,
        timestamp: { gte: start, lte: end },
      },
      orderBy: { timestamp: "asc" },
    });

    const bucketInterval = (!interval || interval === "auto") ? autoInterval(start, end) : interval;
    const data = aggregateTimeBuckets(priceData as unknown as Record<string, unknown>[], {
      interval: bucketInterval,
      timeField: "timestamp",
      valueFields: ["smp", "rec", "capacityPayment"],
    });

    return NextResponse.json({
      success: true,
      data,
      meta: { startTime: start, endTime: end, count: data.length, interval: bucketInterval },
    });
  } catch (error) {
    console.error("Price API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch price data" }, { status: 500 });
  }
}
