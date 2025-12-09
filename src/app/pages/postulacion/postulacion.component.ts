import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-postulacion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule
  ],
  templateUrl: './postulacion.component.html',
  styleUrl: './postulacion.component.css'
})
export class PostulacionComponent {
  postulacionForm: FormGroup;
  archivoSeleccionado: File | null = null;
  enviando = false;
  ofertaId: string = '1';
  private http = inject(HttpClient);
  private apiUrl = environment.apiConfig.url;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.postulacionForm = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      rut: ['', Validators.required],
      telefono: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      experiencia: ['', Validators.required],
      descripcionExperiencia: [''],
      motivacion: [''],
      aceptaTerminos: [false, Validators.requiredTrue]
    });

    // Obtener ofertaId del query param
    this.route.queryParams.subscribe(params => {
      if (params['ofertaId']) {
        this.ofertaId = params['ofertaId'];
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.validarYAsignarArchivo(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget as HTMLElement;
    element.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('drag-over');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const element = event.currentTarget as HTMLElement;
    element.classList.remove('drag-over');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validarYAsignarArchivo(files[0]);
    }
  }

  validarYAsignarArchivo(file: File) {
    // Validar tipo de archivo
    const tiposPermitidos = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!tiposPermitidos.includes(file.type)) {
      alert('Por favor selecciona un archivo PDF, DOC o DOCX');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede ser mayor a 5MB');
      return;
    }

    this.archivoSeleccionado = file;
  }

  eliminarArchivo() {
    this.archivoSeleccionado = null;
  }

  onSubmit() {
    if (this.postulacionForm.valid) {
      this.enviando = true;
      
      // Preparar datos para envío
      const formData = new FormData();
      
      // Agregar campos del formulario
      Object.keys(this.postulacionForm.value).forEach(key => {
        if (key !== 'aceptaTerminos') {
          formData.append(key, this.postulacionForm.value[key] || '');
        }
      });
      
      // Agregar archivo si existe
      if (this.archivoSeleccionado) {
        formData.append('curriculum', this.archivoSeleccionado);
      }
      
      // Agregar metadatos (usando el nombre exacto del parámetro del backend)
      formData.append('oferta_id', this.ofertaId); 

      // Obtener token de localStorage para autenticación
      const token = localStorage.getItem('token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Enviar al backend (el endpoint con MultipartFile)
      this.http.post(`${this.apiUrl}/postulaciones`, formData, { headers }).subscribe({
        next: (response) => {
          this.enviando = false;
          console.log('Postulación enviada exitosamente:', response);
          alert('¡Postulación enviada exitosamente! Te contactaremos pronto.');
          this.router.navigate(['/ofertas']);
        },
        error: (error) => {
          this.enviando = false;
          console.error('Error al enviar postulación:', error);
          alert('Error al enviar la postulación. Por favor, inténtalo nuevamente.');
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.postulacionForm.controls).forEach(key => {
        this.postulacionForm.get(key)?.markAsTouched();
      });
    }
  }

  volver() {
    this.router.navigate(['/ofertas']);
  }
}