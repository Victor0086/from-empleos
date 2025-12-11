import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-notario-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="container mt-4">
      <h2 class="mb-4">Panel del Notario - Contratos Pendientes de Validación</h2>

      <!-- Animación de carga -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3 text-muted">Cargando contratos pendientes...</p>
      </div>

      <!-- Sin contratos pendientes -->
      <div *ngIf="!loading && contratosPendientes.length === 0" class="alert alert-info text-center">
        <i class="fas fa-info-circle mb-2" style="font-size: 2rem;"></i>
        <h5>No hay contratos pendientes de validación</h5>
        <p>Los contratos firmados por ambas partes aparecerán aquí para su validación notarial.</p>
      </div>

      <!-- Lista de contratos pendientes -->
      <div *ngIf="!loading && contratosPendientes.length > 0">
        <div class="alert alert-warning mb-3">
          <i class="fas fa-exclamation-triangle"></i> 
          Tienes {{ contratosPendientes.length }} contrato(s) pendiente(s) de validación
        </div>
        
        <div *ngFor="let contrato of contratosPendientes" class="card mb-3 shadow-sm">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <h5 class="card-title text-primary">
                  <i class="fas fa-file-contract me-2"></i>
                  Contrato #{{ contrato.id }}
                </h5>
                <p class="card-text mb-1">
                  <i class="fas fa-briefcase me-2"></i>
                  Oferta: {{ contrato.ofertaTitulo || 'Oferta #' + contrato.ofertaId }}
                </p>
                <p class="card-text mb-1">
                  <i class="fas fa-user me-2"></i>
                  Trabajador: {{ contrato.nombreTrabajador }}
                </p>
                <p class="card-text mb-1">
                  <i class="fas fa-building me-2"></i>
                  Empleador: {{ contrato.nombreEmpleador }}
                </p>
                <p class="card-text mb-1">
                  <i class="fas fa-calendar me-2"></i>
                  Fecha creación: {{ contrato.fechaCreacion | date:'dd/MM/yyyy HH:mm' }}
                </p>
                <p class="card-text mb-1">
                  <i class="fas fa-check-double me-2"></i>
                  Estado: Ambas partes firmaron
                </p>
              </div>
              <div class="col-md-4 text-end">
                <div class="mb-2">
                  <span class="badge bg-success fs-6">Listo para validar</span>
                </div>
                <button class="btn btn-primary mb-2" (click)="validarContrato(contrato)" 
                        [disabled]="validandoId === contrato.id">
                  <i class="fas fa-stamp me-1"></i>
                  {{ validandoId === contrato.id ? 'Validando...' : 'Validar Contrato' }}
                </button>
                <br>
                <button class="btn btn-outline-info btn-sm" (click)="verDetalleContrato(contrato)">
                  <i class="fas fa-eye me-1"></i>
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class NotarioPanelComponent implements OnInit {
  
  contratosPendientes: any[] = [];
  loading = true;
  validandoId: number | null = null;
  
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cargarContratosPendientes();
    
    // Recargar cada 30 segundos para nuevas notificaciones
    setInterval(() => {
      this.cargarContratosPendientes();
    }, 30000);
  }

  cargarContratosPendientes() {
    console.log('Cargando contratos pendientes de validación notarial...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.loading = false;
      return;
    }

    fetch('http://localhost:8081/api/notarios/contratos-pendientes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Contratos pendientes recibidos:', data);
      this.contratosPendientes = Array.isArray(data) ? data : [];
      this.loading = false;
      this.cdr.detectChanges();
    })
    .catch(error => {
      console.error('Error cargando contratos pendientes:', error);
      this.contratosPendientes = [];
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  validarContrato(contrato: any) {
    if (!confirm(`¿Confirma que desea validar el contrato #${contrato.id}? Esta acción es irreversible.`)) {
      return;
    }

    this.validandoId = contrato.id;
    const token = localStorage.getItem('token');

    fetch(`http://localhost:8081/api/notarios/validar-contrato/${contrato.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        validacion: 'APROBADO',
        observaciones: 'Contrato validado por notario digital'
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Contrato validado:', data);
      alert('Contrato validado exitosamente. Las partes han sido notificadas.');
      
      // Remover de la lista
      this.contratosPendientes = this.contratosPendientes.filter(c => c.id !== contrato.id);
      this.validandoId = null;
      this.cdr.detectChanges();
    })
    .catch(error => {
      console.error('Error validando contrato:', error);
      alert('Error al validar el contrato. Intente nuevamente.');
      this.validandoId = null;
    });
  }

  verDetalleContrato(contrato: any) {
    // Mostrar detalles del contrato en un modal o nueva ventana
    const detalles = `
      CONTRATO #${contrato.id}
      ================
      
      Oferta: ${contrato.ofertaTitulo || 'N/A'}
      Trabajador: ${contrato.nombreTrabajador}
      Empleador: ${contrato.nombreEmpleador}
      Fecha creación: ${new Date(contrato.fechaCreacion).toLocaleString()}
      
      Estado: Firmado por ambas partes
      Requiere validación notarial
    `;
    
    alert(detalles);
  }
}