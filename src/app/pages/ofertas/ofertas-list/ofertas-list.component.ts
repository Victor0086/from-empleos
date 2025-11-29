import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { PostulacionDialogComponent } from '../postulacion-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgFor } from '@angular/common';

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
  standalone: true,
  selector: 'app-ofertas-list',
  imports: [MatIconModule, MatButtonModule, NgFor, MatDialogModule, PostulacionDialogComponent],
  template: `
  <div class="container-fluid py-4" style="background:#f7f8fc;">
    <div class="row justify-content-center">
      <div class="col-12 col-md-8">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="fw-semibold">17.415 ofertas de empleo en Chile</div>
          <div>
            <span class="me-2">Ordenar por:</span>
            <button class="btn btn-dark btn-sm me-1" [class.active]="ordenActual==='relevantes'" (click)="ordenarPor('relevantes')">Relevantes</button>
            <button class="btn btn-light btn-sm" [class.active]="ordenActual==='recientes'" (click)="ordenarPor('recientes')">Recientes</button>
          </div>
        </div>
        <div *ngFor="let e of ofertasOrdenadas" class="bg-white rounded shadow-sm p-3 mb-3 d-flex flex-column flex-md-row gap-3 align-items-md-center oferta-card" (click)="verDetalle(e.id)" style="cursor:pointer;">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center mb-1">
              <span [class]="getBadgeClass(e.fecha)" style="font-size:0.75rem;">
                {{ e.fecha === 'hoy' ? 'Publicado hoy' : e.fecha === 'ayer' ? 'Publicado ayer' : 'Hace más de un día' }}
              </span>
              <span class="fw-bold">{{ e.titulo }}</span>
            </div>
            <div class="text-muted mb-2">Empresa del área {{ e.area }} • {{ e.tipo }}</div>
            <div class="mb-2">{{ e.comuna }}</div>
            <div class="mb-2 small">Empresa de salud, requiere incorporar personal para campaña de verano.</div>
            <div class="d-flex gap-2 mb-2">
              <button class="btn btn-outline-primary btn-sm" (click)="$event.stopPropagation(); abrirPostulacionModal()">Postulación rápida</button>
            </div>
          </div>
          <div class="d-flex flex-column align-items-end">
            <div class="mb-1"><span class="material-icons">location_on</span> {{ e.comuna }}</div>
            <div class="mb-1"><span class="material-icons">business_center</span> Presencial</div>
            <div class="mb-1"><span class="material-icons">accessible</span> Apto discapacidad</div>
            <button class="btn btn-light"><span class="material-icons">favorite_border</span></button>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class OfertasListComponent {
  private dialog = inject(MatDialog);
  cols = ['titulo','area','tipo','comuna','estado','acciones'];
  data: Oferta[] = [
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
  ordenActual: 'relevantes' | 'recientes' = 'relevantes';
  ofertasOrdenadas: Oferta[] = [...this.data];

  ordenarPor(tipo: 'relevantes' | 'recientes') {
    this.ordenActual = tipo;
    if (tipo === 'relevantes') {
      // Simula relevancia: primero las publicadas
      this.ofertasOrdenadas = [...this.data].sort((a, b) => a.estado === 'publicada' ? -1 : 1);
    } else {
      // Simula recientes: primero las de hoy, luego ayer, luego antiguas
      this.ofertasOrdenadas = [...this.data].sort((a, b) => {
        const ordenFecha = { 'hoy': 0, 'ayer': 1, 'antiguo': 2 };
        return ordenFecha[a.fecha] - ordenFecha[b.fecha];
      });
    }
  }

  ngOnInit() {
    this.ordenarPor(this.ordenActual);
  }

  getBadgeClass(fecha: 'hoy' | 'ayer' | 'antiguo') {
    if (fecha === 'hoy') return 'badge bg-success text-white';
    if (fecha === 'ayer') return 'badge bg-warning text-dark';
    return 'badge bg-secondary text-white';
  }

  private authService: AuthService = inject(AuthService);

  abrirPostulacionModal() {
    // Usar el signal correctamente como función y tipado
    const isLogged: boolean = typeof this.authService.isLogged === 'function' ? this.authService.isLogged() : !!this.authService.isLogged;
    if (isLogged) {
      window.location.href = '/postulacion';
      return;
    }
    this.dialog.open(PostulacionDialogComponent, {
      width: '350px',
      autoFocus: false,
      panelClass: 'modal-postulacion',
    });
  }

  verDetalle(id: number) {
    // Navega al detalle de la oferta
    window.location.href = `/ofertas/${id}`;
  }

}
