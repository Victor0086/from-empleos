

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
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';


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
    LoginComponent,
    RegisterComponent,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Web Empleos';
  isIframe = false;
  loginDisplay = false;
  userEmail = '';
  mostrarLoginForm = false;
  mostrarHero = true;
  ngDoCheck() {
    // Actualiza mostrarHero según la ruta actual
    this.mostrarHero = this.router.url === '/';
  }
  mostrarFormularioLogin() {
    this.mostrarLoginForm = true;
  }

  irOfertas() {
    this.router.navigate(['/ofertas']);
  }

  onLoginExitoso(datos: { email: string, password: string }) {
    // Si el login es exitoso, lanzar MSAL popup
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
    // Suscribirse al evento global de registro para abrir el modal
    this.authEvents.register$.subscribe(() => {
      this.abrirRegistroModal();
    });
  }
  abrirRegistroModal() {
    this.dialog.open(RegisterComponent, {
      width: '500px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'modal-register',
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
    // Sincroniza el estado de sesión con MSAL (igual que el navbar)
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length > 0 && !this.authService.instance.getActiveAccount()) {
      this.authService.instance.setActiveAccount(accounts[0]);
    }
    const account = this.authService.instance.getActiveAccount() || accounts[0];
    this.loginDisplay = !!account;
    this.userEmail = account?.username ?? '';
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

  loginPopup() {
    const login$ = this.msalGuardConfig.authRequest
      ? this.authService.loginPopup({ ...this.msalGuardConfig.authRequest } as PopupRequest)
      : this.authService.loginPopup();

    login$.subscribe((response: AuthenticationResult) => {
      this.authService.instance.setActiveAccount(response.account);
      this.setLoginDisplay();
      this.authService.acquireTokenSilent({ scopes: ['User.Read'] }).subscribe({
        next: (tokenResponse) => {
          localStorage.setItem('jwt', tokenResponse.idToken);
        },
        error: (error) => {
          console.error('Error obteniendo token:', error);
        },
      });
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
