"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Check, Clock3, MapPin } from "lucide-react";

const dates = [
  { day: "LUN", date: "24", month: "JUN" }, { day: "MAR", date: "25", month: "JUN" },
  { day: "MIÉ", date: "26", month: "JUN" }, { day: "JUE", date: "27", month: "JUN" },
  { day: "VIE", date: "28", month: "JUN" },
];
const services = [
  { id: "corte", name: "Corte clásico", detail: "Corte personalizado · 45 min", price: "$45" },
  { id: "corte-barba", name: "Corte + barba", detail: "Corte, perfilado y ritual · 60 min", price: "$70", featured: true },
  { id: "barba", name: "Ritual de barba", detail: "Toalla caliente · 30 min", price: "$35" },
];
const times = ["10:00", "10:45", "11:30", "12:15", "13:00", "16:00", "16:45", "17:30", "18:15"];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState("24");
  const [selectedService, setSelectedService] = useState("corte-barba");
  const [selectedTime, setSelectedTime] = useState("11:30");
  const service = useMemo(() => services.find((item) => item.id === selectedService) ?? services[0], [selectedService]);

  return (
    <main className="booking-page">
      <section className="intro-column" aria-labelledby="page-title">
        <div className="eyebrow"><span /> AGENDA ONLINE</div>
        <h1 id="page-title">Tu momento<br /><em>empieza aquí.</em></h1>
        <p className="intro-copy">Elige el momento que mejor te quede. Yo me encargo del resto.</p>
        <div className="intro-details">
          <a href="#ubicacion"><MapPin size={13} strokeWidth={1.5} /> Copacabana, Antioquia</a>
          <span><Clock3 size={13} strokeWidth={1.5} /> David Lopera · Barbería</span>
        </div>
        <a className="location-link" href="#ubicacion">Conoce la ubicación <ArrowUpRight size={15} /></a>
      </section>

      <section className="reservation-card" aria-labelledby="booking-title">
        <div className="step-label"><span>01 / DISPONIBILIDAD</span><CalendarDays size={15} /></div>
        <h2 id="booking-title">¿Cuándo nos vemos?</h2>
        <div className="divider" />
        <div className="date-grid" aria-label="Selecciona una fecha">
          {dates.map((item) => <button className={`date-option ${selectedDate === item.date ? "selected" : ""}`} key={item.date} onClick={() => setSelectedDate(item.date)} type="button"><span>{item.day}</span><strong>{item.date}</strong><small>{item.month}</small></button>)}
        </div>

        <div className="step-label second-step"><span>02 / SERVICIO</span></div>
        <h2>¿Qué hacemos hoy?</h2>
        <div className="service-list" aria-label="Selecciona un servicio">
          {services.map((item) => <button className={`service-option ${selectedService === item.id ? "selected" : ""}`} key={item.id} onClick={() => setSelectedService(item.id)} type="button">
            <span className={`radio ${selectedService === item.id ? "checked" : ""}`}>{selectedService === item.id && <Check size={11} />}</span>
            <span className="service-info"><strong>{item.name}</strong><small>{item.detail}</small></span>
            {item.featured && <small className="most-chosen">Más elegido</small>}<b>{item.price}</b>
          </button>)}
        </div>

        <div className="time-heading"><div className="step-label"><span>03 / HORA</span></div><small>HORA LOCAL · COT</small></div>
        <div className="time-grid" aria-label="Selecciona una hora">
          {times.map((time) => <button className={selectedTime === time ? "selected" : ""} key={time} onClick={() => setSelectedTime(time)} type="button">{time}</button>)}
        </div>
        <button className="confirm-button" type="button">Confirmar mi cita <ArrowUpRight size={16} /></button>
        <p className="selection-summary">{service.name} · {selectedDate} JUN · {selectedTime}</p>
      </section>

      <section id="ubicacion" className="location-strip"><span>UBICACIÓN</span><strong>Copacabana, Antioquia</strong><small>La dirección exacta se configurará próximamente.</small></section>
    </main>
  );
}
