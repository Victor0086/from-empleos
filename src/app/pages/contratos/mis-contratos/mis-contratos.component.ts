import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContratoService, Contrato } from '../../../core/services/contrato.service';
import { MsalService } from '@azure/msal-angular';
import { MatDialog } from '@angular/material/dialog';
import { ContratoDialogComponent } from '../contrato-dialog/contrato-dialog.component';

@Component({
  selector: 'app-mis-contratos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  templateUrl: './mis-contratos.component.html',
  styleUrl: './mis-contratos.component.css'
})
export class MisContratosComponent implements OnInit {
    // Permite rechazar contrato si soy trabajador y el contrato está pendiente de firmas
    // Función para verificar si el usuario puede rechazar (sin importar si ya firmó)
    esUsuarioDelContrato(contrato: Contrato): boolean {
      // Si tengo un currentUserId válido, soy usuario del contrato
      return !!this.currentUserId;
    }

    puedeRechazar(contrato: Contrato): boolean {
      return contrato.estado === 'PENDIENTE_FIRMAS' && this.currentUserId === contrato.postulacion.trabajadorId && !contrato.firmaTrabajador;
    }

    // Verificar si el usuario actual ya firmó el contrato
    yaFirme(contrato: Contrato): boolean {
      if (!this.currentUserId || !contrato.postulacion) {
        return false;
      }
      
      const soyTrabajador = this.currentUserId === contrato.postulacion.trabajadorId;
      
      // Si la firma no es null, significa que ya firmó (contiene fecha como string)
      const yaFirme = soyTrabajador ? 
        (contrato.firmaTrabajador && contrato.firmaTrabajador !== '') : 
        (contrato.firmaEmpleador && contrato.firmaEmpleador !== '');
      
      return !!yaFirme;
    }

    rechazarContrato(contrato: Contrato) {
      // Verificar si ya firmó antes de rechazar
      const soyTrabajador = this.currentUserId === contrato.postulacion.trabajadorId;
      const yaFirme = soyTrabajador ? contrato.firmaTrabajador : contrato.firmaEmpleador;
      
      if (yaFirme) {
        alert('No puedes rechazar un contrato que ya has firmado.');
        return;
      }
      
      if (!confirm('¿Estás seguro de que deseas rechazar este contrato? Esta acción no se puede deshacer.')) {
        return;
      }
      
      this.firmandoId = contrato.id;
      console.log(' Rechazando contrato:', contrato.id);
      
      this.contratoService.rechazarContrato(contrato.id).subscribe({
        next: (respuesta: any) => {
          console.log('Contrato rechazado exitosamente:', respuesta);
          
          // Remover el contrato de la lista local inmediatamente
          this.contratos = this.contratos.filter(c => c.id !== contrato.id);
          
          // Intentar notificar al empleador sobre el rechazo
          this.notificarRechazoEmpleador(contrato);
          
          alert('Contrato rechazado exitosamente.');
          this.firmandoId = null;
          this.cdr.detectChanges();
          
          // Recargar contratos para sincronizar con el backend
          setTimeout(() => {
            this.cargarContratos();
          }, 1000);
        },
        error: (err) => {
          console.error('Error al rechazar contrato:', err);
          this.firmandoId = null;
          
          const errorMsg = err.error?.mensaje || err.error || 'Error al rechazar el contrato.';
          alert('Error: ' + errorMsg);
        }
      });
    }
   
  contratos: Contrato[] = [];
  displayedColumns: string[] = ['id', 'oferta', 'estado', 'firmas', 'acciones'];
  loading = true;
  firmandoId: number | null = null;
  currentUserId: string = '';
  
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private contratoService: ContratoService,
    private authService: MsalService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    console.log('=== COMPONENTE MIS CONTRATOS INICIADO ===');
    console.log('URL actual:', window.location.href);
    console.log('Router URL:', this.router.url);
    
    // Suscribirse a cambios de ruta para recargar cuando sea necesario
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.urlAfterRedirects === '/mis-contratos') {
        console.log('Navegación detectada a mis-contratos - recargando...');
        this.esperarYCargar();
      }
    });
    
    // Iniciar el proceso de espera y carga
    this.esperarYCargar();
  }

  // Nueva función que espera a que todo esté listo antes de cargar
  private async esperarYCargar() {
    console.log('Esperando inicialización completa...');
    
    // Obtener ID del usuario actual desde el JWT sub para que coincida con el backend
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const jwt = token.split('.')[1];
        if (jwt) {
          const payload = JSON.parse(atob(jwt.replace(/-/g, '+').replace(/_/g, '/')));
          this.currentUserId = payload.sub;
        }
      } catch (e) {
        console.error('No se pudo obtener el sub del JWT', e);
      }
    }
    
    // Esperar a que MSAL esté completamente inicializado
    let intentos = 0;
    const maxIntentos = 5;
    
    while (intentos < maxIntentos) {
      const accounts = this.authService.instance.getAllAccounts();
      const tokenCheck = localStorage.getItem('token');
      
      console.log(`Intento ${intentos + 1}: Accounts: ${accounts.length}, Token: ${tokenCheck ? 'Sí' : 'No'}`);
      
      if (accounts.length > 0 && tokenCheck) {
        console.log('Inicialización completa detectada - iniciando carga...');
        await this.delay(100);
        this.cargarContratos();
        return;
      }
      
      intentos++;
      await this.delay(200);
    }
    
    console.log('Timeout de inicialización - cargando de todos modos...');
    this.cargarContratos();
  }

  async cargarContratos() {
    console.log(' Iniciando carga de contratos...');
    this.loading = true;
    this.contratos = []; // Limpiar datos anteriores
    
    try {
      console.log(' Haciendo petición de contratos al backend...');
      
      this.contratoService.obtenerMisContratos().subscribe({
        next: (data) => {
          console.log(' Contratos recibidos del backend:', data);
          console.log(' Número de contratos:', data ? data.length : 0);
          
          // Log detallado de cada contrato para debugging
          if (data && data.length > 0) {
            data.forEach((contrato, index) => {
              console.log(`Contrato ${index + 1}:`, {
                id: contrato.id,
                estado: contrato.estado,
                firmaTrabajador: contrato.firmaTrabajador,
                firmaEmpleador: contrato.firmaEmpleador,
                trabajadorId: contrato.postulacion?.trabajadorId,
                currentUserId: this.currentUserId
              });
            });
          }
          
          // Asegurar que siempre sea un array
          this.contratos = Array.isArray(data) ? data : [];
          
          // Actualizar vista inmediatamente
          this.loading = false;
          this.cdr.detectChanges();
          console.log(' Contratos cargados exitosamente:', this.contratos.length);
        },
        error: (err) => {
          console.error(' Error cargando contratos:', err);
          this.contratos = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
      
    } catch (error) {
      console.error(' Error en la petición de contratos:', error);
      this.contratos = [];
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
  
  // Función helper para crear delays
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Notificar al empleador cuando se rechaza el contrato
  private notificarRechazoEmpleador(contrato: Contrato) {
    console.log('Intentando notificar rechazo al empleador para contrato:', contrato.id);
    
    const notificacion = {
      contrato_id: contrato.id,
      tipo: 'CONTRATO_RECHAZADO',
      mensaje: `El trabajador ha rechazado el contrato #${contrato.id}. Puedes crear un nuevo contrato con términos diferentes.`,
      fecha: new Date().toISOString(),
      destinatario_tipo: 'empleador'
    };

    // Intentar enviar notificación - usar endpoint genérico de notificaciones
    fetch('http://localhost:8081/api/notificaciones', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificacion)
    }).then(response => {
      if (response.ok) {
        console.log('Notificación de rechazo enviada exitosamente');
      } else {
        console.log('Notificación no enviada - endpoint no disponible (esto es normal si no está implementado)');
      }
    }).catch(error => {
      console.log('ℹSistema de notificaciones no disponible aún (esto es normal)');
      // No mostrar error al usuario porque la funcionalidad principal (rechazar) funciona
    });
  }

  // Notificar al notario cuando el contrato esté completamente firmado
  private notificarNotario(contrato: Contrato) {
    console.log('Notificando al notario para contrato:', contrato.id);
    
    const notificacion = {
      contrato_id: contrato.id,
      tipo: 'CONTRATO_FIRMADO_COMPLETO',
      mensaje: `El contrato #${contrato.id} ha sido firmado por ambas partes y requiere validación notarial.`,
      fecha: new Date().toISOString()
    };

    // Enviar notificación al sistema de notarios
    fetch('http://localhost:8081/api/notarios/notificaciones', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificacion)
    }).then(response => {
      if (response.ok) {
        console.log('Notificación enviada al notario exitosamente');
      } else {
        console.log('Error al enviar notificación al notario');
      }
    }).catch(error => {
      console.error('Error en notificación al notario:', error);
    });
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'ACTIVO': return 'primary'; // Verde/Azul según tema
      case 'PENDIENTE_FIRMAS': return 'accent'; // Amarillo/Naranja
      case 'FINALIZADO': return 'warn';
      default: return '';
    }
  }

  puedeFirmar(contrato: Contrato): boolean {
    // No se puede firmar si está en proceso de firma
    if (this.firmandoId === contrato.id) {
      return false;
    }

    // Si el contrato no está pendiente de firmas, nadie puede firmar
    if (contrato.estado !== 'PENDIENTE_FIRMAS') {
      return false;
    }

    // Verificar que tenemos userId válido
    if (!this.currentUserId) {
      return false;
    }

    // Identificar si soy trabajador o empleador
    const soyTrabajador = this.currentUserId === contrato.postulacion?.trabajadorId;
    
    console.log(` puedeFirmar - Contrato ${contrato.id}:`, {
      currentUserId: this.currentUserId,
      trabajadorId: contrato.postulacion?.trabajadorId,
      soyTrabajador,
      firmaTrabajador: contrato.firmaTrabajador,
      firmaEmpleador: contrato.firmaEmpleador
    });

    if (soyTrabajador) {
      // Si soy trabajador, puedo firmar solo si no he firmado aún
      const yaFirme = contrato.firmaTrabajador && contrato.firmaTrabajador !== '';
      console.log(` Trabajador ya firmó: ${yaFirme}`);
      return !yaFirme;
    } else {
      // Si soy empleador, puedo firmar solo si no he firmado aún
      const yaFirme = contrato.firmaEmpleador && contrato.firmaEmpleador !== '';
      console.log(` Empleador ya firmó: ${yaFirme}`);
      return !yaFirme;
    }
  }

  firmar(contrato: Contrato) {
    // Validaciones adicionales antes de mostrar el diálogo
    if (!this.puedeFirmar(contrato)) {
      alert('No puedes firmar este contrato en este momento.');
      return;
    }

    if (this.yaFirme(contrato)) {
      alert('Ya has firmado este contrato.');
      return;
    }

    console.log(' Abriendo diálogo para firmar contrato:', contrato.id);

    const dialogRef = this.dialog.open(ContratoDialogComponent, {
      width: '600px',
      data: {
        contrato: contrato,
        tituloOferta: contrato.postulacion?.tituloOferta || 'Oferta',
        sueldo: contrato.postulacion?.sueldo || 0,
        nombreEmpleador: contrato.postulacion?.nombreEmpleador || 'Empleador',
        nombreTrabajador: contrato.postulacion?.nombreTrabajador || this.authService.instance.getActiveAccount()?.name || 'Usuario'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      console.log(' Diálogo cerrado, confirmado:', confirmado);
      if (confirmado === true) {
        // Verificar una vez más antes de ejecutar
        if (this.puedeFirmar(contrato) && !this.yaFirme(contrato)) {
          this.ejecutarFirma(contrato);
        } else {
          alert('El estado del contrato ha cambiado. No se puede firmar.');
          this.cargarContratos(); // Recargar para mostrar el estado actual
        }
      }
    });
  }

  private ejecutarFirma(contrato: Contrato) {
    this.firmandoId = contrato.id;
    console.log('Iniciando proceso de firma para contrato:', contrato.id);
    
    this.contratoService.firmarContrato(contrato.id).subscribe({
      next: (respuesta: any) => {
        console.log('Respuesta del servidor al firmar:', respuesta);
        
        const contratoActualizado = respuesta.contrato || respuesta; 
        const mensajeServidor = respuesta.mensaje || 'Contrato firmado exitosamente';

        // Actualizar el contrato en la lista local inmediatamente
        const index = this.contratos.findIndex(c => c.id === contratoActualizado.id);
        if (index !== -1) {
          this.contratos[index] = { ...contratoActualizado };
          console.log('Contrato actualizado localmente:', this.contratos[index]);
        }
        
        this.firmandoId = null;
        
        // Mostrar mensaje basado en el estado del contrato
        if (contratoActualizado.estado === 'ACTIVO') {
          alert('¡Contrato completamente firmado! Ambas partes han firmado y el contrato está activo.');
          // Notificar al notario si es necesario
          this.notificarNotario(contratoActualizado);
        } else {
          alert(mensajeServidor + ' La interfaz se actualizará para mostrar el nuevo estado.');
        }

        // Forzar detección de cambios
        this.cdr.detectChanges();
        
        // Recargar contratos después de un breve delay para asegurar sincronización
        setTimeout(() => {
          console.log('Recargando contratos para confirmar estado actualizado...');
          this.cargarContratos();
        }, 1000);
      },
      error: (err) => {
        console.error('Error al firmar contrato:', err);
        this.firmandoId = null;
        
        const errorMsg = err.error?.mensaje || err.error || 'Error al firmar el contrato.';
        alert('Error: ' + errorMsg);
        this.cdr.detectChanges();
      }
    });
  }

}
