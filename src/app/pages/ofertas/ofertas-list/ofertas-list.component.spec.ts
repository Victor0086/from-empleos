/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OfertasListComponent } from './ofertas-list.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../../core/services/auth.service';
import { MsalService } from '@azure/msal-angular';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { of } from 'rxjs';

// Mock de datos
const MOCK_OFERTAS = [
  {
    oferta_id: 1,
    titulo: 'Desarrollador Angular',
    estado: 'ABIERTA',
    fecha_creacion: new Date().toISOString(),
    descripcion: 'Experiencia en RxJS'
  },
  {
    oferta_id: 2,
    titulo: 'Desarrollador Java',
    estado: 'CERRADA', // Esta no debería verse para trabajadores
    fecha_creacion: new Date().toISOString(),
    descripcion: 'Spring Boot'
  }
];

describe('OfertasListComponent', () => {
  let component: OfertasListComponent;
  let fixture: ComponentFixture<OfertasListComponent>;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let msalServiceSpy: jasmine.SpyObj<MsalService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    // 1. Crear Espías (Spies)
    authServiceSpy = jasmine.createSpyObj('AuthService', ['role']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    
    // Mock especial para MSAL
    msalServiceSpy = jasmine.createSpyObj('MsalService', [], {
      instance: {
        getAllAccounts: jasmine.createSpy('getAllAccounts').and.returnValue([]),
        getActiveAccount: jasmine.createSpy('getActiveAccount').and.returnValue(null)
      }
    });

    // Mock por defecto: Rol Trabajador
    authServiceSpy.role.and.returnValue('trabajador');

    await TestBed.configureTestingModule({
      imports: [
        OfertasListComponent, // Componente Standalone
        HttpClientTestingModule // Para interceptar llamadas HTTP
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MsalService, useValue: msalServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OfertasListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    
    // Espiamos window.alert y window.confirm para que no bloqueen los tests
    spyOn(window, 'alert');
    spyOn(window, 'confirm').and.returnValue(true);
  });

  afterEach(() => {
    httpMock.verify(); // Verificar que no queden peticiones HTTP pendientes
    localStorage.clear();
  });

  // --- TEST 1: Creación ---
  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  // --- TEST 2: Carga para TRABAJADOR ---
  it('debe cargar solo ofertas ABIERTAS si es trabajador', () => {
    authServiceSpy.role.and.returnValue('trabajador');
    
    fixture.detectChanges(); // Dispara ngOnInit

    // Interceptamos la llamada HTTP
    const req = httpMock.expectOne(`${environment.apiConfig.url}/ofertas`);
    expect(req.request.method).toBe('GET');
    
    // Devolvemos datos simulados
    req.flush(MOCK_OFERTAS);

    // Verificamos que filtró la cerrada
    expect(component.ofertas.length).toBe(1);
    expect(component.ofertas[0].titulo).toBe('Desarrollador Angular');
  });

  // --- TEST 3: Carga para EMPLEADOR ---
  it('debe cargar ofertas del empleador si es empleador', () => {
    authServiceSpy.role.and.returnValue('empleador');
    
    // Simulamos localStorage para que encuentre el userId
    const mockAuthData = JSON.stringify({ user: { userId: 'emp-123' } });
    spyOn(localStorage, 'getItem').and.callFake((key) => {
      return key === 'auth' ? mockAuthData : null;
    });

    fixture.detectChanges(); // Dispara ngOnInit

    // Debe llamar al endpoint específico de empleador
    const req = httpMock.expectOne(`${environment.apiConfig.url}/ofertas/empleador/emp-123`);
    expect(req.request.method).toBe('GET');
    
    req.flush(MOCK_OFERTAS); // El empleador ve todas sus ofertas (incluso cerradas)

    expect(component.misOfertas.length).toBe(2);
  });

  // --- TEST 4: Cambio de estado (Abrir/Cerrar) ---
  it('debe cambiar el estado de la oferta y llamar a la API', () => {
    const ofertaPrueba = { ...MOCK_OFERTAS[0], estado: 'ABIERTA', id: 1 } as any;
    
    component.cambiarEstado(ofertaPrueba);

    // Debe hacer un PUT
    const req = httpMock.expectOne(`${environment.apiConfig.url}/ofertas/1/estado`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ estado: 'CERRADA' });

    req.flush({}); // Responder éxito

    expect(ofertaPrueba.estado).toBe('CERRADA');
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/cerrada/i));
  });

  // --- TEST 5: Eliminar oferta ---
  it('debe eliminar una oferta si el usuario confirma', () => {
    const ofertaPrueba = { id: 1, titulo: 'Borrarme' } as any;
    component.misOfertas = [ofertaPrueba];

    component.eliminarOferta(ofertaPrueba);

    // Debe hacer DELETE
    const req = httpMock.expectOne(`${environment.apiConfig.url}/ofertas/1`);
    expect(req.request.method).toBe('DELETE');

    req.flush({}); // Éxito

    expect(component.misOfertas.length).toBe(0);
    expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching(/eliminada/i));
  });

  // --- TEST 6: Lógica de Fechas ---
  it('debe calcular correctamente etiquetas de fecha', () => {
    // Caso HOY
    const hoyMismo = new Date();
    expect(component.calcularFecha(hoyMismo.toISOString())).toBe('hoy');
    
    // Caso AYER
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    expect(component.calcularFecha(ayer.toISOString())).toBe('ayer');

    // Caso ANTIGUO
    const antiguo = new Date();
    antiguo.setDate(antiguo.getDate() - 5);
    expect(component.calcularFecha(antiguo.toISOString())).toBe('antiguo');
  });

  // --- TEST 7: Ordenamiento ---
  it('debe ordenar ofertas por estado (relevancia)', () => {
    component.data = [
      { estado: 'CERRADA' } as any,
      { estado: 'ABIERTA' } as any
    ];
    
    component.ordenarPor('relevantes');

    expect(component.ofertasOrdenadas[0].estado).toBe('ABIERTA');
    expect(component.ofertasOrdenadas[1].estado).toBe('CERRADA');
  });
});