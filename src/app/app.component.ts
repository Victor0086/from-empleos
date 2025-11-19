

import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { AuthEventsService } from './core/services/auth-events.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import {
  MsalService,
  MsalModule,
  MsalBroadcastService,
  MSAL_GUARD_CONFIG,
  MsalGuardConfiguration,
} from '@azure/msal-angular';
import {
  AuthenticationResult,
  InteractionStatus,
  PopupRequest,
  EventMessage,
  EventType,
} from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MsalModule,
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatBadgeModule,
    MatDialogModule,
    NavbarComponent,
    FooterComponent,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Web Empleos';
  isIframe = false;
  loginDisplay = false;
  userEmail = '';
  given_name = '';
  mostrarLoginForm = false;
  mostrarHero = true;
  ngDoCheck() {
    this.mostrarHero = this.router.url === '/';
  }
  mostrarFormularioLogin() {
    this.mostrarLoginForm = true;
  }

  irOfertas() {
    this.router.navigate(['/ofertas']);
  }

  onLoginExitoso(datos: { email: string, password: string }) {
    this.loginPopup();
    this.mostrarLoginForm = false;
  }

  private readonly _destroying$ = new Subject<void>();
  private readonly msalGuardConfig = inject<MsalGuardConfiguration>(MSAL_GUARD_CONFIG);

  constructor(
    private readonly authService: MsalService,
    private readonly msalBroadcastService: MsalBroadcastService,
    private readonly router: Router,
    private dialog: MatDialog,
    private authEvents: AuthEventsService
  ) {
    this.authEvents.register$.subscribe(() => {
      this.abrirRegistroModal();
    });
  }
  abrirRegistroModal() {
    // Usar MSAL para redirigir al flujo de registro de Azure AD B2C (policy B2C_1_Registro)
    this.authService.loginRedirect({
      authority: 'https://instantjobb2c.b2clogin.com/instantjobb2c.onmicrosoft.com/B2C_1_Registro',
      scopes: ['openid', 'profile', 'email']
    });
  }

    crearCuenta() {
      this.router.navigate(['/auth/register']);
    }

  ngOnInit(): void {
    this.authService.instance
      .initialize()
      .then(() => {
        console.log('MSAL inicializado correctamente');
        this.procesarEventos();
        this.setLoginDisplayFromMsal();
      })
      .catch((err) => console.error('Error inicializando MSAL', err));
  }

  setLoginDisplayFromMsal() {
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length > 0 && !this.authService.instance.getActiveAccount()) {
      this.authService.instance.setActiveAccount(accounts[0]);
    }
    const account = this.authService.instance.getActiveAccount() || accounts[0];
    this.loginDisplay = !!account;
    this.userEmail = account?.username ?? '';
    this.given_name = account?.name ?? '';
  }

  private procesarEventos(): void {
    this.isIframe = window !== window.parent && !window.opener;

    this.authService.handleRedirectObservable().subscribe({
      next: (result) => {
        if (result && result.account) {
          this.authService.instance.setActiveAccount(result.account);
          this.setLoginDisplayFromMsal();
        }
      },
      error: (error) => console.error('Error en redirección', error),
    });

    this.setLoginDisplayFromMsal();
    this.authService.instance.enableAccountStorageEvents();

    this.msalBroadcastService.msalSubject$
      .pipe(
        filter(
          (msg: EventMessage) =>
            msg.eventType === EventType.ACCOUNT_ADDED ||
            msg.eventType === EventType.ACCOUNT_REMOVED
        )
      )
      .subscribe(() => {
        if (this.authService.instance.getAllAccounts().length === 0) {
          window.location.pathname = '/';
        } else {
          this.setLoginDisplayFromMsal();
        }
      });

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.checkAndSetActiveAccount();
        this.setLoginDisplayFromMsal();
      });
  }

  setLoginDisplay() {
    const account = this.authService.instance.getActiveAccount();
    this.loginDisplay = !!account;
    this.userEmail = account?.username ?? '';
  }

  checkAndSetActiveAccount() {
    let activeAccount = this.authService.instance.getActiveAccount();
    if (!activeAccount && this.authService.instance.getAllAccounts().length > 0) {
      this.authService.instance.setActiveAccount(this.authService.instance.getAllAccounts()[0]);
    }
  }

  async loginPopup() {
    const loginRequest = this.msalGuardConfig.authRequest
      ? { ...this.msalGuardConfig.authRequest } as PopupRequest
      : { scopes: [...environment.apiConfig.scopes] } as PopupRequest;

    this.authService.loginPopup(loginRequest).subscribe({
      next: async (response: AuthenticationResult) => {
        this.authService.instance.setActiveAccount(response.account);
        this.setLoginDisplay();

        // Mostrar modal de éxito
        const { LoginSuccessDialogComponent } = await import('./login-success-dialog.component');
        const dialogRef = this.dialog.open(LoginSuccessDialogComponent, {
          width: '350px',
          autoFocus: false,
        });
        setTimeout(() => dialogRef.close(), 2000);

        this.authService.acquireTokenSilent({
          account: response.account,
          scopes: environment.apiConfig.scopes
        }).subscribe({
          next: (tokenResponse) => {
            console.log('Token de acceso obtenido:', tokenResponse.accessToken);
            localStorage.setItem('jwt', tokenResponse.idToken); 
          },
          error: (error) => {
            console.error('Error obteniendo token silencioso:', error);
          },
        });
      },
      error: (error) => console.error('Error en loginPopup:', error)
    });
  }

  logout() {
    this.authService.logoutPopup({ mainWindowRedirectUri: '/' }).subscribe({
      next: () => {
        this.authService.instance.setActiveAccount(null);
        this.setLoginDisplay();
        localStorage.removeItem('jwt');
      },
      error: (err) => console.error('Error en logout', err),
    });
  }

  identificarse(): void {
    this.router.navigate(['/auth']);
  }

  registrarse(): void {
    this.authService.loginRedirect({
      authority:
        'https://tasgrupo1.b2clogin.com/tasgrupo1.onmicrosoft.com/B2C_1_tasgrupo1',
      scopes: ['openid', 'profile', 'offline_access'],
    });
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
