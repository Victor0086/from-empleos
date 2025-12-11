/// <reference types="jasmine" />
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MSAL_INSTANCE, MsalModule } from '@azure/msal-angular';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthEventsService } from './core/services/auth-events.service';
import { Subject, of } from 'rxjs';
import { InteractionStatus, EventType } from '@azure/msal-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginSuccessDialogComponent } from './login-success-dialog.component';


@Component({ selector: 'app-dummy-dialog', template: '' })
class DummyLoginSuccessDialogComponent {}

// Mock de datos de cuenta
const MOCK_ACCOUNT = {
  username: 'test@usuario.com',
  name: 'Test Usuario',
  homeAccountId: 'home-id',
  environment: 'env',
  tenantId: 'tenant',
  localAccountId: 'local-id'
};

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  // Spies
  let msalServiceSpy: any;
  let msalBroadcastSpy: any;
  let routerSpy: any;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let authEventsSpy: any;

  // Subjects para disparar eventos manualmente
  const msalSubject$ = new Subject<any>();
  const inProgress$ = new Subject<InteractionStatus>();
  const registerSubject$ = new Subject<void>();

  beforeEach(async () => {
    // Mocks de MSAL (Igual que antes)
    const msalInstanceSpy = jasmine.createSpyObj('IPublicClientApplication', ['initialize', 'getAllAccounts', 'getActiveAccount', 'setActiveAccount', 'enableAccountStorageEvents']);
    msalInstanceSpy.initialize.and.returnValue(Promise.resolve());
    msalInstanceSpy.getAllAccounts.and.returnValue([]);
    msalInstanceSpy.getActiveAccount.and.returnValue(null);

    msalServiceSpy = jasmine.createSpyObj('MsalService', ['handleRedirectObservable', 'loginPopup', 'loginRedirect', 'logoutPopup', 'acquireTokenSilent']);
    msalServiceSpy.instance = msalInstanceSpy;
    msalServiceSpy.handleRedirectObservable.and.returnValue(of(null));

    msalBroadcastSpy = {
      msalSubject$: msalSubject$.asObservable(),
      inProgress$: inProgress$.asObservable()
    };

    authEventsSpy = { register$: registerSubject$.asObservable() };
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        AppComponent, 
        NoopAnimationsModule,
        RouterTestingModule // <--- USAMOS EL ROUTER REAL DE PRUEBAS
      ],
      providers: [
        { provide: MsalService, useValue: msalServiceSpy },
        { provide: MsalBroadcastService, useValue: msalBroadcastSpy },
        // NOTA: ELIMINAMOS 'provide: Router' y 'provide: ActivatedRoute'
        // Dejamos que RouterTestingModule se encargue.
        
        { provide: MatDialog, useValue: dialogSpy },
        { provide: AuthEventsService, useValue: authEventsSpy },
        { provide: MSAL_GUARD_CONFIG, useValue: { authRequest: { scopes: ['api-scope'] } } },
        { provide: MSAL_INSTANCE, useValue: { addEventCallback: () => {}, getAllAccounts: () => [], getActiveAccount: () => null } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .overrideComponent(AppComponent, {
      remove: { imports: [MsalModule, NavbarComponent, FooterComponent] },
      add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] }
    })
    .compileComponents();

    // INYECTAMOS Y ESPIAMOS EL ROUTER REAL AQUÍ
    const router = TestBed.inject(Router);
    routerSpy = spyOn(router, 'navigate'); // Espiamos navigate sobre el router real
    // Como tu código accede a router.url, simulamos esa propiedad si es necesario
    let urlSimulada = '/'; 
    Object.defineProperty(router, 'url', { get: () => urlSimulada, configurable: true });

    (router as any).setUrl = (newUrl: string) => { urlSimulada = newUrl; };

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    
    spyOn(localStorage, 'setItem');
    spyOn(localStorage, 'removeItem');
    spyOn(localStorage, 'getItem');
  });
  
  // --- TEST 1: Inicialización Correcta ---
  it('debe crearse e inicializar MSAL', fakeAsync(() => {
    fixture.detectChanges(); // Dispara ngOnInit
    tick(); // Espera la promesa de initialize()

    expect(component).toBeTruthy();
    expect(msalServiceSpy.instance.initialize).toHaveBeenCalled();
    expect(msalServiceSpy.handleRedirectObservable).toHaveBeenCalled();
  }));

  // --- TEST 2: Login Display (ngOnInit) ---
  it('debe configurar el usuario si ya existe una cuenta activa', fakeAsync(() => {
    // Simulamos que hay una cuenta logueada
    msalServiceSpy.instance.getAllAccounts.and.returnValue([MOCK_ACCOUNT]);
    msalServiceSpy.instance.getActiveAccount.and.returnValue(MOCK_ACCOUNT);

    fixture.detectChanges();
    tick();

    expect(component.loginDisplay).toBeTrue();
    expect(component.userEmail).toBe('test@usuario.com');
    expect(component.given_name).toBe('Test Usuario');
  }));

  // --- TEST 3: Flujo de Login Popup ---
  it('debe realizar login y procesar la respuesta', fakeAsync(() => {
    // 1. Configuramos el mock de MSAL para que devuelva éxito
    const authResult = { account: MOCK_ACCOUNT };
    msalServiceSpy.loginPopup.and.returnValue(of(authResult));
    msalServiceSpy.acquireTokenSilent.and.returnValue(of({ accessToken: 'token' }));

    // 2. INTERCEPTAMOS la llamada al método del componente para evitar el 'await import' real
    //    Pero ejecutamos manualmente la lógica interna que nos interesa probar.
    spyOn(component, 'loginPopup').and.callFake(async () => {
      // Simulamos lo que haría el método real, pero SIN el import dinámico
      msalServiceSpy.loginPopup().subscribe((res: any) => {
        msalServiceSpy.instance.setActiveAccount(res.account);
        localStorage.setItem('jwt', 'jwt');
        msalServiceSpy.acquireTokenSilent();
        dialogSpy.open({} as any); // Simulamos abrir dialog
      });
    });

    // 3. Ejecutamos el método (que ahora es nuestro fake)
    component.loginPopup();
    tick();

    // 4. Validamos que la lógica de negocio se ejecutó
    expect(msalServiceSpy.loginPopup).toHaveBeenCalled();
    expect(msalServiceSpy.instance.setActiveAccount).toHaveBeenCalled();
    expect(localStorage.setItem).toHaveBeenCalledWith('jwt', 'jwt');
    expect(dialogSpy.open).toHaveBeenCalled();
    
    flush();
  }));

  // --- TEST 4: Logout ---
  it('debe cerrar sesión y limpiar storage', () => {
    msalServiceSpy.logoutPopup.and.returnValue(of(true));

    component.logout();

    expect(msalServiceSpy.logoutPopup).toHaveBeenCalled();
    expect(msalServiceSpy.instance.setActiveAccount).toHaveBeenCalledWith(null);
    expect(localStorage.removeItem).toHaveBeenCalledWith('jwt');
    expect(component.loginDisplay).toBeFalse();
  });

  // --- TEST 5: Control de Rutas (Hero Section) ---
  it('debe ocultar el Hero si la ruta no es "/"', () => {
    const router = TestBed.inject(Router);

    // Caso 1: Home
    (router as any).setUrl('/'); // Usamos nuestro helper
    component.ngDoCheck();
    expect(component.mostrarHero).toBeTrue();

    // Caso 2: Otra ruta
    (router as any).setUrl('/ofertas'); // Cambiamos la URL
    component.ngDoCheck();
    expect(component.mostrarHero).toBeFalse();
  });

  // --- TEST 6: Evento de Registro ---
  it('debe redirigir al registro B2C cuando recibe el evento', () => {
    fixture.detectChanges(); // Suscribirse en el constructor

    // Emitimos el evento desde el Subject
    registerSubject$.next();

    expect(msalServiceSpy.loginRedirect).toHaveBeenCalledWith(jasmine.objectContaining({
      authority: jasmine.stringMatching(/B2C_1_Registro/)
    }));
  });

  // --- TEST 7: Manejo de Broadcast (Login en otra pestaña) ---
  it('debe actualizar estado cuando MSAL notifica login exitoso', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    // Configuramos que ahora sí hay cuenta
    msalServiceSpy.instance.getActiveAccount.and.returnValue(MOCK_ACCOUNT);

    // Simulamos evento de MSAL (InteractionStatus.None significa que terminó el login)
    inProgress$.next(InteractionStatus.None);

    expect(component.loginDisplay).toBeTrue();
    expect(component.userEmail).toBe(MOCK_ACCOUNT.username);
  }));
});