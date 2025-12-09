import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MsalService } from '@azure/msal-angular';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink],
  template: `
  <div class="text-center py-5">
    <h1 class="fw-bold">Tu próximo trabajo esporádico comienza aquí</h1>
    <p class="text-muted fs-5">Conecta trabajadores y empresas de forma 100% online.</p>
    


    <div class="mt-4 text-muted">
      ¿Eres una empresa? <a routerLink="/login" class="text-decoration-none fw-semibold">Publica ofertas laborales</a><br>
      ¿Buscas trabajo? <a routerLink="/login" class="text-decoration-none fw-semibold">Postúlate rápidamente</a>
    </div>
  </div>
  `
})
export class HomeComponent implements OnInit {
  private authService = inject(AuthService);
  private msalService = inject(MsalService);
  private router = inject(Router);

  ngOnInit() {
    // No hacer redirección automática al cargar la página
  }
  registrarAzure() {
    // Redirigir al flujo de registro de Azure AD B2C usando la policy B2C_1_Registro
    window.location.href = 'https://instantjobb2c.b2clogin.com/instantjobb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=B2C_1_Registro&client_id=1b8c46cb-d440-4839-8a95-e876e2025d18&nonce=defaultNonce&redirect_uri=http%3A%2F%2Flocalhost%3A4200%2F&scope=openid%20profile%20email&response_type=code&prompt=login';
  }
}
