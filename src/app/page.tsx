"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, Check, Clock3, MapPin, Moon, Sun } from "lucide-react";

type ServiceOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  priceInCents: number | null;
};

type DateOption = { day: string; date: string; month: string; dateKey: string };

function getColombiaDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function createUpcomingDates(): DateOption[] {
  const current = getColombiaDateKey().split("-").map(Number);
  const dates: DateOption[] = [];
  const formatter = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", weekday: "short", month: "short" });

  for (let offset = 0; offset < 5; offset += 1) {
    const date = new Date(Date.UTC(current[0], current[1] - 1, current[2] + offset, 12));
    const dateKey = date.toISOString().slice(0, 10);
    const labels = formatter.formatToParts(date);
    const weekday = labels.find((part) => part.type === "weekday")?.value.slice(0, 3).toUpperCase() ?? "";
    const month = labels.find((part) => part.type === "month")?.value.slice(0, 3).toUpperCase() ?? "";
    dates.push({ day: weekday, date: dateKey.slice(8, 10), month, dateKey });
  }

  return dates;
}

function formatPrice(priceInCents: number | null) {
  if (priceInCents === null) return "Config.";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(priceInCents / 100);
}

export default function Home() {
  const [dates, setDates] = useState<DateOption[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const upcomingDates = createUpcomingDates();
      setDates(upcomingDates);
      setSelectedDate((current) => current || upcomingDates[0]?.dateKey || "");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch("/api/services")
      .then((response) => {
        if (!response.ok) throw new Error("No se pudieron cargar los servicios");
        return response.json() as Promise<{ services: ServiceOption[] }>;
      })
      .then(({ services: loadedServices }) => {
        setServices(loadedServices);
        setSelectedService((current) => current || loadedServices.find((item) => item.slug === "corte-barba")?.id || loadedServices[0]?.id || "");
      })
      .catch(() => setAvailabilityError("No se pudieron cargar los servicios."))
      .finally(() => setLoadingServices(false));
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedService) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoadingTimes(true);
      setAvailabilityError("");
      try {
        const response = await fetch(`/api/availability?date=${selectedDate}&serviceId=${selectedService}`);
        if (!response.ok) throw new Error("No se pudo calcular la disponibilidad");
        const { times } = await response.json() as { times: string[] };
        if (cancelled) return;
        setAvailableTimes(times);
        setSelectedTime((current) => times.includes(current) ? current : times[0] ?? "");
      } catch {
        if (cancelled) return;
        setAvailableTimes([]);
        setSelectedTime("");
        setAvailabilityError("No se pudo consultar la disponibilidad.");
      } finally {
        if (!cancelled) setLoadingTimes(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDate, selectedService]);

  const service = services.find((item) => item.id === selectedService);
  const selectedDateLabel = dates.find((item) => item.dateKey === selectedDate);

  return (
    <main className={`booking-page ${darkMode ? "dark-mode" : "light-mode"}`}>
      <button className="theme-toggle" type="button" aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"} aria-pressed={darkMode} onClick={() => setDarkMode((current) => !current)}>
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}<span>{darkMode ? "Modo claro" : "Modo oscuro"}</span>
      </button>

      <section className="intro-column" aria-labelledby="page-title">
        <div className="eyebrow"><span /> AGENDA ONLINE</div>
        <h1 id="page-title">Tu momento<br /><em>empieza aquí.</em></h1>
        <p className="intro-copy">Elige el momento que mejor te quede. Yo me encargo del resto.</p>
        <div className="intro-details"><a href="#ubicacion"><MapPin size={13} strokeWidth={1.5} /> Copacabana, Antioquia</a><span><Clock3 size={13} strokeWidth={1.5} /> David Lopera · Barbería</span></div>
        <a className="location-link" href="#ubicacion">Conoce la ubicación <ArrowUpRight size={15} /></a>
      </section>

      <section className="reservation-card" aria-labelledby="booking-title">
        <div className="step-label"><span>01 / DISPONIBILIDAD</span><CalendarDays size={15} /></div>
        <h2 id="booking-title">¿Cuándo nos vemos?</h2>
        <div className="divider" />
        <div className="date-grid" aria-label="Selecciona una fecha">
          {dates.map((item) => <button className={`date-option ${selectedDate === item.dateKey ? "selected" : ""}`} key={item.dateKey} onClick={() => setSelectedDate(item.dateKey)} type="button"><span>{item.day}</span><strong>{item.date}</strong><small>{item.month}</small></button>)}
        </div>

        <div className="step-label second-step"><span>02 / SERVICIO</span></div>
        <h2>¿Qué hacemos hoy?</h2>
        <div className="service-list" aria-label="Selecciona un servicio">
          {loadingServices && <p className="loading-message">Cargando servicios...</p>}
          {!loadingServices && services.map((item) => <button className={`service-option ${selectedService === item.id ? "selected" : ""}`} key={item.id} onClick={() => setSelectedService(item.id)} type="button">
            <span className={`radio ${selectedService === item.id ? "checked" : ""}`}>{selectedService === item.id && <Check size={11} />}</span>
            <span className="service-info"><strong>{item.name}</strong><small>{item.description || "Servicio configurable"} · {item.durationMinutes} min</small></span>
            {item.slug === "corte-barba" && <small className="most-chosen">Más elegido</small>}<b>{formatPrice(item.priceInCents)}</b>
          </button>)}
        </div>

        <div className="time-heading"><div className="step-label"><span>03 / HORA</span></div><small>HORA LOCAL · COT</small></div>
        <div className="time-grid" aria-label="Selecciona una hora">
          {loadingTimes && <p className="loading-message">Calculando horarios...</p>}
          {!loadingTimes && availableTimes.length === 0 && <p className="loading-message">No hay horarios disponibles para esta selección.</p>}
          {!loadingTimes && availableTimes.map((time) => <button className={selectedTime === time ? "selected" : ""} key={time} onClick={() => setSelectedTime(time)} type="button">{time}</button>)}
        </div>
        {availabilityError && <p className="availability-error">{availabilityError}</p>}
        <button className="confirm-button" disabled={!service || !selectedTime} type="button">Confirmar mi cita <ArrowUpRight size={16} /></button>
        <p className="selection-summary">{service?.name || "Selecciona un servicio"} · {selectedDateLabel ? `${selectedDateLabel.date} ${selectedDateLabel.month}` : "Selecciona una fecha"} · {selectedTime || "Selecciona una hora"}</p>
      </section>

      <section id="ubicacion" className="location-strip"><span>UBICACIÓN</span><strong>Copacabana, Antioquia</strong><small>La dirección exacta se configurará próximamente.</small></section>
    </main>
  );
}
