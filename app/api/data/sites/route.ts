import { NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      include: {
        assets: {
          select: {
            id: true,
            name: true,
            type: true,
            ratedCapacity: true,
            status: true,
          },
        },
        _count: {
          select: {
            assets: true,
            weatherData: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = sites.map((site) => ({
      id: site.id,
      name: site.name,
      location: site.location,
      capacity: site.capacity,
      latitude: site.latitude,
      longitude: site.longitude,
      assetCount: site._count.assets,
      assets: site.assets,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: {
        count: data.length,
      },
    });
  } catch (error) {
    console.error("Sites API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}
