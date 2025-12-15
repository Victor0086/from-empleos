import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MsalService } from '@azure/msal-angular';

export interface Contrato {
  id: number;
  postulacion: any;
  idNotario: string;
  estado: string;
  firmaTrabajador: string | null;
  firmaEmpleador: string | null;
  firmaNotario: string | null;
  fechaCreacion: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContratoService {
  private apiUrl = `${environment.apiConfig.url}/contratos`;

  public getApiUrl(): string {
    return this.apiUrl;
  }

  constructor(private http: HttpClient, private authService: MsalService) { }

  private getAuthHeaders(): Observable<HttpHeaders> {
    const account = this.authService.instance.getActiveAccount();
    if (!account) {
        throw new Error("No hay usuario logueado");
    }

    // Pedimos el token silenciosamente
    const request = {
        scopes: environment.apiConfig.scopes,
        account: account
    };

    return from(this.authService.instance.acquireTokenSilent(request)).pipe(
        switchMap(response => {
            const headers = new HttpHeaders().set('Authorization', `Bearer ${response.accessToken}`);
            return from([headers]);
        })
    );
  }

  obtenerMisContratos(): Observable<Contrato[]> {
    // Usar el endpoint unificado que ahora devuelve contratos tanto como trabajador como empleador
    return this.getAuthHeaders().pipe(
        switchMap(headers => {
            console.log('=== DEBUG CONTRATOS ===');
            console.log('Obteniendo todos mis contratos (trabajador y empleador)');
            console.log('Headers enviados:', headers);
            
            // Debug del token JWT
            const authHeader = headers.get('Authorization');
            if (authHeader) {
              const token = authHeader.replace('Bearer ', '');
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                console.log('Usuario del JWT:', {
                  sub: payload.sub,
                  email: payload.email || payload.emails?.[0] || 'No email',
                  name: payload.name || 'No name'
                });
              } catch (e) {
                console.error('Error parseando JWT:', e);
              }
            }
            
            return this.http.get<Contrato[]>(`${this.apiUrl}/mis-contratos`, { headers }).pipe(
              map(contratos => {
                console.log('Contratos recibidos del backend unificado:', contratos);
                console.log('Número de contratos:', contratos ? contratos.length : 0);
                
                // Log detallado de cada contrato para debug
                if (contratos && contratos.length > 0) {
                  contratos.forEach((contrato, index) => {
                    console.log(`Contrato ${index + 1}:`, {
                      id: contrato.id,
                      estado: contrato.estado,
                      trabajadorId: contrato.postulacion?.trabajadorId,
                      ofertaId: contrato.postulacion?.idOferta,
                      firmaTrabajador: contrato.firmaTrabajador,
                      firmaEmpleador: contrato.firmaEmpleador,
                      fechaCreacion: contrato.fechaCreacion
                    });
                  });
                } else {
                  console.log('No se recibieron contratos del backend');
                  console.log('Esto podría indicar:');
                  console.log('1. El usuario no tiene contratos en la BD');
                  console.log('2. El backend no está encontrando al usuario correctamente');
                  console.log('3. Hay un problema en la consulta del backend');
                }
                
                console.log('=== FIN DEBUG CONTRATOS ===');
                return Array.isArray(contratos) ? contratos : [];
              }),
              catchError(error => {
                console.error('Error obteniendo contratos:', error);
                console.error('Status:', error.status);
                console.error('Message:', error.message);
                console.error('Error body:', error.error);
                return of([]);
              })
            );
        })
    );
  }

  firmarContrato(idContrato: number): Observable<any> {
    return this.getAuthHeaders().pipe(
        switchMap(headers => {
            //return this.http.post<Contrato>(`${this.apiUrl}/${idContrato}/firmar`, {}, { headers });
            return this.http.post<any>(`${this.apiUrl}/${idContrato}/firmar`, {}, { headers });
        })
    );
  }

  rechazarContrato(idContrato: number): Observable<any> {
    return this.getAuthHeaders().pipe(
        switchMap(headers => {
            return this.http.post<any>(`${this.apiUrl}/${idContrato}/rechazar`, 
              { motivo: 'El trabajador rechazó el contrato.' }, 
              { headers });
        })
    );
  }


//   obtenerMisContratos(): Observable<Contrato[]> {
//     return this.http.get<Contrato[]>(`${this.apiUrl}/mis-contratos`);
//   }

//   firmarContrato(idContrato: number): Observable<Contrato> {
//     return this.http.post<Contrato>(`${this.apiUrl}/${idContrato}/firmar`, {});
//   }
}