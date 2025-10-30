import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service'; // ✅ IMPORTANTE

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, NgIf],
  template: `
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center" routerLink="/">
        <span class="material-icons me-1">work</span> GigsPro
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navMain">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <!-- Trabajador -->
          <li class="nav-item" *ngIf="auth.isLogged() && auth.role()==='trabajador'">
            <a class="nav-link" routerLink="/ofertas" routerLinkActive="active">Ofertas</a>
          </li>
          <li class="nav-item" *ngIf="auth.isLogged() && auth.role()==='trabajador'">
            <a class="nav-link" routerLink="/documentos" routerLinkActive="active">Documentos</a>
          </li>

          <!-- Empresa -->
          <li class="nav-item" *ngIf="auth.isLogged() && auth.role()==='empleador'">
            <a class="nav-link" routerLink="/ofertas/nueva" routerLinkActive="active">Publicar</a>
          </li>
        </ul>

        <div class="d-flex">
          <!-- Botón ingresar -->
          <a *ngIf="!auth.isLogged()" class="btn btn-outline-light" routerLink="/login">
            <span class="material-icons me-1">login</span> Ingresar
          </a>

          <!-- Botón salir -->
          <button *ngIf="auth.isLogged()" class="btn btn-warning" (click)="logout()">
            <span class="material-icons me-1">logout</span> Salir
          </button>
        </div>
      </div>
    </div>
  </nav>
  `
})
export class NavbarComponent {
  constructor(public auth: AuthService) {
    this.auth.restore(); // ✅ Restaurar sesión al cargar la app
  }

  logout(){
    this.auth.logout(); // ✅ Cierra sesión
  }
}
