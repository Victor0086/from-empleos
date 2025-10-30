import { Injectable, signal } from '@angular/core';

export type UserRole = 'trabajador' | 'empleador' | 'admin' | 'notario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals en Angular 16+: se acceden como funciones (auth.isLogged())
  isLogged = signal<boolean>(false);
  role     = signal<UserRole | null>(null);

  constructor() {
    this.restore();
  }

  //  Simulación de login: asigna rol según correo
  loginMock(email: string, _pwd: string): UserRole {
    let rol: UserRole = 'trabajador';
    if (email.includes('empresa')) {
      rol = 'empleador';
    } else if (email.includes('admin')) {
      rol = 'admin';
    }

    this.isLogged.set(true);
    this.role.set(rol);
    localStorage.setItem('auth', JSON.stringify({ role: rol }));
    return rol;
  }

  logout(): void {
    this.isLogged.set(false);
    this.role.set(null);
    localStorage.removeItem('auth');
  }

  restore(): void {
    const saved = localStorage.getItem('auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { role: UserRole };
        this.isLogged.set(true);
        this.role.set(parsed.role);
      } catch {
        localStorage.removeItem('auth');
      }
    }
  }
}
