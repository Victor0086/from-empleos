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
    // 1. Si el contrato no está pendiente o ya está activo, nadie puede firmar.
    if (contrato.estado !== 'PENDIENTE_FIRMAS') {
      return false;
    }

    // 2. Identificar qué rol juego yo en este contrato
    // Nota: Asegúrate de que contrato.postulacion traiga el trabajadorId
    const soyTrabajador = this.currentUserId === contrato.postulacion.trabajadorId;
    
    // Para saber si soy empleador, verificamos que NO sea trabajador 
    // (o idealmente comparamos con el ID del empleador si viene en el JSON)
    const soyEmpleador = !soyTrabajador; 

    // 3. Verificar si ya firmé
    if (soyTrabajador) {
      // Si soy trabajador, muestro el botón SOLO si mi firma es null
      return contrato.firmaTrabajador === null;
    } 
    
    if (soyEmpleador) {
      // Si soy empleador, muestro el botón SOLO si mi firma es null
      return contrato.firmaEmpleador === null;
    }

    return false;
  }

  firmar(contrato: Contrato) {
    // 1. Abrir el Popup para mostrar el contrato
    const dialogRef = this.dialog.open(ContratoDialogComponent, {
      width: '600px',
      data: { 
        contrato: contrato,
        // Datos simulados (idealmente vendrían del backend)
        tituloOferta: 'Desarrollador Java (Ejemplo)', 
        sueldo: 1500000,
        nombreEmpleador: 'Empresa Demo S.A.',
        nombreTrabajador: this.authService.instance.getActiveAccount()?.name || 'Usuario'
      }
    });

    // 2. Esperar confirmación del Popup
    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado === true) {
        this.ejecutarFirma(contrato);
      }
    });
  }

  private ejecutarFirma(contrato: Contrato) {
    this.firmandoId = contrato.id;
    
    // Llamada al servicio
    this.contratoService.firmarContrato(contrato.id).subscribe({
      next: (respuesta: any) => {
        // La respuesta ahora es un objeto: { mensaje: "...", contrato: {...} }
        const contratoActualizado = respuesta.contrato; 
        const mensajeServidor = respuesta.mensaje;

        // Actualizar la tabla localmente
        const index = this.contratos.findIndex(c => c.id === contratoActualizado.id);
        if (index !== -1) {
          this.contratos[index] = contratoActualizado;
          this.contratos = [...this.contratos]; // Refrescar tabla visualmente (trigger change detection)
        }
        
        this.firmandoId = null;

        // Mostrar el mensaje de éxito que vino del backend
        alert(mensajeServidor); 
      },
      error: (err) => {
        console.error('Error al firmar', err);
        this.firmandoId = null;
        
        // Manejo de errores
        const errorMsg = err.error || 'Error al firmar el contrato.';
        alert(errorMsg);
      }
    });
  }

  // firmar(contrato: Contrato) {
  //   if (!confirm('¿Estás seguro de que deseas firmar digitalmente este contrato?')) return;

  //   this.firmandoId = contrato.id;
    
  //   this.contratoService.firmarContrato(contrato.id).subscribe({
  //     next: (respuesta) => {
  //       // AQUI ESTA EL CAMBIO:
  //       // La respuesta ahora es un objeto: { mensaje: "...", contrato: {...} }
  //       const contratoActualizado = respuesta.contrato; 
  //       const mensajeServidor = respuesta.mensaje;

  //       // 1. Actualizar la tabla
  //       const index = this.contratos.findIndex(c => c.id === contratoActualizado.id);
  //       if (index !== -1) {
  //         this.contratos[index] = contratoActualizado;
  //         this.contratos = [...this.contratos]; // Refrescar tabla visualmente
  //       }
        
  //       this.firmandoId = null;

  //       // 2. Mostrar el mensaje personalizado que vino del Controller
  //       alert(mensajeServidor); 
  //     },
  //     error: (err) => {
  //       console.error('Error al firmar', err);
  //       this.firmandoId = null;
  //       // Si el backend envía el mensaje de error en el body (como lo configuramos en el catch)
  //       // a veces viene en err.error
  //       const errorMsg = err.error || 'Error al firmar el contrato.';
  //       alert(errorMsg);
  //     }
  //   });
  // }

}
