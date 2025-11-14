import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service'; 
import { AuthEventsService } from '../../core/services/auth-events.service';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { InteractionStatus, PopupRequest } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, NgIf],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  // ...existing code...
  verPerfil() {
    this.router.navigate(['/perfil']);
  }
  loginDisplay = false;
  userEmail: string = '';
  loadingLogin = false;
  private readonly _destroying$ = new Subject<void>();

  constructor(
    public auth: AuthService,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router,
    private authEvents: AuthEventsService
  ) {
    this.auth.restore();
    // Suscribirse solo al evento global de login
    this.authEvents.login$.subscribe(() => this.login());
  }

  ngOnInit(): void {
    // Asegurar que el usuario activo esté seteado tras recarga
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length > 0 && !this.authService.instance.getActiveAccount()) {
      this.authService.instance.setActiveAccount(accounts[0]);
    }
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.setLoginDisplay();
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  setLoginDisplay() {
    this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
    if (this.loginDisplay) {
      const account = this.authService.instance.getAllAccounts()[0];
      this.userEmail = account?.username || '';
      // Guardar token en localStorage para el interceptor
      this.authService.acquireTokenSilent({
        scopes: ['user.read'],
        account: account
      }).subscribe(result => {
        localStorage.setItem('token', result.accessToken);
      });
    }
  }

  login() {
    this.loadingLogin = true;
    const loginRequest: PopupRequest = {
      scopes: ['user.read']
    };
    this.authService.loginPopup(loginRequest)
      .subscribe({
        next: (result) => {
          // Sincronizar usuario con backend después del login MSAL
          this.syncUserWithBackend(result.account);
          // Actualizar estado inmediatamente tras login
          this.setLoginDisplay();
          this.loadingLogin = false;
        },
        error: (error) => {
          this.loadingLogin = false;
          console.error('Error en login MSAL:', error);
        }
      });
  }

  private syncUserWithBackend(account: any) {
    // Enviar datos del usuario MSAL al backend para sincronización
    const userData = {
      email: account.username,
      nombre: account.name || account.username,
      provider: 'azure-ad',
      azureId: account.homeAccountId
    };

    // Usar AuthService para sincronizar con backend
    this.auth.syncUserWithBackend(userData).subscribe({
      next: (response) => {
        console.log('Usuario sincronizado con backend:', response);
        // Guardar datos adicionales del backend en localStorage
        localStorage.setItem('userProfile', JSON.stringify(response.user));
      },
      error: (error) => {
        console.warn('Error al sincronizar con backend:', error);
        // No bloquear el login si falla la sincronización con backend
      }
    });
  }

  logout() {
    // Limpiar token del localStorage
    localStorage.removeItem('token');
    
    this.authService.logoutPopup({
      mainWindowRedirectUri: "/"
    });
  }
  
    crearCuenta() {
  // Emitir evento global para abrir el modal de registro
  this.authEvents.triggerRegister();
    }
}
