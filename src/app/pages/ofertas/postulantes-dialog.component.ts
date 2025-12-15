import { Component, Inject, inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-postulantes-dialog',
  template: `
    <h2 mat-dialog-title>Postulantes</h2>
    <mat-dialog-content>
      <div *ngIf="!data || data.length === 0">
        <p>No hay postulantes para esta oferta.</p>
      </div>
      <div *ngIf="data && data.length > 0">
        <div *ngFor="let postulante of data" class="mb-3 p-2 border rounded">
          <div><strong>Nombre:</strong> {{ postulante.nombres || postulante.nombre }} {{ postulante.apellidos || '' }}</div>
          <div *ngIf="postulante.email"><strong>Email:</strong> {{ postulante.email }}</div>
          <div *ngIf="postulante.rut"><strong>RUT:</strong> {{ postulante.rut }}</div>
          <div *ngIf="postulante.telefono"><strong>Teléfono:</strong> {{ postulante.telefono }}</div>
          <div *ngIf="postulante.experiencia"><strong>Experiencia:</strong> {{ postulante.experiencia }}</div>
          <div *ngIf="postulante.descripcion_experiencia"><strong>Descripción experiencia:</strong> {{ postulante.descripcion_experiencia }}</div>
          <div *ngIf="postulante.motivacion"><strong>Motivación:</strong> {{ postulante.motivacion }}</div>
          <div>
            <strong>Curriculum:</strong>
            <ng-container *ngIf="postulante.curriculumName && postulante.curriculumPath; else noCV">
              <a [href]="apiUrl.replace('/api', '') + '/uploads/curriculums/' + postulante.curriculumPath" target="_blank">{{ postulante.curriculumName }}</a>
            </ng-container>
            <ng-template #noCV>No disponible</ng-template>
          </div>
          <div class="mt-2">
            <small class="text-muted">Estado actual: {{ postulante.estado || 'Sin estado' }}</small>
          </div>
          <div class="mt-2" *ngIf="postulante.estado === 'PENDIENTE' || postulante.estado == null || postulante.estado === undefined || postulante.estado === 'ENVIADA'">
            <button class="btn btn-success me-2" (click)="aceptarPostulacion(postulante)">
              <span class="material-icons me-1" style="font-size:1rem;vertical-align:middle;">check_circle</span> Aceptar
            </button>
            <button class="btn btn-danger" (click)="rechazarPostulacion(postulante)">
              <span class="material-icons me-1" style="font-size:1rem;vertical-align:middle;">cancel</span> Rechazar
            </button>
          </div>
          <div class="mt-2" *ngIf="postulante.estado === 'ACEPTADA'">
            <span class="badge bg-success">Aceptada</span>
          </div>
          <div class="mt-2" *ngIf="postulante.estado === 'RECHAZADA'">
            <span class="badge bg-danger">Rechazada</span>
          </div>
          <div class="mt-2" *ngIf="postulante.estado === 'CONTRATO_GENERADO'">
            <span class="badge bg-warning text-dark">Pendiente de firma del trabajador</span>
            <button class="btn btn-sm btn-outline-info mt-2" (click)="verContrato(postulante)">
              Ver Contrato
            </button>
          </div>
          <div class="mt-2" *ngIf="postulante.estado === 'CONTRATO_FIRMADO'">
            <span class="badge bg-success">Contrato firmado/Activo</span>
            <button class="btn btn-sm btn-outline-success mt-2" (click)="verContrato(postulante)">
              Ver Contrato Firmado
            </button>
          </div>
          <div class="mt-2" *ngIf="postulante.estado === 'CONTRATO_VALIDADO'">
            <span class="badge bg-primary">Contrato validado por notario</span>
            <button class="btn btn-sm btn-outline-primary mt-2" (click)="verContrato(postulante)">
              Ver Contrato Validado
            </button>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, MatDialogModule, MatButtonModule],
})
export class PostulantesDialogComponent implements OnDestroy {
  private http = inject(HttpClient);
  public apiUrl = environment.apiConfig.url;
  private refreshInterval: any;

  constructor(
    public dialogRef: MatDialogRef<PostulantesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any[]
  ) {
    // Refrescar estados cada 5 segundos para mostrar cambios del backend
    this.refreshInterval = setInterval(() => {
      this.refrescarEstados();
    }, 5000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  aceptarPostulacion(postulante: any) {
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Usar los IDs correctos del postulante
    const ofertaId = postulante.oferta_id || postulante.ofertaId;
    const trabajadorId = postulante.trabajador_id || postulante.trabajadorId;
    // Actualizar estado de postulación
    this.http.put(`${this.apiUrl}/postulaciones/${ofertaId}/${trabajadorId}/estado`, 
      { estado: 'ACEPTADA' }, 
      { headers }
    ).subscribe({
      next: (response) => {
        // No actualizar el estado aquí, lo haremos después del contrato
        alert('Postulación aceptada correctamente');
        // Crear contrato automáticamente
        this.crearContrato(postulante);
      },
      error: (error) => {
        console.error('Error al aceptar postulación:', error);
        alert('Error al aceptar la postulación');
      }
    });
  }

  rechazarPostulacion(postulante: any) {
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const ofertaId = postulante.oferta_id || postulante.ofertaId;
    const trabajadorId = postulante.trabajador_id || postulante.trabajadorId;
    this.http.put(`${this.apiUrl}/postulaciones/${ofertaId}/${trabajadorId}/estado`, 
      { estado: 'RECHAZADA' }, 
      { headers }
    ).subscribe({
      next: (response) => {
        postulante.estado = 'RECHAZADA';
        alert('Postulación rechazada');
      },
      error: (error) => {
        console.error('Error al rechazar postulación:', error);
        alert('Error al rechazar la postulación');
      }
    });
  }

  private crearContrato(postulante: any) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No hay token disponible para crear contrato');
      alert('Error: No hay token de autenticación');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const ofertaId = postulante.oferta_id || postulante.ofertaId;
    const trabajadorId = postulante.trabajadorId || postulante.trabajador_id;
    
    console.log('Datos del postulante para contrato:', {
      ofertaId,
      trabajadorId,
      postulante
    });
    
    if (!ofertaId || !trabajadorId) {
      console.error('Faltan datos requeridos para crear contrato:', { ofertaId, trabajadorId });
      alert('Error: Faltan datos del postulante para crear el contrato');
      return;
    }
    
    // Probar diferentes formatos de datos que el backend podría esperar
    const contratoData = {
      ofertaId: ofertaId,
      trabajadorId: trabajadorId,
      oferta_id: ofertaId,
      trabajador_id: trabajadorId
    };

    console.log('Enviando datos del contrato:', contratoData);

    this.http.post(`${this.apiUrl}/contratos`, contratoData, { headers }).subscribe({
      next: (response) => {
        console.log('Contrato creado automáticamente:', response);
        // No actualizar el estado aquí para evitar conflictos de CHECK constraint
        // El backend debe manejar la actualización del estado
        alert('Contrato generado exitosamente');
        
        // Refrescar los estados para obtener el estado actual desde el backend
        setTimeout(() => {
          this.refrescarEstados();
        }, 1000);
      },
      error: (error) => {
        console.error('Error al crear contrato:', error);
        console.error('Detalles del error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        
        let errorMsg = 'Error al crear el contrato. ';
        if (error.error && error.error.message) {
          errorMsg += error.error.message;
        } else {
          errorMsg += `Código de error: ${error.status}`;
        }
        alert(errorMsg);
      }
    });
  }

  // Refrescar estados de postulaciones para mostrar cambios del backend
  private refrescarEstados() {
    console.log('Refrescando estados de postulaciones...');
    
    const token = localStorage.getItem('token');
    if (!token) return;

    // Obtener la oferta ID del primer postulante
    const ofertaId = this.data[0]?.oferta_id || this.data[0]?.ofertaId;
    if (!ofertaId) return;

    const headers: any = {};
    headers['Authorization'] = `Bearer ${token}`;

    // Recargar postulaciones de esta oferta
    this.http.get(`${this.apiUrl}/postulaciones/oferta/${ofertaId}`, { headers }).subscribe({
      next: (postulaciones: any) => {
        console.log('Estados actualizados recibidos:', postulaciones);
        
        // Actualizar estados en el diálogo
        if (Array.isArray(postulaciones)) {
          postulaciones.forEach(postulacionActualizada => {
            const index = this.data.findIndex(p => 
              (p.trabajador_id || p.trabajadorId) === (postulacionActualizada.trabajador_id || postulacionActualizada.trabajadorId)
            );
            
            if (index !== -1) {
              // Actualizar solo el estado para mantener otros datos
              this.data[index].estado = postulacionActualizada.estado;
              console.log(`Estado actualizado para ${postulacionActualizada.trabajador_id}: ${postulacionActualizada.estado}`);
            }
          });
        }
      },
      error: (error) => {
        console.error('Error al refrescar estados:', error);
      }
    });
  }

  // Ver contrato generado
  verContrato(postulante: any) {
    const ofertaId = postulante.oferta_id || postulante.ofertaId;
    const trabajadorId = postulante.trabajadorId || postulante.trabajador_id;
    
    console.log('Redirigiendo a ver contrato para:', { ofertaId, trabajadorId });
    
    // Redirigir a la página de contratos o abrir en nueva pestaña
    window.open('/mis-contratos', '_blank');
  }
}
