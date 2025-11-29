import { Component, OnInit, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-mis-postulaciones',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="container py-4">
      <h2>Mis Postulaciones</h2>
      <div *ngIf="loading">Cargando postulaciones...</div>
      <div *ngIf="!loading && postulaciones.length === 0">No tienes postulaciones registradas.</div>
      <div *ngIf="!loading && postulaciones.length > 0">
        <div *ngFor="let p of postulaciones" class="card mb-3 p-3">
          <div class="fw-bold">{{ p.ofertaTitulo }}</div>
          <div>{{ p.empresa }}</div>
          <div>{{ p.estado }}</div>
          <div class="text-muted">Postulado el {{ p.fecha | date:'mediumDate' }}</div>
        </div>
      </div>
    </div>
  `
})
export class MisPostulacionesComponent implements OnInit {
    private router = inject(Router);
  loading = true;
  postulaciones: any[] = [];
  private auth = inject(AuthService);
  private msal = inject(MsalService);

  ngOnInit() {
    // Recarga postulaciones al entrar a la ruta
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects === '/mis-postulaciones') {
        this.cargarPostulaciones();
      }
    });
    // Carga inicial
    this.cargarPostulaciones();
  }

  cargarPostulaciones() {
    this.loading = true;
    const token = localStorage.getItem('token');
    if (!token) {
      this.loading = false;
      this.postulaciones = [];
      return;
    }
    fetch('http://localhost:8081/api/postulaciones', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        this.postulaciones = Array.isArray(data) ? data : [];
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        this.postulaciones = [];
      });
  }
  }

