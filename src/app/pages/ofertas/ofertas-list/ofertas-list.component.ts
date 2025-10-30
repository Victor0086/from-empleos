import { Component } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgFor } from '@angular/common';

interface Oferta {
  titulo: string; area: string; tipo: string; comuna: string; sueldo?: number; estado: string;
}

@Component({
  standalone: true,
  selector: 'app-ofertas-list',
  imports: [MatTableModule, MatIconModule, MatButtonModule, NgFor],
  template: `
  <div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="m-0">Ofertas publicadas</h4>
    <a class="btn btn-primary" routerLink="/ofertas/nueva"><span class="material-icons me-1">add</span> Nueva oferta</a>
  </div>

  <table mat-table [dataSource]="data" class="mat-elevation-z1 w-100">

    <ng-container matColumnDef="titulo">
      <th mat-header-cell *matHeaderCellDef>Título</th>
      <td mat-cell *matCellDef="let e">{{ e.titulo }}</td>
    </ng-container>

    <ng-container matColumnDef="area">
      <th mat-header-cell *matHeaderCellDef>Área</th>
      <td mat-cell *matCellDef="let e">{{ e.area }}</td>
    </ng-container>

    <ng-container matColumnDef="tipo">
      <th mat-header-cell *matHeaderCellDef>Tipo</th>
      <td mat-cell *matCellDef="let e">{{ e.tipo }}</td>
    </ng-container>

    <ng-container matColumnDef="comuna">
      <th mat-header-cell *matHeaderCellDef>Comuna</th>
      <td mat-cell *matCellDef="let e">{{ e.comuna }}</td>
    </ng-container>

    <ng-container matColumnDef="estado">
      <th mat-header-cell *matHeaderCellDef>Estado</th>
      <td mat-cell *matCellDef="let e">
        <span class="badge" [class.bg-success]="e.estado==='publicada'"
                          [class.bg-secondary]="e.estado!=='publicada'">{{ e.estado }}</span>
      </td>
    </ng-container>

    <ng-container matColumnDef="acciones">
      <th mat-header-cell *matHeaderCellDef></th>
      <td mat-cell *matCellDef="let e">
        <button mat-icon-button color="primary" title="Editar"><span class="material-icons">edit</span></button>
        <button mat-icon-button color="warn" title="Pausar"><span class="material-icons">pause_circle</span></button>
      </td>
    </ng-container>

    <tr mat-header-row *matHeaderRowDef="cols"></tr>
    <tr mat-row *matRowDef="let row; columns: cols;"></tr>
  </table>
  `
})
export class OfertasListComponent {
  cols = ['titulo','area','tipo','comuna','estado','acciones'];
  data: Oferta[] = [
    { titulo:'Operario Carga', area:'Logística', tipo:'Temporal', comuna:'Renca', estado:'publicada' },
    { titulo:'Diseñador Web', area:'TI', tipo:'Freelance', comuna:'Ñuñoa', estado:'borrador' }
  ];
}
