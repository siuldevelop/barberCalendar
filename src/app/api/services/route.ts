import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const services = await db.service.findMany({
    where: {
      isActive: true,
      barbers: { some: { barber: { slug: "david-lopera", isActive: true } } },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true, durationMinutes: true, priceInCents: true },
  });

  return NextResponse.json({ services });
}
