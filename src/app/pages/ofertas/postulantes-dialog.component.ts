import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule, NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-postulantes-dialog',
  template: `
    <h2 mat-dialog-title>Postulantes</h2>
    <mat-dialog-content>
      <div *ngIf="!data || data.length === 0">
        <p>No hay postulantes para esta oferta.</p>
      </div>
      <div *ngIf="data && data.length > 0">
        <div *ngFor="let postulante of data" class="mb-3 p-2 border rounded">
          <div><strong>Nombre:</strong> {{ postulante.nombres || postulante.nombre }} {{ postulante.apellidos || '' }}</div>
          <div *ngIf="postulante.email"><strong>Email:</strong> {{ postulante.email }}</div>
          <div *ngIf="postulante.rut"><strong>RUT:</strong> {{ postulante.rut }}</div>
          <div *ngIf="postulante.telefono"><strong>Teléfono:</strong> {{ postulante.telefono }}</div>
          <div *ngIf="postulante.experiencia"><strong>Experiencia:</strong> {{ postulante.experiencia }}</div>
          <div *ngIf="postulante.descripcion_experiencia"><strong>Descripción experiencia:</strong> {{ postulante.descripcion_experiencia }}</div>
          <div *ngIf="postulante.motivacion"><strong>Motivación:</strong> {{ postulante.motivacion }}</div>
          <div>
            <strong>Curriculum:</strong>
            <ng-container *ngIf="postulante.curriculumName && postulante.curriculumPath; else noCV">
              <a [href]="'http://localhost:8081/uploads/curriculums/' + postulante.curriculumPath" target="_blank">{{ postulante.curriculumName }}</a>
            </ng-container>
            <ng-template #noCV>No disponible</ng-template>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, MatDialogModule, MatButtonModule],
})
export class PostulantesDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<PostulantesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any[]
  ) {}
}
