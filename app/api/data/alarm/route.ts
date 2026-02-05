import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const whereClause: {
      siteId?: string;
      severity?: string;
      status?: string;
    } = {};

    if (siteId) whereClause.siteId = siteId;
    if (severity) whereClause.severity = severity;
    if (status) whereClause.status = status;

    const alarms = await prisma.alarm.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // 통계
    const stats = await prisma.alarm.groupBy({
      by: ["severity"],
      where: { status: "active" },
      _count: { id: true },
    });

    const summary = {
      critical: stats.find((s) => s.severity === "critical")?._count.id ?? 0,
      warning: stats.find((s) => s.severity === "warning")?._count.id ?? 0,
      info: stats.find((s) => s.severity === "info")?._count.id ?? 0,
      totalActive: stats.reduce((sum, s) => sum + s._count.id, 0),
    };

    return NextResponse.json({
      success: true,
      data: alarms,
      summary,
      meta: { count: alarms.length },
    });
  } catch (error) {
    console.error("Alarm API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch alarm data" }, { status: 500 });
  }
}
