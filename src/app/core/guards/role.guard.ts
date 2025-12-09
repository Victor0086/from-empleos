import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

export const RoleGuard = (route: ActivatedRouteSnapshot) => {
  const msal = inject(MsalService);
  const router = inject(Router);

  // cuenta activa
  const account = msal.instance.getActiveAccount() ?? msal.instance.getAllAccounts()[0];
  if (!account) { router.navigateByUrl('/login'); return false; }

  const claims: any = account.idTokenClaims || {};

  // intenta leer desde distintos claims según tu tenant
  const rolesFromAad: string[] = claims['roles'] || [];                  // AAD (app roles)
  const roleFromB2C = claims['extension_Role'] || claims['role'] || '';
  // Normaliza todos los roles a minúsculas
  const normalizeRol = (rol: any): string => {
    if (!rol) return '';
    if (typeof rol === 'number') {
      if (rol === 1) return 'trabajador';
      if (rol === 2) return 'empleador';
      if (rol === 3) return 'admin';
      if (rol === 4) return 'notario';
      return String(rol);
    }
    const r = String(rol).toLowerCase();
    if (r === 'administrador') return 'admin';
    return r;
  };
  let userRoles = new Set<string>([...rolesFromAad, roleFromB2C].filter(Boolean).map(normalizeRol));

  // Como respaldo temporal, si no hay roles en el token, lee de localStorage
  let rolLocal = '';
  if (userRoles.size === 0) {
    try {
      const usuarioStr = localStorage.getItem('usuario');
      if (usuarioStr) {
        const usuarioObj = JSON.parse(usuarioStr);
        if (usuarioObj && usuarioObj.rol) {
          rolLocal = usuarioObj.rol;
        }
      }
      if (!rolLocal) {
        rolLocal = localStorage.getItem('rol') || '';
      }
    } catch {}
    if (rolLocal) {
      userRoles = new Set<string>([normalizeRol(rolLocal)]);
    }
  }

  const allowed: string[] = (route.data['roles'] ?? []).map(normalizeRol);

  // ¿tiene alguno de los permitidos?
  const ok = allowed.some(r => userRoles.has(r));
  
  if (!ok) { router.navigateByUrl('/'); }
  return ok;
};