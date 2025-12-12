import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
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
    // Sincronizar usuario completo con backend
    async syncFullUserWithBackend(usuario: any): Promise<Observable<any>> {
      const result = await this.msal.instance.acquireTokenSilent({
        scopes: environment.apiConfig.scopes
      });
      const token = result.accessToken;
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.post<any>(`${this.apiUrl}/auth/sync`, usuario, { headers });
    }
  // Signals en Angular 16+: se acceden como funciones (auth.isLogged())
  isLogged = signal<boolean>(false);
  role     = signal<UserRole | null>(null);
  
  private apiUrl = environment.apiConfig.url;

  constructor(private http: HttpClient, private msal: MsalService) {
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
  async syncUserWithBackend(userData: SyncUserRequest): Promise<Observable<AuthResponse>> {
    const result = await this.msal.instance.acquireTokenSilent({
      scopes: environment.apiConfig.scopes
    });
    const token = result.accessToken;
    console.log('MSAL JWT:', token); // Mostrar el JWT en consola
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/sync`, userData, { headers });
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
    // Primero verificar si hay datos guardados del backend
    const saved = localStorage.getItem('auth');
    const token = localStorage.getItem('token');

    if (saved && token) {
      try {
        const parsed = JSON.parse(saved) as { role: UserRole, user?: any };
        this.isLogged.set(true);
        this.role.set(parsed.role);
        return; 
      } catch {
        // Si hay error en los datos guardados, limpiar
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
      }
    }

    // Si no hay datos del backend, verificar MSAL
    const msalAccounts = this.msal.instance.getAllAccounts();
    
    if (msalAccounts.length > 0) {
      // Establecer cuenta activa
      this.msal.instance.setActiveAccount(msalAccounts[0]);
      this.isLogged.set(true);
      
      // Intentar obtener el rol de los datos guardados del usuario
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        try {
          const user = JSON.parse(userProfile);
          this.role.set(user.tipoUsuario || 'trabajador');
        } catch {
          this.role.set('trabajador');
        }
      } else {
        // Rol por defecto para usuarios MSAL sin perfil del backend
        this.role.set('trabajador');
      }
      
      // Intentar obtener token silenciosamente
      this.msal.instance.acquireTokenSilent({
        scopes: environment.apiConfig.scopes,
        account: msalAccounts[0]
      }).then(result => {
        localStorage.setItem('token', result.accessToken);
      }).catch(error => {
        console.log('No se pudo obtener token silenciosamente:', error);
      });
    } else {
      // No hay sesión, limpiar todo
      this.isLogged.set(false);
      this.role.set(null);
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
      localStorage.removeItem('userProfile');
    }
  }
}