import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ContratoService, Contrato } from '../../../core/services/contrato.service';
import { MsalService } from '@azure/msal-angular';
import { MatDialog } from '@angular/material/dialog';
import { ContratoDialogComponent } from '../contrato-dialog/contrato-dialog.component';

@Component({
  selector: 'app-mis-contratos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './mis-contratos.component.html',
  styleUrl: './mis-contratos.component.css'
})
export class MisContratosComponent implements OnInit {
  contratos: Contrato[] = [];
  displayedColumns: string[] = ['id', 'oferta', 'estado', 'firmas', 'acciones'];
  loading = true;
  firmandoId: number | null = null;
  currentUserId: string = '';

  constructor(
    private contratoService: ContratoService,
    private authService: MsalService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    // Obtener ID del usuario actual para saber si ya firmó
    const account = this.authService.instance.getActiveAccount();
    if (account && account.localAccountId) {
      this.currentUserId = account.localAccountId; // O el campo que uses como ID en tu backend (oid)
    }

    this.cargarContratos();
  }

  cargarContratos() {
    this.loading = true;
    this.contratoService.obtenerMisContratos().subscribe({
      next: (data) => {
        this.contratos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando contratos', err);
        this.loading = false;
      }
    });
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'ACTIVO': return 'primary'; // Verde/Azul según tema
      case 'PENDIENTE_FIRMAS': return 'accent'; // Amarillo/Naranja
      case 'FINALIZADO': return 'warn';
      default: return '';
    }
  }

  puedeFirmar(contrato: Contrato): boolean {
    if (contrato.estado !== 'PENDIENTE_FIRMAS') {
      return false;
    }

    const soyTrabajador = this.currentUserId === contrato.postulacion.trabajadorId;
    const soyEmpleador = !soyTrabajador; 

    if (soyTrabajador) {
      return contrato.firmaTrabajador === null;
    } 
    
    if (soyEmpleador) {
      return contrato.firmaEmpleador === null;
    }

    return false;
  }

  firmar(contrato: Contrato) {
    const dialogRef = this.dialog.open(ContratoDialogComponent, {
      width: '600px',
      data: { 
        contrato: contrato,
        tituloOferta: 'Desarrollador Java (Ejemplo)', 
        sueldo: 1500000,
        nombreEmpleador: 'Empresa Demo S.A.',
        nombreTrabajador: this.authService.instance.getActiveAccount()?.name || 'Usuario'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado === true) {
        this.ejecutarFirma(contrato);
      }
    });
  }

  private ejecutarFirma(contrato: Contrato) {
    this.firmandoId = contrato.id;
    
    this.contratoService.firmarContrato(contrato.id).subscribe({
      next: (respuesta: any) => {
        const contratoActualizado = respuesta.contrato; 
        const mensajeServidor = respuesta.mensaje;

        const index = this.contratos.findIndex(c => c.id === contratoActualizado.id);
        if (index !== -1) {
          this.contratos[index] = contratoActualizado;
          this.contratos = [...this.contratos];
        }
        
        this.firmandoId = null;

        alert(mensajeServidor); 
      },
      error: (err) => {
        console.error('Error al firmar', err);
        this.firmandoId = null;
        
        const errorMsg = err.error || 'Error al firmar el contrato.';
        alert(errorMsg);
      }
    });
  }

}
