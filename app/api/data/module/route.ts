import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const stringId = searchParams.get("stringId");
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const aggregation = searchParams.get("aggregation") ?? "latest";

    if (aggregation === "latest") {
      // 각 스트링의 최신 데이터
      const latestData = await prisma.moduleData.findMany({
        where: siteId ? { siteId } : stringId ? { stringId } : undefined,
        orderBy: { timestamp: "desc" },
        distinct: ["stringId"],
        take: 20,
      });

      const summary = {
        totalPower: latestData.reduce((sum, d) => sum + d.power, 0),
        avgVoltage: latestData.length > 0 ? latestData.reduce((sum, d) => sum + d.voltage, 0) / latestData.length : 0,
        avgCurrent: latestData.length > 0 ? latestData.reduce((sum, d) => sum + d.current, 0) / latestData.length : 0,
        avgTemperature: latestData.length > 0 ? latestData.reduce((sum, d) => sum + (d.temperature ?? 0), 0) / latestData.length : 0,
        stringCount: latestData.length,
      };

      return NextResponse.json({
        success: true,
        data: latestData,
        summary,
        meta: { count: latestData.length },
      });
    }

    // 시계열 데이터
    const moduleData = await prisma.moduleData.findMany({
      where: siteId ? { siteId } : stringId ? { stringId } : undefined,
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: moduleData,
      meta: { count: moduleData.length },
    });
  } catch (error) {
    console.error("Module API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch module data" }, { status: 500 });
  }
}
