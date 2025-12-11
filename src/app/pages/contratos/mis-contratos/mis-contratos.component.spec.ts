/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MisContratosComponent } from './mis-contratos.component';
import { ContratoService } from '../../../core/services/contrato.service';
import { MsalService } from '@azure/msal-angular';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Datos Mock (falsos)
const MOCK_CONTRATOS = [
  {
    id: 1,
    estado: 'PENDIENTE_FIRMAS',
    postulacion: { trabajadorId: 'user-123', oferta: { titulo: 'Java Dev', salario: 1000 } },
    firmaTrabajador: null,
    firmaEmpleador: 'empresa-signature',
    oferta: { titulo: 'Desarrollador Java' } 
  },
  {
    id: 2,
    estado: 'ACTIVO',
    postulacion: { trabajadorId: 'user-123' },
    firmaTrabajador: 'mi-firma',
    firmaEmpleador: 'empresa-signature'
  }
];

describe('MisContratosComponent', () => {
  let component: MisContratosComponent;
  let fixture: ComponentFixture<MisContratosComponent>;
  
  let contratoServiceSpy: jasmine.SpyObj<ContratoService>;
  let msalServiceSpy: jasmine.SpyObj<MsalService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    const cServiceSpy = jasmine.createSpyObj('ContratoService', ['obtenerMisContratos', 'firmarContrato']);
    const dSpy = jasmine.createSpyObj('MatDialog', ['open']);
    
    const mServiceSpy = jasmine.createSpyObj('MsalService', [], {
      instance: {
        getActiveAccount: jasmine.createSpy('getActiveAccount').and.returnValue({ 
          localAccountId: 'user-123', 
          name: 'Bernardo Tester' 
        })
      }
    });

    await TestBed.configureTestingModule({
      imports: [
        MisContratosComponent, 
        NoopAnimationsModule
      ],
      providers: [
        { provide: ContratoService, useValue: cServiceSpy },
        { provide: MsalService, useValue: mServiceSpy },
        { provide: MatDialog, useValue: dSpy }
      ]
    })
    .compileComponents();

    contratoServiceSpy = TestBed.inject(ContratoService) as jasmine.SpyObj<ContratoService>;
    msalServiceSpy = TestBed.inject(MsalService) as jasmine.SpyObj<MsalService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(MisContratosComponent);
    component = fixture.componentInstance;
    
    // CORRECCIÓN AQUÍ: Agregamos 'as any' para evitar el error de tipos
    contratoServiceSpy.obtenerMisContratos.and.returnValue(of(MOCK_CONTRATOS as any)); 
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar los contratos al iniciar', () => {
    fixture.detectChanges(); 

    expect(msalServiceSpy.instance.getActiveAccount).toHaveBeenCalled();
    expect(component.currentUserId).toBe('user-123');
    expect(contratoServiceSpy.obtenerMisContratos).toHaveBeenCalled();
    expect(component.contratos.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('debe retornar el color correcto según el estado', () => {
    expect(component.getColorEstado('ACTIVO')).toBe('primary');
    expect(component.getColorEstado('PENDIENTE_FIRMAS')).toBe('accent');
    expect(component.getColorEstado('FINALIZADO')).toBe('warn');
  });

  it('debe permitir firmar solo si es PENDIENTE y falta mi firma', () => {
    fixture.detectChanges(); 
    
    const puede1 = component.puedeFirmar(MOCK_CONTRATOS[0] as any);
    expect(puede1).toBeTrue();

    const puede2 = component.puedeFirmar(MOCK_CONTRATOS[1] as any);
    expect(puede2).toBeFalse();
  });

  it('debe abrir el diálogo al hacer clic en firmar', () => {
    const dialogRefSpyObj = jasmine.createSpyObj({ afterClosed: of(true), close: null });
    dialogSpy.open.and.returnValue(dialogRefSpyObj);
    
    contratoServiceSpy.firmarContrato.and.returnValue(of({
      contrato: { ...MOCK_CONTRATOS[0], estado: 'ACTIVO' },
      mensaje: 'Firmado con éxito'
    }));

    spyOn(window, 'alert'); 

    component.firmar(MOCK_CONTRATOS[0] as any);

    expect(dialogSpy.open).toHaveBeenCalled();
    expect(contratoServiceSpy.firmarContrato).toHaveBeenCalledWith(1);
  });
});