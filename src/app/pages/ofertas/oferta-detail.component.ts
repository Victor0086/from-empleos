import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

interface Oferta {
  id: number;
  titulo: string;
  area: string;
  tipo: string;
  comuna: string;
  sueldo?: number;
  estado: string;
  fecha: 'hoy' | 'ayer' | 'antiguo';
  descripcion: string;
  horario: string;
  duracion: string;
}

@Component({
  selector: 'app-oferta-detail',
  standalone: true,
  imports: [CommonModule],
  template: `<div *ngIf="oferta as ofertaData" class="container py-4">
    <h2 class="mb-3">{{ ofertaData.titulo }}</h2>
    <div class="mb-2"><strong>Área:</strong> {{ ofertaData.area }}</div>
    <div class="mb-2"><strong>Tipo:</strong> {{ ofertaData.tipo }}</div>
    <div class="mb-2"><strong>Comuna:</strong> {{ ofertaData.comuna }}</div>
    <div class="mb-2"><strong>Estado:</strong> {{ ofertaData.estado }}</div>
    <div class="mb-2"><strong>Fecha publicación:</strong> {{ ofertaData.fecha }}</div>
    <div class="mb-2"><strong>Descripción:</strong> {{ ofertaData.descripcion }}</div>
    <div class="mb-2"><strong>Horario:</strong> {{ ofertaData.horario }}</div>
    <div class="mb-2"><strong>Duración:</strong> {{ ofertaData.duracion }} (trabajo esporádico)</div>
    <div class="mb-2"><strong>Sueldo:</strong> {{ '$' + ofertaData.sueldo }}</div>
    <button class="btn btn-outline-primary mt-3">Postulación rápida</button>
  </div>
  <div *ngIf="!oferta" class="container py-4">
    <h2>Oferta no encontrada</h2>
  </div>`
})
export class OfertaDetailComponent {
  oferta?: Oferta;
  private route = inject(ActivatedRoute);

 
}


