/// <reference types="jasmine" />
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthEventsService } from '../../core/services/auth-events.service';
import { PerfilReloadService } from '../../core/services/perfil-reload.service';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { InteractionStatus } from '@azure/msal-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, ElementRef } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginSuccessDialogComponent } from '../../dialogs/login-success-dialog.component';

@Component({ selector: 'app-dummy-dialog', template: '' })
class DummyLoginSuccessDialogComponent {}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  // Spies
  let authServiceSpy: any;
  let msalServiceSpy: any;
  let msalBroadcastSpy: any;
  let routerSpy: jasmine.Spy;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let authEventsSpy: jasmine.SpyObj<AuthEventsService>;
  let perfilReloadSpy: jasmine.SpyObj<PerfilReloadService>;
  

  // Subject para simular eventos de Broadcast de MSAL
  const msalSubject = new Subject<InteractionStatus>();

  beforeEach(async () => {
    // --- (MOCKS DE SERVICIOS - LOS MISMOS DE SIEMPRE) ---
    authServiceSpy = { isLogged: jasmine.createSpy().and.returnValue(() => false), role: jasmine.createSpy().and.returnValue(() => 'guest'), restore: jasmine.createSpy(), logout: jasmine.createSpy(), syncUserWithBackend: jasmine.createSpy().and.returnValue(Promise.resolve(of({ user: { fotoUrl: 'foto.jpg' } }))) };
    msalServiceSpy = { instance: { getAllAccounts: jasmine.createSpy().and.returnValue([]), setActiveAccount: jasmine.createSpy() }, loginPopup: jasmine.createSpy().and.returnValue(of({ account: { username: 'test' } })), logoutPopup: jasmine.createSpy(), loginRedirect: jasmine.createSpy() };
    msalBroadcastSpy = { inProgress$: msalSubject.asObservable() };
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    authEventsSpy = jasmine.createSpyObj('AuthEventsService', [], { login$: new Subject() });
    perfilReloadSpy = jasmine.createSpyObj('PerfilReloadService', ['triggerReload']);

    await TestBed.configureTestingModule({
      imports: [
        NavbarComponent, 
        NoopAnimationsModule,
        // Configuración completa del Router para pruebas
        RouterTestingModule.withRoutes([]) 
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MsalService, useValue: msalServiceSpy },
        { provide: MsalBroadcastService, useValue: msalBroadcastSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: AuthEventsService, useValue: authEventsSpy },
        { provide: PerfilReloadService, useValue: perfilReloadSpy }
        // NOTA: NO proveemos 'Router' ni 'ActivatedRoute' aquí.
        // Dejamos que RouterTestingModule provea los reales/funcionales.
      ]
    }).compileComponents();

    // Inyectamos el Router real del módulo de pruebas para poder espiarlo
    const router = TestBed.inject(Router);
    routerSpy = spyOn(router, 'navigate') as jasmine.Spy; // Espiamos el método navigate del router real

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- TEST 1: Creación ---
  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  // --- TEST 2: Menú Desplegable ---
  it('debe abrir y cerrar el menú', () => {
    const fakeEvent = { stopPropagation: () => { } } as any;

    // Abrir
    component.toggleMenu(fakeEvent);
    expect(component.showMenu).toBeTrue();

    // Cerrar
    component.closeMenu();
    expect(component.showMenu).toBeFalse();
  });

  // --- TEST 3: Click fuera cierra menú (HostListener) ---
  it('debe cerrar el menú si se hace clic fuera', () => {
    component.showMenu = true;

    // Simulamos un click en el documento (fuera del componente)
    document.dispatchEvent(new MouseEvent('click'));

    expect(component.showMenu).toBeFalse();
  });

  // --- TEST 4: Login Flow ---
  it('debe ejecutar login y sincronizar datos', fakeAsync(() => {
    // 1. Interceptamos el método real para evitar el ChunkLoadError
    spyOn(component, 'login').and.callFake(() => {
      component.loadingLogin = true;
      // Simulamos la llamada al servicio
      msalServiceSpy.loginPopup().subscribe(() => {
        authServiceSpy.syncUserWithBackend();
        component.loadingLogin = false;
        dialogSpy.open({} as any);
      });
    });

    // 2. Ejecutamos
    component.login();
    tick();

    // 3. Validamos
    expect(component.loadingLogin).toBeFalse();
    expect(msalServiceSpy.loginPopup).toHaveBeenCalled();
    expect(authServiceSpy.syncUserWithBackend).toHaveBeenCalled();
    expect(dialogSpy.open).toHaveBeenCalled();
    
    flush();
  }));

  // --- TEST 5: Logout Flow ---
  it('debe cerrar sesión local y en Azure', () => {
    component.logout();

    expect(authServiceSpy.logout).toHaveBeenCalled(); // Local
    expect(msalServiceSpy.logoutPopup).toHaveBeenCalled(); // Azure
    expect(component.showMenu).toBeFalse();
  });

  // --- TEST 6: Actualizar Datos de Usuario ---
  it('debe actualizar nombre y foto si hay cuenta activa', () => {
    // Simulamos que MSAL devuelve una cuenta
    const mockAccount = { name: 'Bernardo Bravo', username: 'b@b.cl' };
    msalServiceSpy.instance.getAllAccounts.and.returnValue([mockAccount]);

    // Simulamos foto en localStorage
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify({ fotoUrl: 'mi-foto.png' }));

    component.updateUserData();

    expect(component.given_name).toBe('Bernardo Bravo');
    expect(component.fotoUrl).toBe('mi-foto.png');
    expect(msalServiceSpy.instance.setActiveAccount).toHaveBeenCalledWith(mockAccount);
  });

  // --- TEST 7: Navegación a Perfil ---
  it('debe navegar a perfil y recargar datos', fakeAsync(() => {
    component.verMiCV();

    expect(routerSpy).toHaveBeenCalledWith(['/perfil']);

    tick(150); // Esperar el setTimeout de 100ms
    expect(perfilReloadSpy.triggerReload).toHaveBeenCalled();
    expect(component.showMenu).toBeFalse();
  }));
});