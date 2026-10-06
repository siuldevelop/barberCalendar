import prismaPackage from "@prisma/client";

const { PrismaClient } = prismaPackage;

const prisma = new PrismaClient();

async function main() {
  const david = await prisma.barber.upsert({
    where: { slug: "david-lopera" },
    update: { name: "David Lopera", timezone: "America/Bogota", isActive: true },
    create: { name: "David Lopera", slug: "david-lopera", timezone: "America/Bogota" },
  });

  const services = [
    { name: "Corte", slug: "corte", description: "Servicio de corte de cabello.", durationMinutes: 30, priceInCents: null },
    { name: "Barba", slug: "barba", description: "Perfilado y arreglo de barba.", durationMinutes: 30, priceInCents: null },
    { name: "Corte + Barba", slug: "corte-barba", description: "Corte de cabello y arreglo de barba.", durationMinutes: 60, priceInCents: null },
  ];

  for (const serviceData of services) {
    const service = await prisma.service.upsert({
      where: { slug: serviceData.slug },
      update: serviceData,
      create: serviceData,
    });

    await prisma.barberService.upsert({
      where: { barberId_serviceId: { barberId: david.id, serviceId: service.id } },
      update: {},
      create: { barberId: david.id, serviceId: service.id },
    });
  }

  // Example hours only; they are intentionally configurable.
  const exampleSchedule = [
    [1, "09:00", "18:00"], [2, "09:00", "18:00"], [3, "09:00", "18:00"],
    [4, "09:00", "18:00"], [5, "09:00", "18:00"], [6, "09:00", "14:00"],
  ];

  for (const [weekday, startTime, endTime] of exampleSchedule) {
    await prisma.weeklySchedule.upsert({
      where: { barberId_weekday_startTime_endTime: { barberId: david.id, weekday, startTime, endTime } },
      update: { isActive: true },
      create: { barberId: david.id, weekday, startTime, endTime, isActive: true },
    });
  }

  console.log(`Seeded ${david.name} with ${services.length} configurable example services.`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
