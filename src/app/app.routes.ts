import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { OfertasListComponent } from './pages/ofertas/ofertas-list/ofertas-list.component';
import { OfertaFormComponent } from './pages/ofertas/oferta-form/oferta-form.component';
import { DocumentosUploadComponent } from './pages/documentos/documentos-upload/documentos-upload.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { MsalGuard } from '@azure/msal-angular';        // MsalGuard
import { RoleGuard } from './core/guards/role.guard';    // RoleGuard
import { MisPostulacionesComponent } from './pages/ofertas/mis-postulaciones.component';
import { MisContratosComponent } from './pages/contratos/mis-contratos/mis-contratos.component';

export const routes: Routes = [
  { path: 'perfil', loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent) },
  { path: '', component: HomeComponent },           // pública

  // Ruta dummy para recarga de perfil
  { path: 'dummy', component: HomeComponent },

  { path: 'mis-contratos', loadComponent: () => import('./pages/contratos/mis-contratos/mis-contratos.component').then(m => m.MisContratosComponent), canActivate: [MsalGuard] },

  // Notario
  { path: 'notario/panel', loadComponent: () => import('./pages/notario/notario-panel.component').then(m => m.NotarioPanelComponent), canActivate: [MsalGuard, RoleGuard], data: { roles: ['notario', 'admin'] } },

  // Empresa (debe ir ANTES de las rutas más generales)
  { path: 'ofertas/nueva', component: OfertaFormComponent, canActivate: [MsalGuard, RoleGuard], data: { roles: ['empleador', 'admin'] } },


  // Empresa (debe ir ANTES de las rutas más generales)
  { path: 'ofertas/nueva', component: OfertaFormComponent, canActivate: [MsalGuard, RoleGuard], data: { roles: ['empleador','admin'] } },

  // Trabajador
  { path: 'ofertas', component: OfertasListComponent },
  { path: 'ofertas/:id', loadComponent: () => import('./pages/ofertas/oferta-detail.component').then(m => m.OfertaDetailComponent) },
  { path: 'postulacion', loadComponent: () => import('./pages/postulacion/postulacion.component').then(m => m.PostulacionComponent), canActivate: [MsalGuard] },
  { path: 'mis-postulaciones', loadComponent: () => import('./pages/ofertas/mis-postulaciones.component').then(m => m.MisPostulacionesComponent), canActivate: [MsalGuard] },
  { path: 'documentos', component: DocumentosUploadComponent, canActivate: [MsalGuard, RoleGuard], data: { roles: ['trabajador','admin'] } },

  { path: '**', redirectTo: '' }
];
