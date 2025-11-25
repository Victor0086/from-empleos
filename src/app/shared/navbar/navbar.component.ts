import { LoginSuccessDialogComponent } from '../../dialogs/login-success-dialog.component';

// Other imports...
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service'; 
import { AuthEventsService } from '../../core/services/auth-events.service';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { PopupRequest, InteractionStatus } from '@azure/msal-browser';
import { environment } from '../../../environments/environment';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, NgIf, MatDialogModule, LoginSuccessDialogComponent],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  showMenu = false;
  dialog!: MatDialog;
  // En la clase NavbarComponent, agregar propiedad para la foto de perfil:
  fotoUrl: string = '';

  verPerfil() {
    this.router.navigate(['/perfil']);
  }

  verMiCV() {
    this.router.navigate(['/perfil']).then(() => {
      // Forzar recarga del perfil si el componente ya está montado
      const perfilComp = document.querySelector('app-perfil');
      if (perfilComp && typeof (perfilComp as any).cargarPerfil === 'function') {
        (perfilComp as any).cargarPerfil();
      }
      this.showMenu = false;
    });
  }

  abrirPerfil() {
    this.router.navigate(['/perfil']);
  }

  verMisPostulaciones() {
    this.router.navigate(['/mis-postulaciones']);
    this.showMenu = false;
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }
  loginDisplay = false;
  userEmail: string = '';
  given_name: string = '';
  loadingLogin = false;
  private readonly _destroying$ = new Subject<void>();

  constructor(
    public auth: AuthService,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router,
    private authEvents: AuthEventsService,
    private cdr: ChangeDetectorRef
  ) {
    this.dialog = inject(MatDialog);
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
      this.given_name = account?.name || '';
      // Obtener foto de perfil si existe en el perfil guardado
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        try {
          const user = JSON.parse(userProfile);
          this.fotoUrl = user.fotoUrl || '';
        } catch (e) {
          console.error('Error al parsear userProfile:', e);
          this.fotoUrl = '';
          localStorage.removeItem('userProfile'); // Limpia el dato corrupto
        }
      } else {
        this.fotoUrl = '';
      }
      // Guardar token en localStorage para el interceptor
      this.authService.acquireTokenSilent({
        scopes: environment.apiConfig.scopes,
        account: account
      }).subscribe(result => {
        localStorage.setItem('token', result.accessToken);
      });
    }
  }

  login() {
    this.loadingLogin = true;
    const loginRequest: PopupRequest = {
      scopes: environment.apiConfig.scopes
    };
    this.authService.loginPopup(loginRequest)
      .subscribe({
        next: async (result) => {
          // Sincronizar usuario con backend después del login MSAL
          this.syncUserWithBackend(result.account);
          // Actualizar estado inmediatamente tras login
          this.setLoginDisplay();
          this.loadingLogin = false;

          // Mostrar modal de éxito
          const { LoginSuccessDialogComponent } = await import('../../dialogs/login-success-dialog.component');
          const dialogRef = this.dialog.open(LoginSuccessDialogComponent, {
            width: '350px',
            autoFocus: false,
          });
          setTimeout(() => {
            dialogRef.close();
            this.setLoginDisplay();
            this.cdr.detectChanges();
          }, 4000);
        },
        error: (error) => {
          this.loadingLogin = false;
          console.error('Error en login MSAL:', error);
        }
      });
  }

  private async syncUserWithBackend(account: any) {
    // Enviar datos del usuario MSAL al backend para sincronización
    const email = account.idTokenClaims?.emails?.[0] || account.username;
    const userData = {
      email: email,
      nombre: account.name || email,
      provider: 'azure-ad',
      azureId: account.homeAccountId
    };

    // Usar AuthService para sincronizar con backend
    (await this.auth.syncUserWithBackend(userData)).subscribe({
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
    // Redirigir al flujo de registro de Azure AD B2C
      this.authService.loginRedirect({
        authority: 'https://instantjobb2c.b2clogin.com/instantjobb2c.onmicrosoft.com/B2C_1_Registro',
        scopes: ['openid', 'profile', 'email']
      });
  }
}
