import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib";

// GET /api/dashboards — 대시보드 목록 조회
export async function GET() {
  try {
    const dashboards = await prisma.dashboard.findMany({
      where: { isPublished: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        isPublished: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ dashboards });
  } catch (error) {
    console.error("Failed to fetch dashboards:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboards" },
      { status: 500 }
    );
  }
}

// POST /api/dashboards
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    const adminUser = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 500 }
      );
    }

    const defaultSchema = {
      version: "1.0.0",
      settings: {
        refreshInterval: 0,
        theme: "light",
        gridColumns: 24,
        rowHeight: 40,
        filterMode: "auto",
      },
      dataSources: [],
      filters: [],
      widgets: [],
      linkages: [],
    };

    const dashboard = await prisma.dashboard.create({
      data: {
        title: title || "Untitled Dashboard",
        description: description || null,
        schema: JSON.stringify(defaultSchema),
        createdBy: adminUser.id,
      },
    });

    return NextResponse.json(
      {
        ...dashboard,
        schema: defaultSchema,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create dashboard:", error);
    return NextResponse.json(
      { error: "Failed to create dashboard" },
      { status: 500 }
    );
  }
}
