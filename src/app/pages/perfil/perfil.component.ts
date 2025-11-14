import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Usuario {
  nombre: string;
  fotoUrl?: string;
  nacionalidad: string;
  nacimiento: string;
  genero: string;
  estadoCivil: string;
  licencia: string;
  contacto: {
    celular: string;
    telefono: string;
    email: string;
    direccion: string;
  };
  estudios: Array<{
    titulo: string;
    institucion: string;
    tipo: string;
    estado: string;
    fecha: string;
    referencia?: string;
    certificado?: boolean;
  }>;
  cvAdjunto?: string;
}

const USUARIO_MOCK: Usuario = {
  nombre: 'victor nuñez',
  fotoUrl: '',
  nacionalidad: 'Chile',
  nacimiento: '02/10/1986',
  genero: 'masculino',
  estadoCivil: 'Casado/a',
  licencia: '4',
  contacto: {
    celular: '+9 62207929',
    telefono: '+9 98770098',
    email: 'victor_retamal@outlook.cl',
    direccion: 'pasaje valle del elqui, Padre Hurtado, Región Metropolitana, Chile'
  },
  estudios: [
    {
      titulo: 'ingeniería en desarrollo de software',
      institucion: 'Inst. DuocUC',
      tipo: 'Otro',
      estado: 'En Curso',
      fecha: 'Ago 2024 - Actualidad, Chile',
      referencia: '',
      certificado: false
    },
    {
      titulo: 'Analista programador computacional',
      institucion: 'Inst. DuocUC',
      tipo: 'Terciario/Técnico',
      estado: 'Graduado',
      fecha: 'Mar 2018 - Jul 2020, Chile',
      referencia: '',
      certificado: true
    },
    {
      titulo: 'técnico electromecánico',
      institucion: 'Inst. DuocUC',
      tipo: 'Terciario/Técnico',
      estado: 'Graduado',
      fecha: 'Mar 2015 - Dic 2017, Chile',
      referencia: '',
      certificado: true
    }
  ],
  cvAdjunto: 'Archivo adjunto.docx'
};

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="container py-4">
    <div class="row g-4">
      <div class="col-md-3">
        <div class="card p-3 text-center">
          <img *ngIf="usuario.fotoUrl" [src]="usuario.fotoUrl" alt="Foto de perfil" class="rounded-circle mb-2" width="80" height="80">
          <div class="fw-bold mb-2">{{ usuario.nombre }}</div>
          <div class="text-start">
            <div class="mb-1"><strong>Nacionalidad:</strong> {{ usuario.nacionalidad }}</div>
            <div class="mb-1"><strong>Fecha de nacimiento:</strong> {{ usuario.nacimiento }}</div>
            <div class="mb-1"><strong>Género:</strong> {{ usuario.genero }}</div>
            <div class="mb-1"><strong>Estado civil:</strong> {{ usuario.estadoCivil }}</div>
            <div class="mb-1"><strong>Licencia de Conducir:</strong> {{ usuario.licencia }}</div>
          </div>
        </div>
        <div class="card p-3 mt-3">
          <div class="fw-bold mb-2">Datos de contacto</div>
          <div class="mb-1"><span class="material-icons align-middle">smartphone</span> {{ usuario.contacto.celular }}</div>
          <div class="mb-1"><span class="material-icons align-middle">phone</span> {{ usuario.contacto.telefono }}</div>
          <div class="mb-1"><span class="material-icons align-middle">email</span> {{ usuario.contacto.email }}</div>
          <div class="mb-1"><span class="material-icons align-middle">location_on</span> {{ usuario.contacto.direccion }}</div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card p-3">
          <ul class="nav nav-tabs mb-3">
            <li class="nav-item"><a class="nav-link active">Educación</a></li>
            <li class="nav-item"><a class="nav-link disabled">Experiencia</a></li>
            <li class="nav-item"><a class="nav-link disabled">Perfil</a></li>
          </ul>
          <div>
            <div class="fw-bold mb-2">Formación académica y cursos</div>
            <div *ngFor="let est of usuario.estudios" class="mb-3">
              <div class="fw-semibold">{{ est.titulo }}</div>
              <div class="text-muted">{{ est.institucion }}</div>
              <div class="small">{{ est.tipo }} - {{ est.estado }}</div>
              <div class="small">{{ est.fecha }}</div>
              <div *ngIf="est.certificado" class="mt-1"><a href="#" class="link-primary">Sumar certificado</a></div>
              <div class="mt-1"><a href="#" class="link-primary">Sumar referencia académica</a></div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card p-3 mb-3">
          <div class="fw-bold mb-2">CV adjunto</div>
          <div *ngIf="usuario.cvAdjunto">
            <span class="material-icons align-middle">attach_file</span> {{ usuario.cvAdjunto }}
            <a href="#" class="ms-2"><span class="material-icons">download</span></a>
          </div>
        </div>
        <div class="card p-3">
          <div class="fw-bold mb-2">Mejora tu CV agregando:</div>
          <div><span class="material-icons align-middle">flag</span> Objetivo</div>
          <div><span class="material-icons align-middle">psychology</span> Conocimientos y habilidades</div>
        </div>
      </div>
    </div>
  </div>
  `
})
export class PerfilComponent {
  usuario = USUARIO_MOCK;
}
