import { Component, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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
  providers: [CurrencyPipe],
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
  private currencyPipe = inject(CurrencyPipe);
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
      sueldoDesde: [''], 
      sueldoHasta: [''],
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
            sueldo_desde: this.parseCurrency(this.form.value.sueldoDesde),
            sueldo_hasta: this.parseCurrency(this.form.value.sueldoHasta),
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

  // Métodos para formatear moneda
  formatCurrency(event: any, controlName: string) {
    const value = event.target.value;
    const numericValue = this.extractNumericValue(value);
    
    if (numericValue !== null && numericValue >= 0) {
      // Formatear con puntos de miles
      const formatted = this.formatNumberWithThousands(numericValue);
      this.form.get(controlName)?.setValue(formatted, { emitEvent: false });
      // Mover el cursor al final
      setTimeout(() => {
        event.target.setSelectionRange(event.target.value.length, event.target.value.length);
      });
    }
  }

  onCurrencyFocus(event: any, controlName: string) {
    // Al enfocar, mostrar solo el número sin formato para edición
    const currentValue = event.target.value;
    if (currentValue) {
      const numericValue = this.extractNumericValue(currentValue);
      if (numericValue !== null) {
        event.target.value = numericValue.toString();
      }
    }
  }

  onCurrencyBlur(event: any, controlName: string) {
    // Al desenfocar, aplicar el formato completo
    this.formatCurrency(event, controlName);
  }

  private extractNumericValue(value: string | null | undefined): number | null {
    if (!value) return null;
    // Remover todo excepto dígitos
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? parseInt(cleaned, 10) : null;
  }

  private formatNumberWithThousands(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  parseCurrency(value: string | null | undefined): number | null {
    if (!value) return null;
    const numericValue = this.extractNumericValue(value);
    return numericValue;
  }
}
