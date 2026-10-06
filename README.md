# BarberCalendar 💈

Sistema web de reservas para barbería, desarrollado inicialmente para gestionar la agenda del barbero **específico**.

El objetivo principal del proyecto es ofrecer a los clientes una experiencia de reserva sencilla, permitiéndoles seleccionar un servicio, elegir una fecha y consultar únicamente los horarios disponibles.

## 🎯 Objetivo

Crear una plataforma de reservas que permita:

- Consultar los servicios disponibles.
- Seleccionar un servicio.
- Seleccionar una fecha.
- Mostrar únicamente los horarios disponibles.
- Realizar una reserva con los datos del cliente.
- Evitar reservas duplicadas o solapadas.
- Permitir a barbero gestionar su disponibilidad y agenda.
- Mostrar la ubicación exacta de la barbería.
- Facilitar la navegación hasta la barbería mediante mapas.

## 👤 Barbero

El cliente no necesita seleccionar un barbero durante el proceso de reserva.

La arquitectura interna, sin embargo, está preparada para permitir la incorporación de más barberos en futuras versiones.

## 📅 Sistema de disponibilidad

La disponibilidad no se almacena como una lista fija de horarios.

El sistema calcula dinámicamente los horarios disponibles teniendo en cuenta:

- Horario habitual del barbero.
- Reservas existentes.
- Duración estimada del servicio.
- Bloqueos de horario.
- Pausas.
- Disponibilidad real del barbero.

El barbero podrá modificar su disponibilidad desde el área administrativa.

Estados de disponibilidad:

- 🟢 Disponible
- 🔴 Ocupado
- 🟡 Pausa
- ⚫ No disponible

También podrá indicar que una cita terminó antes de lo previsto, sin afectar las reservas futuras.

## ✂️ Servicios

Los servicios tendrán una duración estimada configurable.

Ejemplo:

- Corte
- Barba
- Corte + Barba

Las duraciones y precios serán configurables y no estarán definidos directamente dentro de la lógica de la aplicación.

## 🗺️ Ubicación

La aplicación contará con una sección independiente de **Ubicación**, donde el cliente podrá consultar:

- Dirección exacta de la barbería.
- Mapa.
- Botón para obtener indicaciones.
- Acceso a servicios de navegación como Google Maps o Waze.

La ubicación exacta se configurará posteriormente.

## 🛠️ Tecnologías

El proyecto utiliza:

- **Next.js**
- **TypeScript**
- **React**
- **Tailwind CSS**
- **Prisma**
- **PostgreSQL**
- **Zod**
- **React Hook Form**
- **date-fns**
- **Lucide React**
- **Leaflet / React Leaflet**

## 🏗️ Arquitectura

El proyecto busca mantener una separación clara entre:

```text
UI
│
├── Componentes
│
├── Lógica de negocio
│
├── Validaciones
│
├── Server Actions / API
│
└── Base de datos
       │
       └── Prisma + PostgreSQL
