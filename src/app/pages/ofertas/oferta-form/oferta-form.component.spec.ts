/// <reference types="jasmine" />
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OfertaFormComponent } from './oferta-form.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../../../../environments/environment';

describe('OfertaFormComponent', () => {
  let component: OfertaFormComponent;
  let fixture: ComponentFixture<OfertaFormComponent>;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let msalServiceSpy: jasmine.SpyObj<MsalService>;

  beforeEach(async () => {
    // 1. Mock de Router
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // 2. Mock de MSAL
    msalServiceSpy = jasmine.createSpyObj('MsalService', [], {
      instance: {
        getActiveAccount: jasmine.createSpy('getActiveAccount').and.returnValue({
          username: 'test@empresa.com',
          idTokenClaims: { email: 'test@empresa.com' }
        }),
        getAllAccounts: jasmine.createSpy('getAllAccounts').and.returnValue([])
      }
    });

    await TestBed.configureTestingModule({
      imports: [
        OfertaFormComponent, // Standalone
        ReactiveFormsModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: MsalService, useValue: msalServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OfertaFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    // Evitamos que los alerts bloqueen los tests
    spyOn(window, 'alert'); 
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // --- TEST 1: Creación ---
  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  // --- TEST 2: Validación del Formulario ---
  it('el formulario debe ser inválido si está vacío', () => {
    expect(component.form.valid).toBeFalse();
  });

  it('el formulario debe ser válido con datos correctos', () => {
    component.form.patchValue({
      titulo: 'Desarrollador Senior',
      comuna: 'Santiago',
      area: 'TI',
      tipo: 'INDEFINIDO',
      sueldoDesde: 1000,
      sueldoHasta: 2000,
      descripcion: 'Descripción larga de prueba para cumplir validación'
    });
    expect(component.form.valid).toBeTrue();
  });

  // --- TEST 3: Flujo Completo de Guardado (Éxito) ---
  it('debe guardar la oferta correctamente (fetch perfil -> http post -> navegar)', fakeAsync(() => {
    // A. Llenar el formulario
    component.form.setValue({
      titulo: 'Dev Ops',
      comuna: 'Remoto',
      area: 'TI',
      tipo: 'TEMPORAL',
      sueldoDesde: null,
      sueldoHasta: null,
      descripcion: 'Descripción válida de más de 10 caracteres'
    });

    // B. Mockear el "fetch" nativo que usas para obtener el perfil
    const mockPerfilResponse = { usuario: { userId: 'emp-123' } };
    spyOn(window, 'fetch').and.resolveTo({
      ok: true,
      json: () => Promise.resolve(mockPerfilResponse)
    } as Response);

    // C. Ejecutar save()
    component.save();

    // D. Avanzar el reloj para que se resuelva la promesa del fetch
    tick();

    // E. Interceptar la llamada HTTP POST que ocurre DESPUÉS del fetch
    const req = httpMock.expectOne(`${environment.apiConfig.url}/ofertas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.empleador_id).toBe('emp-123'); // Verificamos que usó el ID del fetch
    expect(req.request.body.titulo).toBe('Dev Ops');

    // F. Responder al POST
    req.flush({ message: 'Oferta creada' });

    // G. Verificar resultado final
    expect(window.alert).toHaveBeenCalledWith('¡Oferta publicada exitosamente!');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/ofertas']);
    expect(component.enviando).toBeFalse();
  }));

  // --- TEST 4: Error en MSAL (Usuario no logueado) ---
  it('debe mostrar error si no hay usuario activo en MSAL', () => {
    // 1. Configurar mocks para que no haya usuario
    msalServiceSpy.instance = jasmine.createSpyObj('Instance', ['getActiveAccount', 'getAllAccounts']);
    (msalServiceSpy.instance.getActiveAccount as jasmine.Spy).and.returnValue(null);
    (msalServiceSpy.instance.getAllAccounts as jasmine.Spy).and.returnValue([]);

    // 2. IMPORTANTE: Llenar el formulario para que sea válido y el código avance
    component.form.patchValue({
      titulo: 'Test Valid',
      comuna: 'Santiago',
      area: 'TI',
      tipo: 'INDEFINIDO',
      sueldoDesde: 1000,
      sueldoHasta: 2000,
      descripcion: 'Descripción válida para el test............'
    } as any);

    // 3. Ejecutar
    component.save();

    // 4. Verificar alerta
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error/));
  });

  // --- TEST 5: Error en Fetch (No encuentra ID de empleador) ---
  it('debe mostrar error si el backend no devuelve un userId en el perfil', fakeAsync(() => {
    component.form.setValue({
      titulo: 'Test', comuna: 'X', area: 'TI', tipo: 'A', sueldoDesde: 1, sueldoHasta: 2, descripcion: '12345678901'
    });

    // Mockeamos fetch pero devolvemos usuario null o vacío
    spyOn(window, 'fetch').and.resolveTo({
      ok: true,
      json: () => Promise.resolve({ usuario: null }) 
    } as Response);

    component.save();
    tick();

    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/No se pudo obtener la información del empleador/i));
    // No debe intentar crear la oferta
    httpMock.expectNone(`${environment.apiConfig.url}/ofertas`);
    expect(component.enviando).toBeFalse();
  }));

  // --- TEST 6: Error en POST (Falla al crear oferta) ---
  it('debe manejar error del servidor al crear la oferta', fakeAsync(() => {
    component.form.setValue({
      titulo: 'Test', comuna: 'X', area: 'TI', tipo: 'A', sueldoDesde: 1, sueldoHasta: 2, descripcion: '12345678901'
    });

    // Mock fetch OK
    spyOn(window, 'fetch').and.resolveTo({
      ok: true,
      json: () => Promise.resolve({ usuario: { userId: 'emp-123' } })
    } as Response);

    component.save();
    tick();

    // Interceptar POST y lanzar error
    const req = httpMock.expectOne(`${environment.apiConfig.url}/ofertas`);
    req.flush('Error interno', { status: 500, statusText: 'Server Error' });

    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/Error al publicar/i));
    expect(component.enviando).toBeFalse();
  }));
});