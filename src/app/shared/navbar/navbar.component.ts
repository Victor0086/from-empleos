// Other imports...
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { PerfilReloadService } from '../../core/services/perfil-reload.service';
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
  imports: [RouterLink, RouterLinkActive, MatIconModule, NgIf, MatDialogModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements OnInit, OnDestroy {
  showMenu = false;
  dialog!: MatDialog;
  // En la clase NavbarComponent, agregar propiedad para la foto de perfil:
  fotoUrl: string = '';

 
  constructor(
    public auth: AuthService,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router,
    private authEvents: AuthEventsService,
    private cdr: ChangeDetectorRef,
    private perfilReload: PerfilReloadService
  ) {
    this.dialog = inject(MatDialog);
    // Restaurar estado inmediatamente
    this.auth.restore();
    this.initializeAuthState();
    // Suscribirse solo al evento global de login
    this.authEvents.login$.subscribe(() => this.login());
  }

  verMiCV() {
    this.router.navigate(['/perfil']);
    setTimeout(() => {
      this.perfilReload.triggerReload();
    }, 100);
    this.showMenu = false;
  }

  private initializeAuthState() {
    // Verificar si hay cuentas MSAL activas
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length > 0) {
      // Establecer cuenta activa si no está establecida
      if (!this.authService.instance.getActiveAccount()) {
        this.authService.instance.setActiveAccount(accounts[0]);
      }
      // Actualizar estado de login inmediatamente
      this.setLoginDisplay();
      // Sincronizar con AuthService
      this.auth.isLogged.set(true);
      
      // Obtener token y guardarlo
      this.authService.acquireTokenSilent({
        scopes: environment.apiConfig.scopes,
        account: accounts[0]
      }).subscribe({
        next: (result) => {
          localStorage.setItem('token', result.accessToken);
        },
        error: (error) => {
          console.log('Token silencioso falló:', error);
        }
      });
    }
  }



  verMisPostulaciones() {
    this.router.navigate(['/mis-postulaciones']);
    this.showMenu = false;
  }

  toggleMenu(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    console.log('Toggle menu clicked, current showMenu:', this.showMenu);
    this.showMenu = !this.showMenu;
    console.log('New showMenu value:', this.showMenu);
  }
  loginDisplay = false;
  userEmail: string = '';
  given_name: string = '';
  loadingLogin = false;
  private readonly _destroying$ = new Subject<void>();

  // Eliminar constructor duplicado, ya está arriba con PerfilReloadService

  ngOnInit(): void {
    // Inicializar estado inmediatamente
    this.initializeAuthState();
    
    // Escuchar cambios en el estado de MSAL
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.setLoginDisplay();
        // Sincronizar estado con AuthService
        const accounts = this.authService.instance.getAllAccounts();
        this.auth.isLogged.set(accounts.length > 0);
      });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const menuButton = document.querySelector('.navbar .btn');
      const dropdownMenu = document.querySelector('.dropdown-menu');
      
      if (this.showMenu && !menuButton?.contains(target) && !dropdownMenu?.contains(target)) {
        this.showMenu = false;
      }
    });
  }


  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  setLoginDisplay() {
    const accounts = this.authService.instance.getAllAccounts();
    this.loginDisplay = accounts.length > 0;
    
    if (this.loginDisplay && accounts[0]) {
      const account = accounts[0];
      this.userEmail = account.username || '';
      this.given_name = account.name || '';
      
      // Sincronizar con AuthService signals
      this.auth.isLogged.set(true);
      
      // Obtener foto de perfil si existe en el perfil guardado
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        try {
          const user = JSON.parse(userProfile);
          this.fotoUrl = user.fotoUrl || '';
        } catch (e) {
          console.error('Error al parsear userProfile:', e);
          this.fotoUrl = '';
          localStorage.removeItem('userProfile');
        }
      } else {
        this.fotoUrl = '';
      }
      
      // Guardar token en localStorage para el interceptor
      this.authService.acquireTokenSilent({
        scopes: environment.apiConfig.scopes,
        account: account
      }).subscribe({
        next: (result) => {
          localStorage.setItem('token', result.accessToken);
        },
        error: (error) => {
          console.log('Error obteniendo token silencioso:', error);
        }
      });
    } else {
      // No hay sesión activa
      this.auth.isLogged.set(false);
      this.auth.role.set(null);
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
