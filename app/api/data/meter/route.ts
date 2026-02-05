import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const meterId = searchParams.get("meterId");
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const aggregation = searchParams.get("aggregation") ?? "latest";

    if (aggregation === "latest") {
      // 각 계량기의 최신 데이터
      const latestData = await prisma.meterData.findMany({
        where: siteId ? { siteId } : meterId ? { meterId } : undefined,
        orderBy: { timestamp: "desc" },
        distinct: ["meterId"],
        take: 10,
      });

      const summary = {
        totalExport: latestData.reduce((sum, d) => sum + d.activeExport, 0),
        totalImport: latestData.reduce((sum, d) => sum + d.activeImport, 0),
        avgPowerFactor: latestData.length > 0 ? latestData.reduce((sum, d) => sum + (d.powerFactor ?? 0), 0) / latestData.length : 0,
      };

      return NextResponse.json({
        success: true,
        data: latestData,
        summary,
        meta: { count: latestData.length },
      });
    }

    // 시계열 데이터
    const meterData = await prisma.meterData.findMany({
      where: siteId ? { siteId } : meterId ? { meterId } : undefined,
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: meterData,
      meta: { count: meterData.length },
    });
  } catch (error) {
    console.error("Meter API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch meter data" }, { status: 500 });
  }
}
