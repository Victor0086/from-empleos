import { Component, OnInit, inject } from '@angular/core';
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
  loading = true;
  postulaciones: any[] = [];
  private auth = inject(AuthService);
  private msal = inject(MsalService);

  ngOnInit() {
    // Obtener email del usuario autenticado desde el token MSAL
    const account = this.msal.instance.getActiveAccount() || this.msal.instance.getAllAccounts()[0];
    let email = '';
    if (account && account.idTokenClaims) {
      email = String(
        account.idTokenClaims['email'] ||
        account.idTokenClaims['emails']?.[0] ||
        account.idTokenClaims['preferred_username'] ||
        account.username || ''
      );
    }
    if (!email) {
      this.loading = false;
      return;
    }
    fetch(`http://localhost:8081/api/postulaciones?email=${encodeURIComponent(email)}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        this.postulaciones = Array.isArray(data) ? data : [];
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
      });
  }
}
