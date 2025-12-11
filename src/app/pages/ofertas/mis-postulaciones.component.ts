import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { DatePipe, CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-mis-postulaciones',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
    <div class="container py-4">
      <h2>Mis Postulaciones</h2>
      
      <!-- Animación de carga -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-3 text-muted">Cargando tus postulaciones...</p>
      </div>
      
      <!-- Sin postulaciones -->
      <div *ngIf="!loading && postulaciones.length === 0" class="alert alert-info text-center">
        <i class="fas fa-info-circle mb-2" style="font-size: 2rem;"></i>
        <h5>No tienes postulaciones registradas</h5>
        <p>Ve a la sección de <a href="/ofertas" class="alert-link">ofertas</a> para postularte a empleos.</p>
      </div>
      
      <!-- Lista de postulaciones -->
      <div *ngIf="!loading && postulaciones.length > 0">
        <div class="alert alert-success mb-3">
          <i class="fas fa-check-circle"></i> 
          Tienes {{ postulaciones.length }} postulación(es) registrada(s)
        </div>
        
        <div *ngFor="let p of postulaciones; let i = index" class="card mb-3 shadow-sm">
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <h5 class="card-title text-primary">
                  <i class="fas fa-briefcase me-2"></i>
                  {{ p.titulo || p.ofertaTitulo || p.oferta_titulo || p.nombre_oferta || 'Oferta sin título' }}
                </h5>
                <p class="card-text mb-1">
                  <i class="fas fa-building me-2"></i>
                  {{ p.empresa || p.empresaNombre || 'Empresa no especificada' }}
                </p>
                <p class="card-text mb-1" *ngIf="p.nombres || p.apellidos">
                  <i class="fas fa-user me-2"></i>
                  Nombre: {{ p.nombres }} {{ p.apellidos }}
                </p>
                <p class="card-text mb-1" *ngIf="p.rut">
                  <i class="fas fa-id-card me-2"></i>
                  RUT: {{ p.rut }}
                </p>
                <p class="card-text mb-1" *ngIf="p.telefono">
                  <i class="fas fa-phone me-2"></i>
                  Teléfono: {{ p.telefono }}
                </p>
                <p class="card-text mb-1" *ngIf="p.email">
                  <i class="fas fa-envelope me-2"></i>
                  Email: {{ p.email }}
                </p>
                <p class="card-text mb-1" *ngIf="p.experiencia">
                  <i class="fas fa-briefcase me-2"></i>
                  Experiencia: {{ p.experiencia }}
                </p>
                <p class="card-text mb-1" *ngIf="p.descripcion_experiencia">
                  <i class="fas fa-align-left me-2"></i>
                  Descripción experiencia: {{ p.descripcion_experiencia }}
                </p>
                <p class="card-text mb-1" *ngIf="p.motivacion">
                  <i class="fas fa-lightbulb me-2"></i>
                  Motivación: {{ p.motivacion }}
                </p>
                <p class="card-text mb-1" *ngIf="p.curriculum_name && p.curriculum_path">
                  <i class="fas fa-file-pdf me-2"></i>
                  Curriculum: <a [href]="'/uploads/cv/' + p.curriculum_path" target="_blank">{{ p.curriculum_name }}</a>
                </p>
                <p class="card-text mb-1" *ngIf="p.area || p.ofertaArea">
                  <i class="fas fa-layer-group me-2"></i>
                  Área: {{ p.area || p.ofertaArea }}
                </p>
                <p class="card-text mb-1" *ngIf="p.tipo || p.contrato_type">
                  <i class="fas fa-file-contract me-2"></i>
                  Tipo: {{ p.tipo || p.contrato_type }}
                </p>
                <p class="card-text mb-1" *ngIf="p.comuna || p.location">
                  <i class="fas fa-map-marker-alt me-2"></i>
                  Comuna: {{ p.comuna || p.location }}
                </p>
                <p class="card-text mb-1" *ngIf="p.descripcion">
                  <i class="fas fa-align-left me-2"></i>
                  {{ p.descripcion }}
                </p>
              </div>
              <div class="col-md-4 text-end">
                <span class="badge fs-6 mb-2" 
                      [class.bg-warning]="(p.estado || 'ENVIADA') === 'ENVIADA'"
                      [class.bg-success]="(p.estado || 'ENVIADA') === 'ACEPTADA'"
                      [class.bg-danger]="(p.estado || 'ENVIADA') === 'RECHAZADA'">
                  {{ p.estado || 'ENVIADA' }}
                </span>
                <div *ngIf="(p.estado || 'ENVIADA') === 'ACEPTADA'" class="alert alert-success mt-2 p-2">
                  <i class="fas fa-check-circle"></i> ¡Tu postulación fue aceptada! 
                  <br><small>Pronto recibirás información del contrato.</small>
                  <br><a routerLink="/mis-contratos" class="btn btn-sm btn-outline-success mt-1">Ver Contratos</a>
                </div>
                <p class="text-muted mb-0">
                  <i class="fas fa-calendar me-1"></i>
                  {{ p.fecha | date:'dd/MM/yyyy' }}
                </p>
                <button class="btn btn-outline-danger btn-sm mt-2" (click)="cancelarPostulacion(p)">
                  <i class="fas fa-times"></i> Cancelar postulación
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MisPostulacionesComponent implements OnInit {
    async cancelarPostulacion(postulacion: any) {
            // Log de los valores que se enviarán al backend
            const ofertaIdLog = postulacion.oferta_id || postulacion.id;
            let trabajadorIdLog = '';
            const authDataLog = localStorage.getItem('auth');
            if (authDataLog) {
              try {
                const parsed = JSON.parse(authDataLog);
                trabajadorIdLog = parsed.user?.userId || parsed.user?.id || '';
              } catch {}
            }
            console.log('Intentando eliminar postulación:', { oferta_id: ofertaIdLog, trabajador_id: trabajadorIdLog });
      if (!confirm('¿Estás seguro de que deseas cancelar esta postulación?')) {
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        alert('No se encontró token de autenticación.');
        return;
      }
      try {
        // Obtener trabajador_id solo desde localStorage
        let trabajadorId = '';
        const authData = localStorage.getItem('auth');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            trabajadorId = parsed.user?.userId || parsed.user?.id || '';
          } catch {}
        }
        if (!trabajadorId) {
          alert('No se encontró el trabajador_id.');
          return;
        }
        const response = await fetch(`http://localhost:8081/api/postulaciones/${postulacion.oferta_id || postulacion.id}/${trabajadorId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          this.postulaciones = this.postulaciones.filter(p => (p.oferta_id || p.id) !== (postulacion.oferta_id || postulacion.id));
          this.cdr.detectChanges();
          alert('Postulación cancelada exitosamente.');
        } else {
          alert('No se pudo cancelar la postulación.');
        }
      } catch (error) {
        alert('Error al cancelar la postulación.');
        console.error(error);
      }
    }
  router = inject(Router);
  loading = true;
  postulaciones: any[] = [];
  auth = inject(AuthService);
  private msal = inject(MsalService);

  // Inyectar ChangeDetectorRef
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    console.log(' === COMPONENTE MIS POSTULACIONES INICIADO ===');
    console.log(' Rol actual:', this.auth.role());
    console.log(' URL actual:', window.location.href);
    console.log(' Router URL:', this.router.url);
    
    // Suscribirse a cambios de ruta para recargar cuando sea necesario
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects === '/mis-postulaciones') {
        console.log(' Navegación detectada a mis-postulaciones - recargando...');
        this.esperarYCargar();
      }
    });
    
    // Iniciar el proceso de espera y carga
    this.esperarYCargar();
  }
  
  // Nueva función que espera a que todo esté listo antes de cargar
  private async esperarYCargar() {
    console.log(' Esperando inicialización completa...');
    
    // Esperar a que MSAL esté completamente inicializado
    let intentos = 0;
    const maxIntentos = 5; // Reducido de 10 a 5
    
    while (intentos < maxIntentos) {
      const accounts = this.msal.instance.getAllAccounts();
      const token = localStorage.getItem('token');
      
      console.log(` Intento ${intentos + 1}: Accounts: ${accounts.length}, Token: ${token ? 'Sí' : 'No'}`);
      
      if (accounts.length > 0 && token) {
        console.log(' Inicialización completa detectada - iniciando carga...');
        await this.delay(100); // Reducido delay
        this.cargarPostulaciones();
        return;
      }
      
      intentos++;
      await this.delay(200); // Reducido de 300ms a 200ms
    }
    
    console.log(' Timeout de inicialización - cargando de todos modos...');
    this.cargarPostulaciones();
  }

  async cargarPostulaciones() {
    console.log(' Iniciando carga de postulaciones...');
    this.loading = true;
    this.postulaciones = []; // Limpiar datos anteriores
    
    // Verificaciones de autenticación más robustas
    const token = localStorage.getItem('token');
    const accounts = this.msal.instance.getAllAccounts();
    
    console.log('Verificando autenticación:', {
      token: token ? 'Presente' : 'Ausente',
      accounts: accounts.length,
      activeAccount: this.msal.instance.getActiveAccount() ? 'Sí' : 'No'
    });
    
    if (!token || accounts.length === 0) {
      console.log(' Autenticación incompleta - no se puede cargar');
      await this.delay(800); // Delay más largo para mostrar la animación
      this.loading = false;
      return;
    }
    
    try {
      console.log('📡 Haciendo petición al backend...');
      
      const response = await fetch('http://localhost:8081/api/postulaciones?email', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(' Respuesta recibida:', response.status, response.statusText);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Respuesta como texto:', responseText);
        
        let data = [];
        
        if (responseText.trim() === '') {
          console.log(' Respuesta vacía del servidor - asumiendo sin postulaciones');
          data = [];
        } else {
          try {
            data = JSON.parse(responseText);
            console.log(' JSON parseado correctamente:', data);
          } catch (parseError) {
            console.log(' Error parseando JSON:', parseError);
            console.log(' Contenido que causó error:', responseText);
            data = [];
          }
        }
        
        // Asegurar que siempre sea un array
        this.postulaciones = Array.isArray(data) ? data : [];
        // Delay mínimo para UX fluida
        await this.delay(800);
        this.cdr.detectChanges();
        console.log(' Postulaciones finales:', this.postulaciones.length);
      } else {
        console.log(' Error en respuesta del servidor:', response.status);
        this.postulaciones = [];
        await this.delay(800);
        this.cdr.detectChanges();
      }
      
    } catch (error) {
      console.error(' Error en la petición:', error);
      this.postulaciones = [];
      await this.delay(800);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      console.log(' Carga completada. Loading:', this.loading, 'Postulaciones:', this.postulaciones.length);
    }
  }
  
  // Función helper para crear delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  }

