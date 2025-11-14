import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole = 'trabajador' | 'empleador' | 'admin' | 'notario';

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  tipoUsuario: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    tipoUsuario: UserRole;
  };
  message?: string;
}

export interface SyncUserRequest {
  email: string;
  nombre: string;
  provider: string;
  azureId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals en Angular 16+: se acceden como funciones (auth.isLogged())
  isLogged = signal<boolean>(false);
  role     = signal<UserRole | null>(null);
  
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    this.restore();
  }

  // Registro de usuario
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData);
  }

  // Login de usuario
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.token) {
            // Guardar token y usuario
            localStorage.setItem('token', response.token);
            localStorage.setItem('auth', JSON.stringify({ 
              role: response.user.tipoUsuario,
              user: response.user 
            }));
            
            // Actualizar signals
            this.isLogged.set(true);
            this.role.set(response.user.tipoUsuario);
          }
        })
      );
  }

  // Sincronizar usuario MSAL con backend
  syncUserWithBackend(userData: SyncUserRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/sync`, userData);
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
    localStorage.removeItem('token');
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
