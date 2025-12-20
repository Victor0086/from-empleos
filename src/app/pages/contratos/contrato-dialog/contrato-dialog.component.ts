import { Component, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Contrato } from '../../../core/services/contrato.service';

@Component({
  selector: 'app-contrato-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  providers: [CurrencyPipe],
  templateUrl: './contrato-dialog.component.html',
  styleUrl: './contrato-dialog.component.css'
})
export class ContratoDialogComponent {
fechaActual = new Date();

  constructor(
    public dialogRef: MatDialogRef<ContratoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      contrato: Contrato,
      nombreEmpleador?: string,
      nombreTrabajador?: string,
      tituloOferta?: string,
      sueldo?: number,
      tipoContrato?: string
    }
  ) {}
}