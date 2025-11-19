import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MsalService } from '@azure/msal-angular';

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

// ...

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container py-4">
    <ng-container *ngIf="usuario; else formNuevoUsuario">
      <!-- Perfil existente -->
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
    </ng-container>
    <ng-template #formNuevoUsuario>
      <!-- Formulario para usuario nuevo -->
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card p-4">
            <h4>Completa tu perfil</h4>
            <form (ngSubmit)="guardarPerfil()" #perfilForm="ngForm">
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
    </ng-template>
  </div>
  `
})
export class PerfilComponent implements OnInit {
  usuario: Usuario | null = null;
  nuevoUsuario: Usuario = {
    nombre: '',
    fotoUrl: '',
    nacionalidad: '',
    nacimiento: '',
    genero: '',
    estadoCivil: '',
    licencia: '',
    contacto: {
      celular: '',
      telefono: '',
      email: '',
      direccion: ''
    },
    estudios: [],
    cvAdjunto: ''
  };

  private auth = inject(AuthService);
  private msal = inject(MsalService);

  ngOnInit() {
    // Obtener email del usuario logueado desde MSAL
    const account = this.msal.instance.getActiveAccount() || this.msal.instance.getAllAccounts()[0];
    const email = account?.username;
    if (email) {
      // Consultar el backend por el perfil
      fetch(`/api/auth/user?email=${email}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.usuario) {
            this.usuario = data.usuario;
          } else {
            // Usuario no existe, mostrar formulario
            this.nuevoUsuario.contacto.email = email;
          }
        });
    }
  }

  async guardarPerfil() {
    // Obtener el token de acceso de Azure AD B2C
    const result = await this.msal.instance.acquireTokenSilent({
      scopes: ['openid', 'profile', 'email']
    });
    const token = result.accessToken;
    // Guardar el perfil en el backend
    fetch('http://localhost:8081/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(this.nuevoUsuario)
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.usuario) {
          this.usuario = data.usuario;
        }
      });
  }
}
