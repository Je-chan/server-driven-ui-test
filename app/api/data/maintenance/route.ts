import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const whereClause: {
      siteId?: string;
      status?: string;
      type?: string;
    } = {};

    if (siteId) whereClause.siteId = siteId;
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const maintenanceData = await prisma.maintenanceLog.findMany({
      where: whereClause,
      orderBy: { scheduledDate: "desc" },
      take: limit,
    });

    // 통계
    const statusStats = await prisma.maintenanceLog.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const summary = {
      scheduled: statusStats.find((s) => s.status === "scheduled")?._count.id ?? 0,
      inProgress: statusStats.find((s) => s.status === "in_progress")?._count.id ?? 0,
      completed: statusStats.find((s) => s.status === "completed")?._count.id ?? 0,
      totalCost: maintenanceData.reduce((sum, d) => sum + (d.cost ?? 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: maintenanceData,
      summary,
      meta: { count: maintenanceData.length },
    });
  } catch (error) {
    console.error("Maintenance API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch maintenance data" }, { status: 500 });
  }
}
