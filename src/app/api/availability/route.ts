import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { calculateAvailableTimes, getWeekday } from "@/lib/availability";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  serviceId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    date: request.nextUrl.searchParams.get("date"),
    serviceId: request.nextUrl.searchParams.get("serviceId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Fecha y servicio son obligatorios" }, { status: 400 });
  }

  const { date, serviceId } = parsed.data;
  const barber = await db.barber.findFirst({ where: { slug: "david-lopera", isActive: true } });
  if (!barber) {
    return NextResponse.json({ error: "Barbero no disponible" }, { status: 404 });
  }

  const service = await db.service.findFirst({
    where: { id: serviceId, isActive: true, barbers: { some: { barberId: barber.id } } },
  });

  if (!service) {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 404 });
  }

  const [schedules, bookings, overrides, blockedPeriods] = await Promise.all([
    db.weeklySchedule.findMany({ where: { barberId: barber.id, weekday: getWeekday(date), isActive: true } }),
    db.booking.findMany({ where: { barberId: barber.id, dateKey: date }, select: { startTime: true, durationMinutes: true, status: true } }),
    db.availabilityOverride.findMany({ where: { barberId: barber.id, dateKey: date } }),
    db.blockedPeriod.findMany({ where: { barberId: barber.id, dateKey: date } }),
  ]);

  const times = calculateAvailableTimes(date, service.durationMinutes, { schedules, bookings, overrides, blockedPeriods });
  return NextResponse.json({ date, serviceId, durationMinutes: service.durationMinutes, times });
}
