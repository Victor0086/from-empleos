import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
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
    // Primero obtenemos el header, luego hacemos la petición
    return this.getAuthHeaders().pipe(
        switchMap(headers => {
            return this.http.get<Contrato[]>(`${this.apiUrl}/mis-contratos`, { headers });
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


//   obtenerMisContratos(): Observable<Contrato[]> {
//     return this.http.get<Contrato[]>(`${this.apiUrl}/mis-contratos`);
//   }

//   firmarContrato(idContrato: number): Observable<Contrato> {
//     return this.http.post<Contrato>(`${this.apiUrl}/${idContrato}/firmar`, {});
//   }
}