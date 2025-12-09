import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
  loading: boolean = false;
  oferta?: Oferta;
  private route = inject(ActivatedRoute);
  private msalService = inject(MsalService);
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private apiUrl = environment.apiConfig.url;
  private cdr = inject(ChangeDetectorRef);
  data: Oferta[] = [];
  ofertas: Oferta[] = [];
  ordenActual: 'relevantes' | 'recientes' = 'relevantes';
  ofertasOrdenadas: Oferta[] = [...this.data];

  constructor() {
    this.cargarOfertas();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.oferta = this.ofertas.find(o => o.id === id);
  }

  cargarOfertas() {
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/ofertas`).subscribe({
      next: (ofertas) => {
        console.log('Ofertas cargadas para trabajadores:', ofertas);
        // Filtrar solo ofertas ABIERTAS para trabajadores
        const ofertasAbiertas = ofertas.filter(oferta => oferta.estado === 'ABIERTA');
        // Mapear ofertas del backend al formato del frontend
        this.data = ofertasAbiertas.map(oferta => ({
          id: oferta.oferta_id,
          titulo: oferta.titulo,
          area: 'General',
          tipo: oferta.contrato_type,
          comuna: oferta.location,
          estado: oferta.estado,
          fecha: this.calcularFecha(oferta.fecha_creacion),
          sueldo: 0,
          descripcion: oferta.descripcion,
          horario: 'Por definir',
          duracion: 'Por definir'
        }));
        // ACTUALIZAR LA VARIABLE ofertas PARA QUE EL HTML LA USE
        this.ofertas = [...this.data];
        console.log('Ofertas disponibles para trabajadores:', this.data);
        this.ordenarPor(this.ordenActual);
        this.loading = false;
        this.cdr.detectChanges();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar ofertas:', error);
        this.ordenarPor(this.ordenActual);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularFecha(fechaCreacion: string | undefined): 'hoy' | 'ayer' | 'antiguo' {
    if (!fechaCreacion) return 'hoy';

    const hoy = new Date();
    const fecha = new Date(fechaCreacion);
    const diffTime = Math.abs(hoy.getTime() - fecha.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    return 'antiguo';
  }

  ordenarPor(tipo: 'relevantes' | 'recientes') {
    this.ordenActual = tipo;
    if (tipo === 'relevantes') {
      // Simula relevancia: primero las abiertas
      this.ofertasOrdenadas = [...this.data].sort((a, b) => a.estado === 'ABIERTA' ? -1 : 1);
    } else {
      // Simula recientes: primero las de hoy, luego ayer, luego antiguas
      this.ofertasOrdenadas = [...this.data].sort((a, b) => {
        const ordenFecha = { 'hoy': 0, 'ayer': 1, 'antiguo': 2 };
        return ordenFecha[a.fecha] - ordenFecha[b.fecha];
      });
    }
  }
}


