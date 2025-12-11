/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContratoDialogComponent } from './contrato-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ContratoDialogComponent', () => {
  let component: ContratoDialogComponent;
  let fixture: ComponentFixture<ContratoDialogComponent>;

  // Creamos un espía para la referencia del diálogo (para saber si se cierra)
  const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

  // Creamos los datos falsos que el componente espera recibir
  const mockDialogData = {
    contrato: { 
      id: 1, 
      estado: 'PENDIENTE_FIRMAS',
      // Agregamos 'as any' al contrato para no tener que llenar 
      // todos los campos obligatorios de tu interfaz real
    } as any, 
    nombreEmpleador: 'Empresa Fantasma S.A.',
    nombreTrabajador: 'Pepe Desarrollador',
    tituloOferta: 'Full Stack Java',
    sueldo: 2000000,
    tipoContrato: 'Indefinido'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ContratoDialogComponent, // Componente Standalone
        NoopAnimationsModule     // Desactivar animaciones
      ],
      providers: [
        // Inyectamos el Mock del DialogRef (el control de la ventana)
        { provide: MatDialogRef, useValue: dialogRefSpy },
        
        // Inyectamos los datos falsos (la "payload" del modal)
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- TEST 1: Creación ---
  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  // --- TEST 2: Inyección de Datos ---
  it('debe recibir correctamente los datos inyectados', () => {
    // Verificamos que las variables públicas del componente tengan lo que pasamos en el provider
    expect(component.data).toBeDefined();
    expect(component.data.nombreEmpleador).toBe('Empresa Fantasma S.A.');
    expect(component.data.sueldo).toBe(2000000);
    expect(component.data.contrato.id).toBe(1);
  });

  // --- TEST 3: Propiedades internas ---
  it('debe inicializar la fecha actual', () => {
    expect(component.fechaActual).toBeDefined();
    expect(component.fechaActual instanceof Date).toBeTrue();
  });

  // --- TEST 4: Renderizado Básico (Opcional pero recomendado) ---
  it('debe mostrar la información en la vista HTML', () => {
    // Obtenemos el HTML renderizado
    const compiled = fixture.nativeElement as HTMLElement;
    
    // Angular Material suele renderizar los textos. 
    // Buscamos si el texto del mock aparece en algún lado del HTML.
    expect(compiled.textContent).toContain('Empresa Fantasma S.A.');
    expect(compiled.textContent).toContain('Full Stack Java');
  });
});