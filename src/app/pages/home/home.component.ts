import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink],
  template: `
  <div class="text-center py-5">
    <h1 class="fw-bold">Tu próximo trabajo esporádico comienza aquí</h1>
    <p class="text-muted fs-5">Conecta trabajadores y empresas de forma 100% online.</p>
    
    <div class="mt-4">
      <a class="btn btn-primary btn-lg px-4 py-2" routerLink="/login">
        <span class="material-icons align-middle me-2">login</span>
        Ingresar
      </a>
    </div>

    <div class="mt-4 text-muted">
      ¿Eres una empresa? <a routerLink="/login" class="text-decoration-none fw-semibold">Publica ofertas laborales</a><br>
      ¿Buscas trabajo? <a routerLink="/login" class="text-decoration-none fw-semibold">Postúlate rápidamente</a>
    </div>
  </div>
  `
})
export class HomeComponent {}
