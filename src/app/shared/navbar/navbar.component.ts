import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
import { PerfilReloadService } from '../../core/services/perfil-reload.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service'; 
import { AuthEventsService } from '../../core/services/auth-events.service';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
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
  fotoUrl: string = '';
  given_name: string = '';
  loadingLogin = false;
  
  // Eliminamos loginDisplay, usaremos auth.isLogged()
  
  private readonly _destroying$ = new Subject<void>();
  dialog = inject(MatDialog);

  constructor(
    public auth: AuthService, // Signal auth.isLogged() se usa en HTML
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router,
    private authEvents: AuthEventsService,
    private cdr: ChangeDetectorRef,
    private perfilReload: PerfilReloadService,
    private eRef: ElementRef // Para detectar clicks fuera
  ) {
    // Al instanciar, intentamos restaurar sesión si no se ha hecho
    this.auth.restore(); 
    this.authEvents.login$.subscribe(() => this.login());
  }

  ngOnInit(): void {
    // Escuchar cambios en MSAL para actualizar nombre y foto
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.updateUserData();
      });
      
    // Llamada inicial
    this.updateUserData();
  }

  // Lógica unificada para obtener datos del usuario
  updateUserData() {
    const accounts = this.authService.instance.getAllAccounts();
    if (accounts.length > 0) {
      const account = accounts[0];
      this.authService.instance.setActiveAccount(account);
      
      this.given_name = account.name || '';
      
      // Recuperar foto del localStorage
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        try {
          const user = JSON.parse(userProfile);
          this.fotoUrl = user.fotoUrl || '';
        } catch { 
          this.fotoUrl = ''; 
        }
      }
    }
  }

  // --- LOGICA DEL MENU DESPLEGABLE ---
  toggleMenu(event: Event) {
    event.stopPropagation(); // Evita que el HostListener lo cierre inmediatamente
    this.showMenu = !this.showMenu;
  }

  closeMenu() {
    this.showMenu = false;
  }

  // Detectar clicks en cualquier parte del documento
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    // Si el click NO fue dentro del componente, cerrar menú
    if(!this.eRef.nativeElement.contains(event.target)) {
      this.showMenu = false;
    }
  }
  // -----------------------------------

  verMiCV() {
    this.router.navigate(['/perfil']);
    setTimeout(() => this.perfilReload.triggerReload(), 100);
    this.closeMenu();
  }

  login() {
    this.loadingLogin = true;
    const loginRequest: PopupRequest = {
      scopes: environment.apiConfig.scopes
    };
    
    this.authService.loginPopup(loginRequest)
      .subscribe({
        next: async (result) => {
          await this.syncUserWithBackend(result.account);
          this.updateUserData(); // Actualizar nombre/foto
          this.auth.restore();   // Forzar actualización de signals en AuthService
          this.loadingLogin = false;

          // Cargar modal lazy-load
          const { LoginSuccessDialogComponent } = await import('../../dialogs/login-success-dialog.component');
          const dialogRef = this.dialog.open(LoginSuccessDialogComponent, { width: '350px' });
          
          setTimeout(() => {
            if (dialogRef && dialogRef.componentInstance) {
               dialogRef.close();
            }
          }, 2000);
        },
        error: (error) => {
          this.loadingLogin = false;
          console.error(error);
        }
      });
  }

  private async syncUserWithBackend(account: any) {
    const email = account.idTokenClaims?.emails?.[0] || account.username;
    const userData = {
      email: email,
      nombre: account.name || email,
      provider: 'azure-ad',
      azureId: account.homeAccountId
    };

    (await this.auth.syncUserWithBackend(userData)).subscribe({
      next: (response) => {
        localStorage.setItem('userProfile', JSON.stringify(response.user));
        this.updateUserData(); // Refrescar foto si vino del backend
      }
    });
  }

  logout() {
    this.auth.logout(); // Limpia signals y localStorage
    this.authService.logoutPopup({ mainWindowRedirectUri: "/" });
    this.showMenu = false;
  }
  
  crearCuenta() {
    this.authService.loginRedirect({
      authority: 'https://instantjobb2c.b2clogin.com/instantjobb2c.onmicrosoft.com/B2C_1_Registro',
      scopes: ['openid', 'profile', 'email']
    });
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}