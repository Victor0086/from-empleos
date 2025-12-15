import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { PostulantesDialogComponent } from '../postulantes-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgFor, NgIf } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Oferta {
  id: number;
  titulo: string;
  area?: string;
  tipo?: string;
  comuna?: string;
  location?: string;
  contrato_type?: string;
  sueldo?: number;
  estado: 'ABIERTA' | 'CERRADA';
  fecha: 'hoy' | 'ayer' | 'antiguo';
  descripcion: string;
  horario?: string;
  duracion?: string;
  empleador_id?: string;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

@Component({
  standalone: true,
  selector: 'app-ofertas-list',
  imports: [CommonModule, MatIconModule, MatButtonModule, NgFor, NgIf, MatDialogModule, PostulantesDialogComponent],
  templateUrl: './ofertas-list.component.html',
  styleUrls: ['./ofertas-list.component.css']
})
export class OfertasListComponent implements OnInit {
  loading: boolean = false;
  auth = inject(AuthService);
  private msalService = inject(MsalService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = environment.apiConfig.url;
  private cdr = inject(ChangeDetectorRef);

  misOfertas: Oferta[] = [];
  ofertas: Oferta[] = [];
  cambiandoEstado: number | null = null;
  cols = ['titulo','area','tipo','comuna','estado','acciones'];
  data: Oferta[] = [
   
    
  ];
  ordenActual: 'relevantes' | 'recientes' = 'relevantes';
  ofertasOrdenadas: Oferta[] = [...this.data];

  ordenarPor(tipo: 'relevantes' | 'recientes') {
    this.ordenActual = tipo;
    if (tipo === 'relevantes') {
      // Simula relevancia: primero las abiertas
      this.ofertasOrdenadas = [...this.data].sort((a, b) => a.estado === 'ABIERTA' ? -1 : 1);
    } else {
      // Simula recientes: primero las de hoy, luego ayer, luego antiguas
      this.ofertasOrdenadas = [...this.data].sort((a, b) => {
        const ordenFecha = { 'hoy': 0, 'ayer': 1, 'antiguo': 2 };
        return ordenFecha[a.fecha] - ordenFecha[b.fecha];
      });
    }
  }

  ngOnInit() {
    console.log('=== ngOnInit OFERTAS-LIST ===');
    console.log('Rol del usuario:', this.auth.role());
    console.log('¿Es empleador?', this.auth.role() === 'empleador');
    console.log('localStorage auth:', localStorage.getItem('auth'));
    this.loading = true;
    // Cargar ofertas según el rol del usuario
    if (this.auth.role() === 'empleador') {
      console.log('Cargando ofertas del empleador...');
      this.cargarMisOfertas();
    } else {
      console.log('Cargando ofertas disponibles para trabajadores...');
      this.cargarOfertas();
    }
  }

  cargarOfertas() {
    this.loading = true;
    this.http.get<any[]>(`${this.apiUrl}/ofertas`).subscribe({
      next: (ofertas) => {
        console.log('Ofertas cargadas para trabajadores:', ofertas);
        // Filtrar solo ofertas ABIERTAS para trabajadores
        const ofertasAbiertas = ofertas.filter(oferta => oferta.estado === 'ABIERTA');
        // Mapear ofertas del backend al formato del frontend
        this.data = ofertasAbiertas.map(oferta => ({
          id: oferta.oferta_id,
          titulo: oferta.titulo,
          area: 'General',
          tipo: oferta.contrato_type,
          comuna: oferta.location,
          estado: oferta.estado,
          fecha: this.calcularFecha(oferta.fecha_creacion),
          sueldo: 0,
          descripcion: oferta.descripcion,
          horario: 'Por definir',
          duracion: 'Por definir'
        }));
        // ACTUALIZAR LA VARIABLE ofertas PARA QUE EL HTML LA USE
        this.ofertas = [...this.data];
        console.log('Ofertas disponibles para trabajadores:', this.data);
        this.ordenarPor(this.ordenActual);
        this.loading = false;
        this.cdr.detectChanges();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar ofertas:', error);
        this.ordenarPor(this.ordenActual);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularFecha(fechaCreacion: string | undefined): 'hoy' | 'ayer' | 'antiguo' {
    if (!fechaCreacion) return 'hoy';
    
    const hoy = new Date();
    const fecha = new Date(fechaCreacion);
    const diffTime = Math.abs(hoy.getTime() - fecha.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    return 'antiguo';
  }

  getBadgeClass(fecha: 'hoy' | 'ayer' | 'antiguo') {
    if (fecha === 'hoy') return 'badge bg-success text-white';
    if (fecha === 'ayer') return 'badge bg-warning text-dark';
    return 'badge bg-secondary text-white';
  }

  async abrirPostulacionModal(ofertaId: number) {
    // Verificar estado de MSAL (que es el que realmente se usa)
    const accounts = this.msalService.instance.getAllAccounts();
    const isLogged = accounts.length > 0;
    
    console.log('Cuentas MSAL:', accounts); // Para debug
    console.log('Estado de sesión MSAL:', isLogged); // Para debug
    
    if (isLogged) {
      this.router.navigate(['/postulacion'], { queryParams: { ofertaId: ofertaId } });
      return;
    }
    
    try {
      const { PostulacionDialogComponent } = await import('../postulacion-dialog.component');
      this.dialog.open(PostulacionDialogComponent, {
        width: '350px',
        autoFocus: false,
        panelClass: 'modal-postulacion',
      });
    } catch (error) {
      console.error('Error al cargar PostulacionDialogComponent:', error);
      alert('Error al abrir el diálogo de postulación. Por favor, intente nuevamente.');
    }
  }

  verDetalle(id: number) {
    // Navega al detalle de la oferta
    window.location.href = `/ofertas/${id}`;
  }

  // Métodos para empleadores
  cargarMisOfertas() {
    this.loading = true;
    console.log('=== INICIANDO CARGA DE MIS OFERTAS (EMPLEADOR) ===');
    // Obtener userId directamente de localStorage que ya está disponible
    const authData = localStorage.getItem('auth');
    if (!authData) {
      console.error('No hay datos de autenticación');
      this.loading = false;
      return;
    }
    let userId;
    try {
      const parsed = JSON.parse(authData);
      userId = parsed.user?.userId || parsed.userId;
      console.log('userId desde localStorage:', userId);
    } catch (error) {
      console.error('Error al parsear auth data:', error);
      this.loading = false;
      return;
    }
    if (!userId) {
      console.error('No se encontró userId en localStorage');
      this.loading = false;
      return;
    }
    console.log('UserId del empleador:', userId);
    console.log('Tipo de userId:', typeof userId);
    console.log('URL completa de la petición:', `${this.apiUrl}/ofertas/empleador/${userId}`);
    // Usar el nuevo endpoint para obtener solo las ofertas del empleador autenticado
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    this.http.get<any[]>(`${this.apiUrl}/ofertas/empleador/${userId}`, { headers }).subscribe({
      next: (ofertas) => {
        console.log('Ofertas del empleador desde endpoint:', ofertas);
        this.misOfertas = ofertas.map(oferta => ({
          id: oferta.oferta_id || oferta.id,
          titulo: oferta.titulo,
          location: oferta.location,
          contrato_type: oferta.contrato_type,
          estado: oferta.estado as 'ABIERTA' | 'CERRADA',
          descripcion: oferta.descripcion,
          empleador_id: oferta.empleador_id,
          fecha_creacion: oferta.fecha_creacion,
          fecha_modificacion: oferta.fecha_modificacion,
          fecha: this.calcularFecha(oferta.fecha_creacion)
        }));
        console.log('Mis ofertas como empleador:', this.misOfertas);
        console.log('Número de mis ofertas:', this.misOfertas.length);
        this.loading = false;
        // Forzar actualización de la vista usando setTimeout para el siguiente ciclo
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 50);
      },
      error: (error) => {
        console.error('ERROR al cargar ofertas:', error);
        this.misOfertas = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  crearNuevaOferta() {
    this.router.navigate(['/ofertas/nueva']);
  }

  cambiarEstado(oferta: Oferta) {
    const nuevoEstado: 'ABIERTA' | 'CERRADA' = oferta.estado === 'ABIERTA' ? 'CERRADA' : 'ABIERTA';
    const accion = nuevoEstado === 'CERRADA' ? 'cerrar' : 'reabrir';
    
    if (!confirm(`¿Estás seguro de que deseas ${accion} esta oferta?`)) {
      return;
    }

    this.cambiandoEstado = oferta.id;
    const token = localStorage.getItem('token');
    
    this.http.put(`${this.apiUrl}/ofertas/${oferta.id}/estado`, 
      { estado: nuevoEstado },
      { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
    ).subscribe({
      next: (response) => {
        oferta.estado = nuevoEstado;
        this.cambiandoEstado = null;
        
        const mensaje = nuevoEstado === 'CERRADA' 
          ? 'Oferta cerrada exitosamente. Los postulantes serán notificados.' 
          : 'Oferta reabierta exitosamente.';
        alert(mensaje);
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.cambiandoEstado = null;
        alert('Error al cambiar el estado de la oferta. Inténtalo nuevamente.');
      }
    });
  }



  getEstadoBadgeClass(estado: string): string {
    return estado === 'ABIERTA' ? 'badge bg-success' : 'badge bg-secondary';
  }

  getEstadoTexto(estado: string): string {
    return estado === 'ABIERTA' ? 'Activa' : 'Cerrada';
  }

    eliminarOferta(oferta: Oferta) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta oferta laboral? Esta acción no se puede deshacer.')) {
      return;
    }
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    this.http.delete(`${this.apiUrl}/ofertas/${oferta.id}`, { headers }).subscribe({
      next: () => {
        this.misOfertas = this.misOfertas.filter(o => o.id !== oferta.id);
        alert('Oferta eliminada exitosamente.');
      },
      error: (error) => {
        console.error('Error al eliminar oferta:', error);
        alert('Error al eliminar la oferta. Inténtalo nuevamente.');
      }
    });
  }

  // Mostrar postulantes en un modal
  verPostulantes(ofertaId: number) {
    this.loading = true;
    const token = localStorage.getItem('token');
    const headers: any = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    this.http.get<any[]>(`${this.apiUrl}/postulaciones/oferta/${ofertaId}`, { headers }).subscribe({
      next: (postulantes: any[]) => {
        this.loading = false;
        // Mapear para asegurar que cada postulante tenga oferta_id y trabajador_id definidos
        const postulantesMapeados = (postulantes || []).map(p => ({
          ...p,
          oferta_id: p.oferta_id ?? ofertaId,
          trabajador_id: p.trabajador_id ?? p.trabajadorId ?? p.id_trabajador ?? '',
        }));
        this.dialog.open(PostulantesDialogComponent, {
          width: '400px',
          data: postulantesMapeados
        });
      },
      error: (error: any) => {
        this.loading = false;
        alert('Error al obtener postulantes.');
      }
    });
  }

}
