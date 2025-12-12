import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { MsalService } from '@azure/msal-angular';

@Component({
  standalone: true,
  selector: 'app-oferta-form',
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './oferta-form.component.html',
  styleUrls: ['./oferta-form.component.css']
})
export class OfertaFormComponent {
  areas = ['Construcción','TI','Logística','Diseño'];
  tipos  = [
    { label: 'Indefinido', value: 'INDEFINIDO' },
    { label: 'Temporal', value: 'TEMPORAL' }
  ];
  enviando = false;

  form;
  private http = inject(HttpClient);
  private router = inject(Router);
  private msalService = inject(MsalService);
  private apiUrl = environment.apiConfig.url;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      titulo:['', Validators.required],
      comuna:['', Validators.required],
      area:['', Validators.required],
      tipo:['', Validators.required],
      sueldoDesde: [null as number | null], 
      sueldoHasta: [null as number | null],
      descripcion:['', [Validators.required, Validators.minLength(10)]],
    });
  }

  save() {
    if (this.form.valid) {
      this.enviando = true;
      
      // Usar el mismo patrón que el perfil: obtener email de MSAL y consultar userId al backend
      const account = this.msalService.instance.getActiveAccount() || this.msalService.instance.getAllAccounts()[0];
      if (!account || !account.idTokenClaims) {
        alert('Error: No se pudo obtener la información del usuario.');
        this.enviando = false;
        return;
      }

      const email = String(
        account.idTokenClaims['email'] ||
        account.idTokenClaims['emails']?.[0] ||
        account.idTokenClaims['preferred_username'] ||
        account.username || ''
      );

      if (!email) {
        alert('Error: No se pudo obtener el email del usuario.');
        this.enviando = false;
        return;
      }

      // Obtener el userId del usuario usando su email (igual que el perfil)
      const token = localStorage.getItem('token');
      fetch(`${this.apiUrl}/auth/perfil?email=${email}`, {
        method: 'GET',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.usuario && data.usuario.userId) {
          const empleadorId = data.usuario.userId;
          console.log('Creando oferta con empleador_id:', empleadorId);
          
          const ofertaData = {
            empleador_id: empleadorId,
            titulo: this.form.value.titulo,
            descripcion: this.form.value.descripcion,
            contrato_type: this.form.value.tipo,
            location: this.form.value.comuna,
            estado: 'ABIERTA',
            fecha_creacion: new Date(),
            fecha_modificacion: new Date()
          };

          // Hacer la petición POST con el empleador_id correcto
          const headers: any = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          this.http.post(`${this.apiUrl}/ofertas`, ofertaData, { headers }).subscribe({
            next: (response) => {
              this.enviando = false;
              console.log('Oferta creada exitosamente:', response);
              alert('¡Oferta publicada exitosamente!');
              this.router.navigate(['/ofertas']);
            },
            error: (error) => {
              this.enviando = false;
              console.error('Error al crear oferta:', error);
              alert('Error al publicar la oferta. Inténtalo nuevamente.');
            }
          });
        } else {
          this.enviando = false;
          alert('Error: No se pudo obtener la información del empleador.');
        }
      })
      .catch(error => {
        this.enviando = false;
        console.error('Error al obtener el perfil del usuario:', error);
        alert('Error al obtener la información del usuario.');
      });
    }
  }
}
