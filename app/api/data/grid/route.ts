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
    const aggregation = searchParams.get("aggregation") ?? "latest";

    // 시간 범위 설정
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const start = startTime ? parseDateStart(startTime) : defaultStart;
    const end = endTime ? parseDateEnd(endTime) : now;

    const baseWhere = siteId ? { siteId } : {};

    if (aggregation === "latest") {
      // 각 사이트의 최신 계통 데이터 (시간 범위 내)
      const latestData = await prisma.gridData.findMany({
        where: {
          ...baseWhere,
          timestamp: { gte: start, lte: end },
        },
        orderBy: { timestamp: "desc" },
        distinct: ["siteId"],
        take: 10,
      });

      const summary = {
        avgVoltage: latestData.length > 0 ? latestData.reduce((sum, d) => sum + d.gridVoltage, 0) / latestData.length : 0,
        avgFrequency: latestData.length > 0 ? latestData.reduce((sum, d) => sum + d.gridFrequency, 0) / latestData.length : 0,
        totalExport: latestData.reduce((sum, d) => sum + d.exportPower, 0),
        totalImport: latestData.reduce((sum, d) => sum + d.importPower, 0),
      };

      return NextResponse.json({
        success: true,
        data: latestData,
        summary,
        meta: { startTime: start, endTime: end, count: latestData.length },
      });
    }

    // 시계열 데이터
    const gridData = await prisma.gridData.findMany({
      where: {
        ...baseWhere,
        timestamp: { gte: start, lte: end },
      },
      orderBy: { timestamp: "asc" },
    });

    const bucketInterval = (!interval || interval === "auto") ? autoInterval(start, end) : interval;
    const data = aggregateTimeBuckets(gridData as unknown as Record<string, unknown>[], {
      interval: bucketInterval,
      timeField: "timestamp",
      valueFields: ["gridVoltage", "gridFrequency", "exportPower", "importPower", "powerFactor"],
    });

    return NextResponse.json({
      success: true,
      data,
      meta: { startTime: start, endTime: end, count: data.length, interval: bucketInterval },
    });
  } catch (error) {
    console.error("Grid API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch grid data" }, { status: 500 });
  }
}
