import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgFor } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-documentos-upload',
  imports: [MatButtonModule, NgFor],
  template: `
  <h4 class="mb-3">Mis documentos</h4>

  <div class="card p-3 mb-3">
    <label class="form-label">Subir archivo</label>
    <input type="file" class="form-control" (change)="onFile($event)">
    <small class="text-muted">Formatos: PDF/JPG/PNG • Máx 5MB</small>
    <div class="mt-2">
      <button mat-raised-button color="primary" (click)="upload()" [disabled]="!selected">Subir</button>
    </div>
  </div>

  <div class="row g-3">
    <div class="col-12 col-md-6" *ngFor="let d of docs">
      <div class="card h-100">
        <div class="card-body">
          <h6 class="mb-1">{{ d.nombre }}</h6>
          <div class="small text-muted">{{ d.tipo }} • {{ d.estado }}</div>
          <div class="mt-2 d-flex gap-2">
            <a class="btn btn-sm btn-outline-primary">Ver</a>
            <a class="btn btn-sm btn-outline-secondary">Reemplazar</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class DocumentosUploadComponent {
  selected?: File;
  docs = [
    { nombre:'CV_2025.pdf', tipo:'Curriculum', estado:'vigente' },
    { nombre:'Antecedentes.pdf', tipo:'Certificado de antecedentes', estado:'pendiente validación' },
  ];

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    this.selected = input.files?.[0] || undefined;
  }
  upload() { if (this.selected) console.log('Subiendo', this.selected.name); }
}
