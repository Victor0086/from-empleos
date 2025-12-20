import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
    <div class="mb-2"><strong>Sueldo:</strong> {{ ofertaData.sueldo | currency:'CLP':'symbol':'1.0-0':'es-CL' }}</div>
    <button class="btn btn-outline-primary mt-3" (click)="abrirPostulacionModal(ofertaData.id)">Postulación rápida</button>
  </div>
  <div *ngIf="!oferta" class="container py-4">
    <h2>Oferta no encontrada</h2>
  </div>`
})
export class OfertaDetailComponent {
  loading: boolean = false;
  oferta?: Oferta;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private msalService = inject(MsalService);
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private apiUrl = environment.apiConfig.url;
  private cdr = inject(ChangeDetectorRef);
  data: Oferta[] = [];
  ofertas: Oferta[] = [];
  ordenActual: 'relevantes' | 'recientes' = 'relevantes';
  ofertasOrdenadas: Oferta[] = [...this.data];

  async abrirPostulacionModal(ofertaId: number) {
    // Verificar estado de MSAL
    const accounts = this.msalService.instance.getAllAccounts();
    const isLogged = accounts.length > 0;
    
    if (isLogged) {
      // Si está logueado, redirigir a la página de postulación
      this.router.navigate(['/postulacion'], { queryParams: { ofertaId: ofertaId } });
      return;
    }
    
    try {
      const { PostulacionDialogComponent } = await import('./postulacion-dialog.component');
      this.dialog.open(PostulacionDialogComponent, {
        width: '350px',
        autoFocus: false,
        panelClass: 'modal-postulacion',
      });
    } catch (error) {
      console.error('Error al cargar PostulacionDialogComponent:', error);
      alert('Error al abrir el diálogo de postulación. Por favor, intente nuevamente.');
    }
  }
}


