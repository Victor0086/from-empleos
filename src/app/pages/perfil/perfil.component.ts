import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PerfilReloadService } from '../../core/services/perfil-reload.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MsalService } from '@azure/msal-angular';
import { Router, NavigationEnd } from '@angular/router';

interface Usuario {
  userId?: string;
  nombre: string;
  fotoUrl?: string;
  nacionalidad: string;
  nacimiento: string;
  genero: string;
  estadoCivil: string;
  licencia: string;
  rol: string;
  contacto: {
    celular: string;
    telefono: string;
    email: string;
    direccion: string;
  };
  estudios?: Array<{
    titulo: string;
    institucion: string;
    tipo?: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    referencia?: string;
    certificado?: boolean;
  }>;
  experiencias?: Array<{
    empresa: string;
    puesto: string;
    fechaInicio?: string;
    fechaFin?: string;
    descripcion?: string;
  }>;
  descripcion?: string;
  habilidades?: string;
  cvAdjunto?: string;
}

// ...

// ...existing imports and code...

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal de confirmación de inicio de sesión -->
    <div *ngIf="showGuardadoModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Inicio de sesión exitoso</h5>
          </div>
          <div class="modal-body">
            <p>¡Bienvenido! Has iniciado sesión correctamente.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación de guardado de perfil -->
    <div *ngIf="showPerfilGuardadoModal" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Perfil guardado correctamente</h5>
            <button type="button" class="btn-close" aria-label="Close" (click)="cerrarPerfilGuardadoModal()"></button>
          </div>
          <div class="modal-body">
            <p>Los cambios en tu perfil han sido guardados.</p>
          </div>
        </div>
      </div>
    </div>
  <div class="container py-4">
    <ng-container *ngIf="usuario">
      <ng-container *ngIf="!usuario.nombre">
        <!-- Formulario para usuario nuevo -->
        <div class="row justify-content-center">
          <div class="col-md-8">
            <div class="card p-4">
              <h4>Completa tu perfil</h4>
              <form (ngSubmit)="guardarCurriculum()" #perfilForm="ngForm">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label>Nombre completo</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoUsuario.nombre" name="nombre" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Nacionalidad</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoUsuario.nacionalidad" name="nacionalidad">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Fecha de nacimiento</label>
                    <input type="date" class="form-control" [(ngModel)]="nuevoUsuario.nacimiento" name="nacimiento">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Género</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoUsuario.genero" name="genero">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Estado civil</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoUsuario.estadoCivil" name="estadoCivil">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Licencia de conducir</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoUsuario.licencia" name="licencia">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Rol</label>
                    <select class="form-select" [(ngModel)]="nuevoUsuario.rol" name="rol" required>
                      <option value="trabajador">Trabajador</option>
                      <option value="empleador">Empleador</option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Celular</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoUsuario.contacto.celular" name="celular">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Teléfono</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoUsuario.contacto.telefono" name="telefono">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Email</label>
                    <input type="email" class="form-control" [(ngModel)]="nuevoUsuario.contacto.email" name="email" required>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label>Dirección</label>
                    <input type="text" class="form-control" [(ngModel)]="nuevoUsuario.contacto.direccion" name="direccion">
                  </div>
                </div>
                <button type="submit" class="btn btn-success mt-3">Guardar perfil</button>
              </form>
            </div>
          </div>
        </div>
      </ng-container>
      <ng-container *ngIf="usuario && usuario.nombre">
        <!-- Mostrar el perfil existente con los datos del usuario -->
        <div class="row g-4">
          <div class="col-md-3">
            <div class="card p-3 text-center">
              <img *ngIf="usuario.fotoUrl" [src]="usuario.fotoUrl" alt="Foto de perfil" class="rounded-circle mb-2" width="120" height="120">
              <div *ngIf="!usuario.fotoUrl" class="avatar-circle mb-2" style="width:120px;height:120px;line-height:120px;font-size:3rem;background:#888;color:#fff;border-radius:50%;display:inline-block;">
                {{ usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : '?' }}
              </div>
              <div class="mb-2">
                <input type="file" accept="image/*" (change)="onFotoSelected($event)" #fotoInput style="display:none;">
                <button class="btn btn-sm btn-outline-primary" (click)="$event.preventDefault(); fotoInput.click();">Subir foto</button>
              </div>
              <div class="d-flex justify-content-center align-items-center mb-2">
                <div class="fw-bold mb-2">{{ usuario.nombre }}</div>
                <button class="btn btn-link p-0 ms-2" (click)="abrirModalEdicion()">
                  <span class="material-icons">edit</span>
                </button>
              </div>
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
                <li class="nav-item"><a class="nav-link" [class.active]="activeTab === 'educacion'" (click)="activeTab = 'educacion'">Educación</a></li>
                <li class="nav-item"><a class="nav-link" [class.active]="activeTab === 'experiencia'" (click)="activeTab = 'experiencia'">Experiencia</a></li>
                <li class="nav-item"><a class="nav-link" [class.active]="activeTab === 'perfil'" (click)="activeTab = 'perfil'">Perfil</a></li>
              </ul>
              <div [ngSwitch]="activeTab">
                <div *ngSwitchCase="'educacion'">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-bold">Formación académica y cursos</span>
                    <button class="btn btn-link p-0" (click)="abrirModalEducacion()"><span class="material-icons">edit</span></button>
                  </div>
                  <div>
                    <div class="fw-bold mb-2">Formación académica y cursos</div>
                    <div *ngFor="let est of usuario.estudios" class="mb-3">
                      <div class="fw-semibold">{{ est.titulo }}</div>
                      <div class="text-muted">{{ est.institucion }}</div>
                      <div class="small">{{ est.tipo }} - {{ est.estado }}</div>
                      <div class="small">{{ est.fechaInicio }} - {{ est.fechaFin }}</div>
                      <div *ngIf="est.certificado" class="mt-1"><a href="#" class="link-primary">Sumar certificado</a></div>
                      <div class="mt-1"><a href="#" class="link-primary">Sumar referencia académica</a></div>
                    </div>
                  </div>
                </div>
                <div *ngSwitchCase="'experiencia'">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-bold">Experiencia laboral</span>
                    <button class="btn btn-link p-0" (click)="abrirModalExperiencia()"><span class="material-icons">edit</span></button>
                  </div>
                  <div>
                    <div class="fw-bold mb-2">Experiencia laboral</div>
                    <div *ngFor="let exp of usuario.experiencias" class="mb-3">
                      <div class="fw-semibold">{{ exp.empresa }}</div>
                      <div class="text-muted">{{ exp.puesto }}</div>
                      <div class="small">{{ exp.fechaInicio }} - {{ exp.fechaFin }}</div>
                      <div class="small">{{ exp.descripcion }}</div>
                    </div>
                  </div>
                </div>
                <div *ngSwitchCase="'perfil'">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-bold">Perfil profesional</span>
                    <button class="btn btn-link p-0" (click)="abrirModalPerfil()"><span class="material-icons">edit</span></button>
                  </div>
                  <div>
                    <div class="fw-bold mb-2">Resumen profesional</div>
                    <div class="mb-3">{{ usuario.descripcion }}</div>
                    <div class="fw-bold mb-2">Habilidades</div>
                    <div class="mb-3">{{ usuario.habilidades }}</div>
                  </div>
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
            <div class="card p-3 mt-3">
              <div class="fw-bold mb-2">Tipo de usuario</div>
              <div class="mb-1">
                {{ getNombreRol(usuario.rol) }}
              </div>
              <!-- Botón para ver postulaciones solo si el usuario es trabajador -->
              <div class="mt-2" *ngIf="usuario.rol === 'trabajador'">
                <button class="btn btn-primary w-100" (click)="irAPostulaciones()">Ver mis postulaciones</button>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </ng-container>
    <ng-container *ngIf="usuario && !usuario.nombre">
      <!-- Formulario de currículum para usuario nuevo -->
      <div class="container py-4">
        <div class="row justify-content-center">
          <div class="col-md-8">
            <div class="card p-4">
              <h4>Genera tu currículum</h4>
              <form (ngSubmit)="guardarCurriculum()" #cvForm="ngForm">
                <div class="mb-3">
                  <label>Nombre completo</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoCV.nombre" name="nombre" required>
                </div>
                <div class="mb-3">
                  <label>Email</label>
                  <input type="email" class="form-control" [(ngModel)]="nuevoCV.email" name="email" required>
                </div>
                <div class="mb-3">
                  <label>Teléfono</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoCV.telefono" name="telefono">
                </div>
                <div class="mb-3">
                  <label>Ciudad</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoCV.ciudad" name="ciudad">
                </div>
                <div class="mb-3">
                  <label>Profesión/Cargo</label>
                  <input type="text" class="form-control" [(ngModel)]="nuevoCV.cargo" name="cargo">
                </div>
                <div class="mb-3">
                  <label>Descripción profesional</label>
                  <textarea class="form-control" [(ngModel)]="nuevoCV.descripcion" name="descripcion" rows="3"></textarea>
                </div>
                <div class="mb-3">
                  <label>Experiencias profesionales</label>
                  <textarea class="form-control" [(ngModel)]="nuevoCV.experiencias" name="experiencias" rows="3" placeholder="Ejemplo: Informático en ACT, Mayo 2021 - Actualidad"></textarea>
                </div>
                <div class="mb-3">
                  <label>Estudios</label>
                  <textarea class="form-control" [(ngModel)]="nuevoCV.estudios" name="estudios" rows="2" placeholder="Ejemplo: Duoc UC, Marzo 2018 - Julio 2020"></textarea>
                </div>
                <div class="mb-3">
                  <label>Movilidad y licencias</label>
                  <textarea class="form-control" [(ngModel)]="nuevoCV.movilidad" name="movilidad" rows="2" placeholder="Ejemplo: Licencia B, D, No tengo vehículo propio"></textarea>
                </div>
                <div class="mb-3">
                  <label>Documentos adjuntos</label>
                  <input type="file" (change)="onDocumentoSelected($event)" multiple>
                </div>
                <div class="mb-3">
                  <label>Carta de presentación</label>
                  <textarea class="form-control" [(ngModel)]="nuevoCV.carta" name="carta" rows="2"></textarea>
                </div>
                <button type="submit" class="btn btn-success mt-3">Guardar currículum</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ng-container>

    <!-- Modal para editar datos personales -->
    <div *ngIf="showEditModal && editarUsuario" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar datos personales</h5>
            <button type="button" class="btn-close" (click)="cerrarModalEdicion()"></button>
          </div>
          <form (ngSubmit)="guardarDatosEditados()" #editForm="ngForm">
            <div class="modal-body">
              <div class="mb-2">
                <label>Nombre completo</label>
                <input type="text" class="form-control" [(ngModel)]="editarUsuario.nombre" name="nombre" required>
              </div>
              <div class="mb-2">
                <label>Nacionalidad</label>
                <input type="text" class="form-control" [(ngModel)]="editarUsuario.nacionalidad" name="nacionalidad">
              </div>
              <div class="mb-2">
                <label>Fecha de nacimiento</label>
                <input type="date" class="form-control" [(ngModel)]="editarUsuario.nacimiento" name="nacimiento">
              </div>
              <div class="mb-2">
                <label>Género</label>
                <input type="text" class="form-control" [(ngModel)]="editarUsuario.genero" name="genero">
              </div>
              <div class="mb-2">
                <label>Estado civil</label>
                <input type="text" class="form-control" [(ngModel)]="editarUsuario.estadoCivil" name="estadoCivil">
              </div>
              <div class="mb-2">
                <label>Licencia de conducir</label>
                <input type="text" class="form-control" [(ngModel)]="editarUsuario.licencia" name="licencia">
              </div>
              <div class="mb-2">
                <label>Rol</label>
                <select class="form-control" [(ngModel)]="editarUsuario.rol" name="rol" required>
                  <option value="trabajador">Trabajador</option>
                  <option value="empleador">Empleador</option>
                </select>
              </div>
              <div class="mb-2">
                <label>Celular</label>
                <input type="text" class="form-control" [(ngModel)]="editarUsuario.contacto.celular" name="celular">
              </div>
              <div class="mb-2">
                <label>Teléfono</label>
                <input type="text" class="form-control" [(ngModel)]="editarUsuario.contacto.telefono" name="telefono">
              </div>
              <div class="mb-2">
                <label>Email</label>
                <input type="email" class="form-control" [(ngModel)]="editarUsuario.contacto.email" name="email" required email>
              </div>
              <div class="mb-2">
                <label>Dirección</label>
                <input type="text" class="form-control" [(ngModel)]="editarUsuario.contacto.direccion" name="direccion">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cerrarModalEdicion()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="!editForm.form.valid">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal para editar Educación -->
    <div *ngIf="showEditEducacionModal && editarEducacion" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar educación</h5>
            <button type="button" class="btn-close" (click)="cerrarModalEducacion()"></button>
          </div>
          <form (ngSubmit)="guardarEducacionEditada()" #editEducacionForm="ngForm">
            <div class="modal-body">
              <div class="mb-2">
                <label>Institución</label>
                <input type="text" class="form-control" [(ngModel)]="editarEducacion.institucion" name="institucion" required>
              </div>
              <div class="mb-2">
                <label>Título/Curso</label>
                <input type="text" class="form-control" [(ngModel)]="editarEducacion.titulo" name="titulo" required>
              </div>
              <div class="mb-2">
                <label>Fecha inicio</label>
                <input type="date" class="form-control" [(ngModel)]="editarEducacion.fechaInicio" name="fechaInicio">
              </div>
              <div class="mb-2">
                <label>Fecha fin</label>
                <input type="date" class="form-control" [(ngModel)]="editarEducacion.fechaFin" name="fechaFin">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cerrarModalEducacion()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="!editEducacionForm.form.valid">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal para editar Experiencia -->
    <div *ngIf="showEditExperienciaModal && editarExperiencia" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar experiencia</h5>
            <button type="button" class="btn-close" (click)="cerrarModalExperiencia()"></button>
          </div>
          <form (ngSubmit)="guardarExperienciaEditada()" #editExperienciaForm="ngForm">
            <div class="modal-body">
              <div class="mb-2">
                <label>Empresa</label>
                <input type="text" class="form-control" [(ngModel)]="editarExperiencia.empresa" name="empresa" required>
              </div>
              <div class="mb-2">
                <label>Puesto</label>
                <input type="text" class="form-control" [(ngModel)]="editarExperiencia.puesto" name="puesto" required>
              </div>
              <div class="mb-2">
                <label>Fecha inicio</label>
                <input type="date" class="form-control" [(ngModel)]="editarExperiencia.fechaInicio" name="fechaInicio">
              </div>
              <div class="mb-2">
                <label>Fecha fin</label>
                <input type="date" class="form-control" [(ngModel)]="editarExperiencia.fechaFin" name="fechaFin">
              </div>
              <div class="mb-2">
                <label>Descripción</label>
                <textarea class="form-control" [(ngModel)]="editarExperiencia.descripcion" name="descripcion"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cerrarModalExperiencia()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="!editExperienciaForm.form.valid">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal para editar Perfil -->
    <div *ngIf="showEditPerfilModal && editarPerfil" class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,0.3);">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Editar perfil profesional</h5>
            <button type="button" class="btn-close" (click)="cerrarModalPerfil()"></button>
          </div>
          <form (ngSubmit)="guardarPerfilEditado()" #editPerfilForm="ngForm">
            <div class="modal-body">
              <div class="mb-2">
                <label>Resumen profesional</label>
                <textarea class="form-control" [(ngModel)]="editarPerfil.resumen" name="resumen" required></textarea>
              </div>
              <div class="mb-2">
                <label>Habilidades</label>
                <input type="text" class="form-control" [(ngModel)]="editarPerfil.habilidades" name="habilidades">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="cerrarModalPerfil()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="!editPerfilForm.form.valid">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  `
})


export class PerfilComponent implements OnInit {
      // Devuelve el nombre legible del rol
      getNombreRol(rol: string | number): string {
        if (!rol) return '';
        // Si viene como número
        if (typeof rol === 'number') {
          if (rol === 1) return 'Trabajador';
          if (rol === 2) return 'Empleador';
          if (rol === 3) return 'Administrador';
          if (rol === 4) return 'Notario';
          return String(rol);
        }
        // Si viene como string (case-insensitive)
        const r = rol.toLowerCase();
        if (r === 'trabajador') return 'Trabajador';
        if (r === 'empleador') return 'Empleador';
        if (r === 'admin' || r === 'administrador') return 'Administrador';
        if (r === 'notario') return 'Notario';
        return rol;
      }
    cerrarPerfilGuardadoModal() {
      this.showPerfilGuardadoModal = false;
    }
  constructor(private router: Router) {}
    showGuardadoModal = false;
    showPerfilGuardadoModal = false;

  abrirPerfil() {
    this.router.navigate(['/perfil']);
    // this.cargarPerfil();
  }

    mostrarModalGuardado() {
      this.showGuardadoModal = true;
      setTimeout(() => {
        this.showGuardadoModal = false;
      }, 2500);
    }

    mostrarPerfilGuardadoModal() {
      this.showPerfilGuardadoModal = true;
      setTimeout(() => {
        this.showPerfilGuardadoModal = false;
      }, 2000);
    }
  usuario: Usuario | null = null;
  nuevoUsuario: Usuario = {
    nombre: '',
    fotoUrl: '',
    nacionalidad: '',
    nacimiento: '',
    genero: '',
    estadoCivil: '',
    licencia: '',
    rol: '',
    contacto: {
      celular: '',
      telefono: '',
      email: '',
      direccion: ''
    },
    estudios: [],
    experiencias: [],
    descripcion: '',
    habilidades: '',
    cvAdjunto: ''
  };
  nuevoCV: any = {
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    cargo: '',
    descripcion: '',
    experiencias: '',
    estudios: '',
    movilidad: '',
    documentos: [],
    carta: ''
  };

  // 1. Agregar estado para mostrar el modal y datos editables
  showEditModal = false;
  editarUsuario: Usuario | null = null;
  // Si se inicializa editarUsuario, agregar rol vacío
  // editarUsuario: Usuario = {
  //   ...otrosCampos,
  //   rol: '',
  // };

  // Modal para editar Educación
  showEditEducacionModal = false;
  editarEducacion: any = null;

  // Modal para editar Experiencia
  showEditExperienciaModal = false;
  editarExperiencia: any = null;

  // Modal para editar Perfil
  showEditPerfilModal = false;
  editarPerfil: any = null;

  // Estado para la pestaña activa
  activeTab: 'educacion' | 'experiencia' | 'perfil' = 'educacion';

  // Navegación a la página de postulaciones
  irAPostulaciones() {
    // Si tienes lógica para cargar postulaciones aquí, haz la petición sin email y con el token
    // Si solo navegas, la lógica debe estar en el componente de mis-postulaciones
    this.router.navigate(['/mis-postulaciones']);
    // Ejemplo de cómo hacer la petición correctamente:
    // const token = localStorage.getItem('token');
    // fetch('http://localhost:8081/api/postulaciones', {
    //   method: 'GET',
    //   headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
    // })
    // .then(res => res.ok ? res.json() : null)
    // .then(data => {
    //   // Procesa el array de postulaciones aquí
    // });
  }

  private auth = inject(AuthService);
  private msal = inject(MsalService);
  private route = inject(ActivatedRoute);
  private perfilReload = inject(PerfilReloadService);

  ngOnInit() {
    const cargarPerfil = () => {
      const account = this.msal.instance.getActiveAccount() || this.msal.instance.getAllAccounts()[0];
      if (account && account.idTokenClaims) {
        console.log('Claims del token:', account.idTokenClaims);
        const email = String(
          account.idTokenClaims['email'] ||
          account.idTokenClaims['emails']?.[0] ||
          account.idTokenClaims['preferred_username'] ||
          account.username || ''
        );
        const token = localStorage.getItem('token');
        fetch(`http://localhost:8081/api/auth/perfil?email=${email}`, {
          method: 'GET',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
        })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.usuario) {
            const u = data.usuario;
            this.usuario = {
              userId: u.userId || '',
              nombre: typeof u.nombreCompleto === 'string' ? u.nombreCompleto : (typeof u.nombre === 'string' ? u.nombre : ''),
              fotoUrl: typeof u.fotoUrl === 'string' ? u.fotoUrl : '',
              nacionalidad: typeof u.nacionalidad === 'string' ? u.nacionalidad : '',
              nacimiento: typeof u.nacimiento === 'string' ? u.nacimiento : '',
              genero: typeof u.genero === 'string' ? u.genero : '',
              estadoCivil: typeof u.estadoCivil === 'string' ? u.estadoCivil : '',
              licencia: typeof u.licencia === 'string' ? u.licencia : '',
              rol: typeof u.rol === 'string' ? u.rol : '',
              contacto: {
                celular: typeof u.contacto?.celular === 'string' ? u.contacto.celular : '',
                telefono: typeof u.contacto?.telefono === 'string' ? u.contacto.telefono : '',
                email: typeof u.contacto?.email === 'string' ? u.contacto.email : email,
                direccion: typeof u.contacto?.direccion === 'string' ? u.contacto.direccion : ''
              },
              estudios: Array.isArray(u.estudios) ? u.estudios : [],
              experiencias: Array.isArray(u.experiencias) ? u.experiencias : [],
              descripcion: typeof u.resumenProfesional === 'string' ? u.resumenProfesional : (typeof u.descripcion === 'string' ? u.descripcion : ''),
              habilidades: typeof u.habilidades === 'string' ? u.habilidades : '',
              cvAdjunto: typeof u.cvAdjunto === 'string' ? u.cvAdjunto : ''
            };
            // Guardar usuario y rol en localStorage
            try {
              localStorage.setItem('usuario', JSON.stringify(this.usuario));
              if (this.usuario.rol) {
                localStorage.setItem('rol', this.usuario.rol);
              }
            } catch {}
          } else {
            const claims = account.idTokenClaims ?? {};
            this.usuario = {
              nombre: (typeof claims['given_name'] === 'string' && claims['given_name']) || (typeof claims['displayName'] === 'string' && claims['displayName']) || '',
              fotoUrl: '',
              nacionalidad: (typeof claims['country'] === 'string' && claims['country']) || (typeof claims['country_region'] === 'string' && claims['country_region']) || '',
              nacimiento: String(claims['birthdate']) || '',
              genero: String(claims['gender']) || '',
              estadoCivil: String(claims['maritalStatus']) || '',
              licencia: '',
              rol: '',
              contacto: {
                celular: String(claims['phone_number']) || '',
                telefono: String(claims['telephone']) || '',
                email: email,
                direccion: (typeof claims['city'] === 'string' && claims['city']) || (typeof claims['address'] === 'string' && claims['address']) || ''
              },
              estudios: [],
              experiencias: [],
              descripcion: '',
              habilidades: '',
              cvAdjunto: ''
            };
            const usuarioSync = {
              userId: '',
              email: this.usuario?.contacto?.email || '',
              nombreCompleto: this.usuario?.nombre || '',
              rol: this.usuario?.rol || 'trabajador',
              fechaCreacion: new Date(),
              fotoUrl: this.usuario?.fotoUrl || '',
              nacionalidad: this.usuario?.nacionalidad || '',
              nacimiento: this.usuario?.nacimiento || '',
              genero: this.usuario?.genero || '',
              estadoCivil: this.usuario?.estadoCivil || '',
              licencia: this.usuario?.licencia || '',
              contacto: {
                email: this.usuario?.contacto?.email || '',
                celular: this.usuario?.contacto?.celular || '',
                telefono: this.usuario?.contacto?.telefono || '',
                direccion: this.usuario?.contacto?.direccion || ''
              },
              estudios: [],
              experiencias: [],
              descripcion: this.usuario?.descripcion || '',
              habilidades: this.usuario?.habilidades || '',
              cvAdjunto: this.usuario?.cvAdjunto || ''
            };
            console.log('Enviando usuario al backend:', usuarioSync);
            this.auth.syncFullUserWithBackend(usuarioSync).then(obs => {
              obs.subscribe({
                next: res => {
                  console.log('Respuesta del backend al sincronizar usuario:', res);
                },
                error: err => {
                  console.error('Error al sincronizar usuario con backend:', err);
                  if (err.error && err.error.error) {
                    console.error('Mensaje específico del backend:', err.error.error);
                  }
                }
              });
            });
          }
        });
      }
    };

    this.route.queryParams.subscribe(() => {
      cargarPerfil();
    });
    this.perfilReload.reload$.subscribe(() => {
      cargarPerfil();
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects === '/perfil') {
        cargarPerfil();
      }
    });
    cargarPerfil();
  }

  onFotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.usuario = {
          ...this.usuario!,
          fotoUrl: e.target.result
        };
        // Aquí podrías hacer una petición al backend para guardar la imagen
      };
      reader.readAsDataURL(file);
    }
  }

  onDocumentoSelected(event: any) {
    this.nuevoCV.documentos = Array.from(event.target.files);
  }

  guardarCurriculum() {
    const formData = new FormData();
    Object.keys(this.nuevoCV).forEach(key => {
      if (key === 'documentos') {
        this.nuevoCV.documentos.forEach((file: File, i: number) => {
          formData.append('documentos', file, file.name);
        });
      } else {
        formData.append(key, this.nuevoCV[key]);
      }
    });
    const token = localStorage.getItem('token');
    fetch('http://localhost:8081/api/curriculum', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      body: formData
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.curriculum) {
        // Actualizar usuario con los datos del currículum
        this.usuario = { ...this.usuario, ...data.curriculum };
      }
    });
  }

  // 2. Método para abrir el modal con los datos actuales
  abrirModalEdicion() {
    this.editarUsuario = { ...this.usuario! };
    this.showEditModal = true;
  }

  // 3. Método para cerrar el modal
  cerrarModalEdicion() {
    this.showEditModal = false;
  }

  // 4. Método para guardar los datos editados
  guardarDatosEditados() {
    const token = localStorage.getItem('token');
    const email = this.editarUsuario?.contacto?.email || '';
    const usuarioSync = {
      userId: '',
      email: this.editarUsuario?.contacto?.email || '',
      nombreCompleto: this.editarUsuario?.nombre || '',
      rol: 'trabajador',
      fechaCreacion: new Date(),
      fotoUrl: this.editarUsuario?.fotoUrl || '',
      nacionalidad: this.editarUsuario?.nacionalidad || '',
      nacimiento: this.editarUsuario?.nacimiento || '',
      genero: this.editarUsuario?.genero || '',
      estadoCivil: this.editarUsuario?.estadoCivil || '',
      licencia: this.editarUsuario?.licencia || '',
      contacto: {
        email: this.editarUsuario?.contacto?.email || '',
        celular: this.editarUsuario?.contacto?.celular || '',
        telefono: this.editarUsuario?.contacto?.telefono || '',
        direccion: this.editarUsuario?.contacto?.direccion || ''
      },
      estudios: this.editarUsuario?.estudios || [],
      experiencias: this.editarUsuario?.experiencias || [],
      descripcion: this.editarUsuario?.descripcion || '',
      habilidades: this.editarUsuario?.habilidades || '',
      cvAdjunto: this.editarUsuario?.cvAdjunto || ''
    };
    fetch(`http://localhost:8081/api/auth/perfil?email=${email}`, {
      method: 'PUT',
      headers: token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarioSync)
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      this.showEditModal = false;
      setTimeout(() => {
        this.mostrarPerfilGuardadoModal();
      }, 100); // Espera breve para asegurar cierre del modal de edición
      if (data && (data.perfil || data.usuario)) {
        // Conversión de rol_id a nombre de rol
        let rolBD = '';
        const rolId = data.perfil?.rol_id || data.usuario?.rol_id;
        if (rolId === 1) rolBD = 'trabajador';
        else if (rolId === 2) rolBD = 'empleador';
        else if (rolId === 3) rolBD = 'admin';
        else if (rolId === 4) rolBD = 'notario';
        else rolBD = (data.perfil?.rol || data.usuario?.rol || this.usuario?.rol || '');

        this.usuario = {
          ...this.usuario,
          ...(data.perfil || data.usuario),
          rol: rolBD,
          nombre: typeof (data.perfil?.nombre || data.usuario?.nombre || this.usuario?.nombre) === 'string' ? (data.perfil?.nombre || data.usuario?.nombre || this.usuario?.nombre) : '',
          nacionalidad: typeof (data.perfil?.nacionalidad || data.usuario?.nacionalidad || this.usuario?.nacionalidad) === 'string' ? (data.perfil?.nacionalidad || data.usuario?.nacionalidad || this.usuario?.nacionalidad) : '',
          nacimiento: typeof (data.perfil?.nacimiento || data.usuario?.nacimiento || this.usuario?.nacimiento) === 'string' ? (data.perfil?.nacimiento || data.usuario?.nacimiento || this.usuario?.nacimiento) : '',
          genero: typeof (data.perfil?.genero || data.usuario?.genero || this.usuario?.genero) === 'string' ? (data.perfil?.genero || data.usuario?.genero || this.usuario?.genero) : '',
          estadoCivil: typeof (data.perfil?.estadoCivil || data.usuario?.estadoCivil || this.usuario?.estadoCivil) === 'string' ? (data.perfil?.estadoCivil || data.usuario?.estadoCivil || this.usuario?.estadoCivil) : '',
          licencia: typeof (data.perfil?.licencia || data.usuario?.licencia || this.usuario?.licencia) === 'string' ? (data.perfil?.licencia || data.usuario?.licencia || this.usuario?.licencia) : '',
          fotoUrl: typeof (data.perfil?.fotoUrl || data.usuario?.fotoUrl || this.usuario?.fotoUrl) === 'string' ? (data.perfil?.fotoUrl || data.usuario?.fotoUrl || this.usuario?.fotoUrl) : '',
          descripcion: typeof (data.perfil?.descripcion || data.usuario?.descripcion || this.usuario?.descripcion) === 'string' ? (data.perfil?.descripcion || data.usuario?.descripcion || this.usuario?.descripcion) : '',
          habilidades: typeof (data.perfil?.habilidades || data.usuario?.habilidades || this.usuario?.habilidades) === 'string' ? (data.perfil?.habilidades || data.usuario?.habilidades || this.usuario?.habilidades) : '',
          cvAdjunto: typeof (data.perfil?.cvAdjunto || data.usuario?.cvAdjunto || this.usuario?.cvAdjunto) === 'string' ? (data.perfil?.cvAdjunto || data.usuario?.cvAdjunto || this.usuario?.cvAdjunto) : '',
          contacto: {
            celular: typeof (data.perfil?.contacto?.celular || data.usuario?.contacto?.celular || this.usuario?.contacto?.celular) === 'string' ? (data.perfil?.contacto?.celular || data.usuario?.contacto?.celular || this.usuario?.contacto?.celular) : '',
            telefono: typeof (data.perfil?.contacto?.telefono || data.usuario?.contacto?.telefono || this.usuario?.contacto?.telefono) === 'string' ? (data.perfil?.contacto?.telefono || data.usuario?.contacto?.telefono || this.usuario?.contacto?.telefono) : '',
            email: typeof (data.perfil?.contacto?.email || data.usuario?.contacto?.email || this.usuario?.contacto?.email) === 'string' ? (data.perfil?.contacto?.email || data.usuario?.contacto?.email || this.usuario?.contacto?.email) : '',
            direccion: typeof (data.perfil?.contacto?.direccion || data.usuario?.contacto?.direccion || this.usuario?.contacto?.direccion) === 'string' ? (data.perfil?.contacto?.direccion || data.usuario?.contacto?.direccion || this.usuario?.contacto?.direccion) : ''
          },
          estudios: Array.isArray(data.perfil?.estudios) ? data.perfil.estudios : (Array.isArray(data.usuario?.estudios) ? data.usuario.estudios : (this.usuario?.estudios || [])),
          experiencias: Array.isArray(data.perfil?.experiencias) ? data.perfil.experiencias : (Array.isArray(data.usuario?.experiencias) ? data.usuario.experiencias : (this.usuario?.experiencias || [])),
          userId: typeof (data.perfil?.userId || data.usuario?.userId || this.usuario?.userId) === 'string' ? (data.perfil?.userId || data.usuario?.userId || this.usuario?.userId) : ''
        };
        this.editarUsuario = {
          ...this.usuario,
          nombre: typeof this.usuario?.nombre === 'string' ? this.usuario.nombre : '',
          nacionalidad: typeof this.usuario?.nacionalidad === 'string' ? this.usuario.nacionalidad : '',
          nacimiento: typeof this.usuario?.nacimiento === 'string' ? this.usuario.nacimiento : '',
          genero: typeof this.usuario?.genero === 'string' ? this.usuario.genero : '',
          estadoCivil: typeof this.usuario?.estadoCivil === 'string' ? this.usuario.estadoCivil : '',
          licencia: typeof this.usuario?.licencia === 'string' ? this.usuario.licencia : '',
          rol: typeof this.usuario?.rol === 'string' ? this.usuario.rol : '',
          fotoUrl: typeof this.usuario?.fotoUrl === 'string' ? this.usuario.fotoUrl : '',
          descripcion: typeof this.usuario?.descripcion === 'string' ? this.usuario.descripcion : '',
          habilidades: typeof this.usuario?.habilidades === 'string' ? this.usuario.habilidades : '',
          cvAdjunto: typeof this.usuario?.cvAdjunto === 'string' ? this.usuario.cvAdjunto : '',
          contacto: {
            celular: typeof this.usuario?.contacto?.celular === 'string' ? this.usuario.contacto.celular : '',
            telefono: typeof this.usuario?.contacto?.telefono === 'string' ? this.usuario.contacto.telefono : '',
            email: typeof this.usuario?.contacto?.email === 'string' ? this.usuario.contacto.email : '',
            direccion: typeof this.usuario?.contacto?.direccion === 'string' ? this.usuario.contacto.direccion : ''
          },
          estudios: Array.isArray(this.usuario?.estudios) ? this.usuario.estudios : [],
          experiencias: Array.isArray(this.usuario?.experiencias) ? this.usuario.experiencias : [],
          userId: typeof this.usuario?.userId === 'string' ? this.usuario.userId : ''
        };
      }
    });
  }

  // Método para abrir el modal de edición de educación
  abrirModalEdicionEducacion(educacion: any) {
    this.editarEducacion = { ...educacion };
    this.showEditEducacionModal = true;
  }

  // Método para cerrar el modal de edición de educación
  cerrarModalEducacion() {
    this.showEditEducacionModal = false;
  }

  // Método para guardar los cambios en la educación editada
  guardarEducacionEditada() {
    const token = localStorage.getItem('token');
    // Asegura que userId esté presente en el objeto de educación
    if (this.usuario && this.usuario.userId) {
      this.editarEducacion.userId = this.usuario.userId;
    }
    fetch('http://localhost:8081/api/auth/educacion', {
      method: 'PUT',
      headers: token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.editarEducacion)
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.educacion) {
        // Actualizar la lista de estudios del usuario
        if (!this.usuario) {
          this.usuario = { nombre: '', nacionalidad: '', nacimiento: '', genero: '', estadoCivil: '', licencia: '', rol: '', contacto: { celular: '', telefono: '', email: '', direccion: '' }, estudios: [], experiencias: [], descripcion: '', habilidades: '', cvAdjunto: '' };
        }
        if (!this.usuario.estudios) {
          this.usuario.estudios = [];
        }
        const index = this.usuario.estudios!.findIndex(est => est.titulo === data.educacion.titulo);
        if (index >= 0) {
          this.usuario.estudios![index] = data.educacion;
        } else {
          this.usuario.estudios!.push(data.educacion);
        }
        this.showEditEducacionModal = false;
      }
    });
  }

  // Método para abrir el modal de edición de experiencia
  abrirModalEdicionExperiencia(experiencia: any) {
    this.editarExperiencia = { ...experiencia };
    this.showEditExperienciaModal = true;
  }

  // Método para cerrar el modal de edición de experiencia
  cerrarModalExperiencia() {
    this.showEditExperienciaModal = false;
  }

  // Método para guardar los cambios en la experiencia editada
  guardarExperienciaEditada() {
    const token = localStorage.getItem('token');
    let experienciaPayload = this.editarExperiencia;
    // Asegura que userId esté presente
    const userId = this.usuario?.userId || '';
    if (Array.isArray(experienciaPayload)) {
      experienciaPayload = experienciaPayload.map(exp => ({ ...exp, userId }));
    } else {
      experienciaPayload = { ...experienciaPayload, userId };
    }
    console.log('Payload enviado:', experienciaPayload); // Verifica que userId esté presente
    fetch('http://localhost:8081/api/auth/experiencia', {
      method: 'PUT',
      headers: token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' },
      body: JSON.stringify(experienciaPayload)
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.experiencia) {
        if (!this.usuario) {
          this.usuario = { nombre: '', nacionalidad: '', nacimiento: '', genero: '', estadoCivil: '', licencia: '', rol: '', contacto: { celular: '', telefono: '', email: '', direccion: '' }, estudios: [], experiencias: [], descripcion: '', habilidades: '', cvAdjunto: '' };
        }
        if (!this.usuario.experiencias) {
          this.usuario.experiencias = [];
        }
        const index = this.usuario.experiencias!.findIndex(exp => exp.empresa === data.experiencia.empresa);
        if (index >= 0) {
          this.usuario.experiencias![index] = data.experiencia;
        } else {
          this.usuario.experiencias!.push(data.experiencia);
        }
        this.showEditExperienciaModal = false;
      }
    });
  }

  // Método para abrir el modal de edición de perfil profesional
  abrirModalEdicionPerfil() {
    this.editarPerfil = {
      resumen: this.usuario?.descripcion || '',
      habilidades: this.usuario?.habilidades || ''
    };
    this.showEditPerfilModal = true;
  }

  // Método para cerrar el modal de edición de perfil profesional
  cerrarModalPerfil() {
    this.showEditPerfilModal = false;
  }

  // Método para guardar los cambios en el perfil profesional editado
  guardarPerfilEditado() {
    const token = localStorage.getItem('token');
    const email = this.usuario?.contacto?.email || '';
    // Asegura que el campo resumenProfesional esté presente en el body
    const perfilPayload = {
      ...this.editarPerfil,
      resumenProfesional: this.editarPerfil.resumen
    };
    fetch(`http://localhost:8081/api/auth/perfil?email=${email}`, {
      method: 'PUT',
      headers: token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' },
      body: JSON.stringify(perfilPayload)
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.perfil) {
        // Solo actualiza los campos editados
        this.usuario = {
          ...this.usuario,
          nombre: this.usuario?.nombre || '',
          nacionalidad: this.usuario?.nacionalidad || '',
          nacimiento: this.usuario?.nacimiento || '',
          genero: this.usuario?.genero || '',
          estadoCivil: this.usuario?.estadoCivil || '',
          licencia: this.usuario?.licencia || '',
          rol: typeof this.usuario?.rol === 'string' ? this.usuario.rol : '',
          contacto: this.usuario?.contacto || { celular: '', telefono: '', email: '', direccion: '' },
          estudios: this.usuario?.estudios || [],
          experiencias: this.usuario?.experiencias || [],
          descripcion: data.perfil.descripcion,
          habilidades: data.perfil.habilidades,
          fotoUrl: this.usuario?.fotoUrl || '',
          cvAdjunto: this.usuario?.cvAdjunto || '',
          userId: this.usuario?.userId || ''
        };
        this.showEditPerfilModal = false;
      }
    });
  }

  abrirModalEducacion() {
    this.editarEducacion = this.usuario?.estudios && this.usuario.estudios.length > 0 ? { ...this.usuario.estudios[0] } : {};
    this.showEditEducacionModal = true;
  }

  abrirModalExperiencia() {
    this.editarExperiencia = this.usuario?.experiencias && this.usuario.experiencias.length > 0 ? { ...this.usuario.experiencias[0] } : {};
    this.showEditExperienciaModal = true;
  }

  abrirModalPerfil() {
    this.editarPerfil = {
      resumen: this.usuario?.descripcion || '',
      habilidades: this.usuario?.habilidades || ''
    };
    this.showEditPerfilModal = true;
  }
}
