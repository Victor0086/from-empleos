import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Oferta {
  id: number;
  titulo: string;
  area: string;
  tipo: string;
  comuna: string;
  sueldo?: number;
  estado: string;
  fecha: 'hoy' | 'ayer' | 'antiguo';
  descripcion: string;
  horario: string;
  duracion: string;
}

@Component({
  selector: 'app-oferta-detail',
  standalone: true,
  imports: [CommonModule],
  template: `<div *ngIf="oferta as ofertaData" class="container py-4">
    <h2 class="mb-3">{{ ofertaData.titulo }}</h2>
    <div class="mb-2"><strong>Área:</strong> {{ ofertaData.area }}</div>
    <div class="mb-2"><strong>Tipo:</strong> {{ ofertaData.tipo }}</div>
    <div class="mb-2"><strong>Comuna:</strong> {{ ofertaData.comuna }}</div>
    <div class="mb-2"><strong>Estado:</strong> {{ ofertaData.estado }}</div>
    <div class="mb-2"><strong>Fecha publicación:</strong> {{ ofertaData.fecha }}</div>
    <div class="mb-2"><strong>Descripción:</strong> {{ ofertaData.descripcion }}</div>
    <div class="mb-2"><strong>Horario:</strong> {{ ofertaData.horario }}</div>
    <div class="mb-2"><strong>Duración:</strong> {{ ofertaData.duracion }} (trabajo esporádico)</div>
    <div class="mb-2"><strong>Sueldo:</strong> {{ '$' + ofertaData.sueldo }}</div>
    <button class="btn btn-outline-primary mt-3">Postulación rápida</button>
  </div>
  <div *ngIf="!oferta" class="container py-4">
    <h2>Oferta no encontrada</h2>
  </div>`
})
export class OfertaDetailComponent {
  oferta?: Oferta;
  private route = inject(ActivatedRoute);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.oferta = OFERTAS.find(o => o.id === id);
  }
}

// Simulación de datos, en producción se debe obtener desde un servicio
const OFERTAS: Oferta[] = [
  {
    id: 1,
    titulo: 'Operario Carga',
    area: 'Logística',
    tipo: 'Temporal',
    comuna: 'Renca',
    estado: 'publicada',
    fecha: 'ayer',
    sueldo: 35000,
    descripcion: 'Carga y descarga de productos en bodega. Trabajo físico, ideal para personas con buena condición física. Se requiere responsabilidad y puntualidad.',
    horario: 'Lunes a viernes, 08:00 a 17:00',
    duracion: '1 semana'
  },
  {
    id: 2,
    titulo: 'Diseñador Web',
    area: 'TI',
    tipo: 'Freelance',
    comuna: 'Ñuñoa',
    estado: 'borrador',
    fecha: 'antiguo',
    sueldo: 60000,
    descripcion: 'Diseño de landing page para campaña publicitaria. Se requiere experiencia en Figma y maquetación responsive.',
    horario: 'Flexible, entrega en 10 días',
    duracion: '10 días'
  },
  {
    id: 3,
    titulo: 'Analista de Datos',
    area: 'TI',
    tipo: 'Full-time',
    comuna: 'Providencia',
    estado: 'publicada',
    fecha: 'hoy',
    sueldo: 50000,
    descripcion: 'Análisis de datos para reporte semanal. Manejo avanzado de Excel y Power BI. Trabajo remoto.',
    horario: 'Lunes a viernes, 09:00 a 18:00',
    duracion: '2 semanas'
  },
  {
    id: 4,
    titulo: 'Auxiliar de Aseo',
    area: 'Servicios',
    tipo: 'Part-time',
    comuna: 'Maipú',
    estado: 'publicada',
    fecha: 'antiguo',
    sueldo: 25000,
    descripcion: 'Limpieza de oficinas y áreas comunes. Se requiere experiencia previa y disponibilidad inmediata.',
    horario: 'Lunes a sábado, 07:00 a 12:00',
    duracion: '2 semanas'
  },
  {
    id: 5,
    titulo: 'Vendedor',
    area: 'Comercial',
    tipo: 'Temporal',
    comuna: 'Las Condes',
    estado: 'borrador',
    fecha: 'hoy',
    sueldo: 40000,
    descripcion: 'Venta de productos en stand de mall. Se requiere habilidades comunicacionales y experiencia en ventas.',
    horario: 'Lunes a domingo, 10:00 a 19:00',
    duracion: '1 semana'
  },
  {
    id: 6,
    titulo: 'Enfermero',
    area: 'Salud',
    tipo: 'Full-time',
    comuna: 'Santiago',
    estado: 'publicada',
    fecha: 'ayer',
    sueldo: 70000,
    descripcion: 'Apoyo en campaña de vacunación. Se requiere título profesional y registro en la Superintendencia de Salud.',
    horario: 'Lunes a viernes, 08:00 a 16:00',
    duracion: '2 semanas'
  },
  {
    id: 7,
    titulo: 'Recepcionista',
    area: 'Administración',
    tipo: 'Part-time',
    comuna: 'La Florida',
    estado: 'borrador',
    fecha: 'antiguo',
    sueldo: 30000,
    descripcion: 'Recepción de clientes y atención telefónica. Se requiere buena presencia y manejo de Office.',
    horario: 'Lunes a viernes, 09:00 a 14:00',
    duracion: '1 semana'
  },
  {
    id: 8,
    titulo: 'Desarrollador Frontend',
    area: 'TI',
    tipo: 'Freelance',
    comuna: 'Vitacura',
    estado: 'publicada',
    fecha: 'hoy',
    sueldo: 80000,
    descripcion: 'Implementación de nuevas funcionalidades en sitio web. Experiencia en Angular y consumo de APIs.',
    horario: 'Flexible, entrega en 2 semanas',
    duracion: '2 semanas'
  },
  {
    id: 9,
    titulo: 'Contador',
    area: 'Finanzas',
    tipo: 'Full-time',
    comuna: 'Providencia',
    estado: 'publicada',
    fecha: 'antiguo',
    sueldo: 65000,
    descripcion: 'Preparación de balances y declaraciones de impuestos. Se requiere experiencia en empresas medianas.',
    horario: 'Lunes a viernes, 09:00 a 18:00',
    duracion: '2 semanas'
  },
  {
    id: 10,
    titulo: 'Psicólogo',
    area: 'Recursos Humanos',
    tipo: 'Part-time',
    comuna: 'Santiago',
    estado: 'borrador',
    fecha: 'ayer',
    sueldo: 50000,
    descripcion: 'Evaluación psicológica para proceso de selección masivo. Se requiere título profesional.',
    horario: 'Lunes a viernes, 10:00 a 16:00',
    duracion: '1 semana'
  },
  {
    id: 11,
    titulo: 'Chef',
    area: 'Gastronomía',
    tipo: 'Full-time',
    comuna: 'Las Condes',
    estado: 'publicada',
    fecha: 'hoy',
    sueldo: 60000,
    descripcion: 'Preparación de menú especial para evento corporativo. Experiencia en cocina internacional.',
    horario: 'Lunes a sábado, 11:00 a 20:00',
    duracion: '1 semana'
  },
  {
    id: 12,
    titulo: 'Guardia de Seguridad',
    area: 'Seguridad',
    tipo: 'Temporal',
    comuna: 'Maipú',
    estado: 'publicada',
    fecha: 'antiguo',
    sueldo: 35000,
    descripcion: 'Vigilancia de instalaciones durante evento. Se requiere curso OS10 vigente.',
    horario: 'Viernes y sábado, 18:00 a 06:00',
    duracion: '2 días'
  },
  {
    id: 13,
    titulo: 'Ingeniero Civil',
    area: 'Ingeniería',
    tipo: 'Full-time',
    comuna: 'Providencia',
    estado: 'publicada',
    fecha: 'hoy',
    sueldo: 90000,
    descripcion: 'Supervisión de obra menor. Experiencia en proyectos de construcción rápida.',
    horario: 'Lunes a viernes, 08:00 a 17:00',
    duracion: '2 semanas'
  },
  {
    id: 14,
    titulo: 'Profesor de Inglés',
    area: 'Educación',
    tipo: 'Part-time',
    comuna: 'Santiago',
    estado: 'borrador',
    fecha: 'ayer',
    sueldo: 40000,
    descripcion: 'Clases intensivas de inglés para grupo de adultos. Experiencia en enseñanza rápida.',
    horario: 'Lunes a viernes, 18:00 a 20:00',
    duracion: '1 semana'
  },
  {
    id: 15,
    titulo: 'Cajero',
    area: 'Comercial',
    tipo: 'Temporal',
    comuna: 'La Florida',
    estado: 'publicada',
    fecha: 'antiguo',
    sueldo: 35000,
    descripcion: 'Atención de caja en local comercial por campaña especial. Se requiere experiencia previa.',
    horario: 'Lunes a domingo, 09:00 a 18:00',
    duracion: '1 semana'
  },
  {
    id: 16,
    titulo: 'Técnico Electrónico',
    area: 'TI',
    tipo: 'Full-time',
    comuna: 'Las Condes',
    estado: 'publicada',
    fecha: 'hoy',
    sueldo: 55000,
    descripcion: 'Reparación de equipos electrónicos en empresa. Se requiere experiencia en diagnóstico rápido.',
    horario: 'Lunes a viernes, 08:00 a 17:00',
    duracion: '1 semana'
  },
  {
    id: 17,
    titulo: 'Jardinero',
    area: 'Servicios',
    tipo: 'Part-time',
    comuna: 'Ñuñoa',
    estado: 'borrador',
    fecha: 'antiguo',
    sueldo: 30000,
    descripcion: 'Mantención de áreas verdes en condominio. Se requiere experiencia y herramientas propias.',
    horario: 'Martes y jueves, 09:00 a 13:00',
    duracion: '2 semanas'
  },
  {
    id: 18,
    titulo: 'Médico General',
    area: 'Salud',
    tipo: 'Full-time',
    comuna: 'Santiago',
    estado: 'publicada',
    fecha: 'hoy',
    sueldo: 100000,
    descripcion: 'Atención médica en operativo de salud. Se requiere título y experiencia en atención primaria.',
    horario: 'Lunes a viernes, 08:00 a 16:00',
    duracion: '1 semana'
  },
  {
    id: 19,
    titulo: 'Asistente Social',
    area: 'Recursos Humanos',
    tipo: 'Part-time',
    comuna: 'Maipú',
    estado: 'borrador',
    fecha: 'ayer',
    sueldo: 35000,
    descripcion: 'Apoyo en gestión de beneficios sociales para empresa. Se requiere experiencia en trabajo comunitario.',
    horario: 'Lunes a viernes, 09:00 a 13:00',
    duracion: '1 semana'
  },
  {
    id: 20,
    titulo: 'Panadero',
    area: 'Gastronomía',
    tipo: 'Temporal',
    comuna: 'Providencia',
    estado: 'publicada',
    fecha: 'antiguo',
    sueldo: 32000,
    descripcion: 'Elaboración de pan y bollería para evento especial. Se requiere experiencia en panadería artesanal.',
    horario: 'Lunes a sábado, 06:00 a 12:00',
    duracion: '1 semana'
  }
];
