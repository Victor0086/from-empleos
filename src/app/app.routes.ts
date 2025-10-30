import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/auth/login/login.component';
import { OfertasListComponent } from './pages/ofertas/ofertas-list/ofertas-list.component';
import { OfertaFormComponent } from './pages/ofertas/oferta-form/oferta-form.component';
import { DocumentosUploadComponent } from './pages/documentos/documentos-upload/documentos-upload.component';
import { MsalGuard } from '@azure/msal-angular';        // ⬅️ usa MsalGuard
import { RoleGuard } from './core/guards/role.guard';    // ⬅️ mantén tu RoleGuard

export const routes: Routes = [
  { path: '', component: HomeComponent },           // pública
  { path: 'login', component: LoginComponent },

  // Trabajador
  { path: 'ofertas', component: OfertasListComponent, canActivate: [MsalGuard, RoleGuard], data: { roles: ['trabajador','admin'] } },
  { path: 'documentos', component: DocumentosUploadComponent, canActivate: [MsalGuard, RoleGuard], data: { roles: ['trabajador','admin'] } },

  // Empresa
  { path: 'ofertas/nueva', component: OfertaFormComponent, canActivate: [MsalGuard, RoleGuard], data: { roles: ['empleador','admin'] } },

  { path: '**', redirectTo: '' }
];
