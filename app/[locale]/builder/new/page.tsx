import { setRequestLocale } from "next-intl/server";
import { createDashboard } from "@/src/entities/dashboard";
import { prisma } from "@/src/shared/lib";
import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewBuilderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const adminUser = await prisma.user.findFirst({
    where: { role: "admin" },
  });

  if (!adminUser) {
    throw new Error("Admin user not found");
  }

  const defaultSchema = {
    version: "1.0.0",
    settings: {
      refreshInterval: 0,
      theme: "light" as const,
      gridColumns: 24,
      rowHeight: 40,
      filterMode: "auto" as const,
    },
    dataSources: [],
    filters: [],
    widgets: [],
    linkages: [],
  };

  const dashboard = await createDashboard({
    title: "Untitled Dashboard",
    schema: defaultSchema,
    createdBy: adminUser.id,
  });

  redirect({ href: `/builder/${dashboard.id}`, locale });
}
