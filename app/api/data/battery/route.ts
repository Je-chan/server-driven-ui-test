import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const batteryId = searchParams.get("batteryId");
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const aggregation = searchParams.get("aggregation") ?? "latest";

    if (aggregation === "latest") {
      // 각 배터리의 최신 데이터
      const latestData = await prisma.batteryData.findMany({
        where: siteId ? { siteId } : batteryId ? { batteryId } : undefined,
        orderBy: { timestamp: "desc" },
        distinct: ["batteryId"],
        take: 10,
      });

      const summary = {
        avgSoc: latestData.length > 0 ? latestData.reduce((sum, d) => sum + d.soc, 0) / latestData.length : 0,
        totalPower: latestData.reduce((sum, d) => sum + d.power, 0),
        chargingCount: latestData.filter((d) => d.status === "charging").length,
        dischargingCount: latestData.filter((d) => d.status === "discharging").length,
      };

      return NextResponse.json({
        success: true,
        data: latestData,
        summary,
        meta: { count: latestData.length },
      });
    }

    // 시계열 데이터
    const batteryData = await prisma.batteryData.findMany({
      where: siteId ? { siteId } : batteryId ? { batteryId } : undefined,
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: batteryData,
      meta: { count: batteryData.length },
    });
  } catch (error) {
    console.error("Battery API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch battery data" }, { status: 500 });
  }
}
