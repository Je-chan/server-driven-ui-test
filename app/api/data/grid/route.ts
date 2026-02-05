import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const limit = parseInt(searchParams.get("limit") ?? "100");
    const aggregation = searchParams.get("aggregation") ?? "latest";

    if (aggregation === "latest") {
      // 각 사이트의 최신 계통 데이터
      const latestData = await prisma.gridData.findMany({
        where: siteId ? { siteId } : undefined,
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
        meta: { count: latestData.length },
      });
    }

    // 시계열 데이터
    const gridData = await prisma.gridData.findMany({
      where: siteId ? { siteId } : undefined,
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: gridData,
      meta: { count: gridData.length },
    });
  } catch (error) {
    console.error("Grid API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch grid data" }, { status: 500 });
  }
}
