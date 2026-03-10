import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { parseDateStart, parseDateEnd } from "@/src/shared/lib/date-utils";
import { aggregateTimeBuckets, autoInterval } from "@/src/shared/lib/time-bucket";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const stringId = searchParams.get("stringId");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const interval = searchParams.get("interval");

    // 시간 범위 설정
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const start = startTime ? parseDateStart(startTime) : defaultStart;
    const end = endTime ? parseDateEnd(endTime) : now;

    const baseWhere = {
      ...(siteId ? { siteId } : {}),
      ...(stringId ? { stringId } : {}),
    };

    if (!interval) {
      // 각 스트링의 최신 데이터 (시간 범위 내)
      const latestData = await prisma.moduleData.findMany({
        where: {
          ...baseWhere,
          timestamp: { gte: start, lte: end },
        },
        orderBy: { timestamp: "desc" },
        distinct: ["stringId"],
        take: 20,
      });

      return NextResponse.json({
        success: true,
        data: latestData,
      });
    }

    // 시계열 데이터
    const moduleData = await prisma.moduleData.findMany({
      where: {
        ...baseWhere,
        timestamp: { gte: start, lte: end },
      },
      orderBy: { timestamp: "asc" },
    });

    const bucketInterval = (!interval || interval === "auto") ? autoInterval(start, end) : interval;
    const data = aggregateTimeBuckets(moduleData as unknown as Record<string, unknown>[], {
      interval: bucketInterval,
      timeField: "timestamp",
      valueFields: ["voltage", "current", "power", "temperature"],
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Module API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch module data" }, { status: 500 });
  }
}
