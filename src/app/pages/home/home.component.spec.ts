/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { AuthService } from '../../core/services/auth.service';
import { MsalService } from '@azure/msal-angular';
import { RouterTestingModule } from '@angular/router/testing'; // Necesario para routerLink
import { Router } from '@angular/router';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  // Spies
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let msalServiceSpy: jasmine.SpyObj<MsalService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLogged']);
    
    // Mock básico de MsalService
    msalServiceSpy = jasmine.createSpyObj('MsalService', [], {
      instance: {
        getAllAccounts: jasmine.createSpy('getAllAccounts').and.returnValue([])
      }
    });

    await TestBed.configureTestingModule({
      imports: [
        HomeComponent,      // Componente Standalone va en imports
        RouterTestingModule // Importante para que funcionen los <a routerLink>
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MsalService, useValue: msalServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- TEST 1: Creación ---
  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  // --- TEST 2: Renderizado del Título ---
  it('debe mostrar el título principal', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector('h1');
    expect(h1?.textContent).toContain('Tu próximo trabajo esporádico comienza aquí');
  });

  // --- TEST 3: Enlaces de navegación ---
  it('debe contener enlaces hacia el login', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    
    // Buscamos todos los enlaces <a>
    const links = compiled.querySelectorAll('a');
    
    // Debería haber al menos 2 enlaces (Empresa y Trabajador)
    expect(links.length).toBeGreaterThanOrEqual(2);
    
    // Verificamos que tengan el atributo routerLink (en el DOM compilado suele verse como href o ng-reflect-router-link)
    // En RouterTestingModule, routerLink genera un href.
    const linkEmpresa = links[0].getAttribute('href');
    expect(linkEmpresa).toBe('/login');
  });

  // --- TEST 4: Existencia del método (Sin ejecutarlo) ---
  it('debe tener definido el método registrarAzure', () => {
    expect(component.registrarAzure).toBeDefined();
    // NOTA: No ejecutamos component.registrarAzure() porque usa window.location.href
    // y eso navegaría fuera del test runner, rompiendo la prueba.
  });
});