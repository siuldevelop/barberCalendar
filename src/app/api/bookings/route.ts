import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { calculateAvailableTimes, getWeekday } from "@/lib/availability";

const bookingSchema = z.object({
  customerName: z.string().trim().min(2, "El nombre es obligatorio").max(80),
  customerPhone: z.string().trim().regex(/^[+]?[0-9 ()-]{7,25}$/, "Teléfono inválido"),
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida"),
});

function currentColombiaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export async function POST(request: NextRequest) {
  const parsed = bookingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const input = parsed.data;
  if (input.date < currentColombiaDate()) {
    return NextResponse.json({ error: "No puedes reservar una fecha pasada" }, { status: 400 });
  }

  const barber = await db.barber.findFirst({ where: { slug: "david-lopera", isActive: true } });
  if (!barber) return NextResponse.json({ error: "Barbero no disponible" }, { status: 404 });

  const service = await db.service.findFirst({
    where: { id: input.serviceId, isActive: true, barbers: { some: { barberId: barber.id } } },
  });
  if (!service) return NextResponse.json({ error: "Servicio no disponible" }, { status: 404 });

  try {
    const booking = await db.$transaction(async (tx) => {
      const [schedules, bookings, overrides, blockedPeriods] = await Promise.all([
        tx.weeklySchedule.findMany({ where: { barberId: barber.id, weekday: getWeekday(input.date), isActive: true } }),
        tx.booking.findMany({ where: { barberId: barber.id, dateKey: input.date }, select: { startTime: true, durationMinutes: true, status: true } }),
        tx.availabilityOverride.findMany({ where: { barberId: barber.id, dateKey: input.date } }),
        tx.blockedPeriod.findMany({ where: { barberId: barber.id, dateKey: input.date } }),
      ]);

      const availableTimes = calculateAvailableTimes(input.date, service.durationMinutes, { schedules, bookings, overrides, blockedPeriods });
      if (!availableTimes.includes(input.startTime)) throw new Error("TIME_UNAVAILABLE");

      return tx.booking.create({
        data: {
          barberId: barber.id,
          serviceId: service.id,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          dateKey: input.date,
          startTime: input.startTime,
          durationMinutes: service.durationMinutes,
          status: "PENDING",
        },
        select: { id: true, dateKey: true, startTime: true, status: true },
      });
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "TIME_UNAVAILABLE") {
      return NextResponse.json({ error: "Ese horario ya no está disponible" }, { status: 409 });
    }
    console.error("Booking creation failed", error);
    return NextResponse.json({ error: "No fue posible crear la reserva" }, { status: 500 });
  }
}
