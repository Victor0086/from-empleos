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
  const roleFromB2C = claims['extension_Role'] || claims['role'] || '';  // B2C atributo custom (ajusta el nombre)
  const userRoles = new Set<string>([...rolesFromAad, roleFromB2C].filter(Boolean));

  const allowed: string[] = route.data['roles'] ?? [];

  // ¿tiene alguno de los permitidos?
  const ok = allowed.some(r => userRoles.has(r));
  if (!ok) { router.navigateByUrl('/'); } // o /forbidden
  return ok;
};