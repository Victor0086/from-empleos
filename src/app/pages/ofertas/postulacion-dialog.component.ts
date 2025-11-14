import { Component, inject } from '@angular/core';
import { AuthEventsService } from '../../core/services/auth-events.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-postulacion-dialog',
  standalone: true,
  template: `
    <div class="text-center p-3">
      <h5 class="mb-3">Para poder postular debe iniciar sesión o registrarse</h5>
      <div class="d-flex flex-column gap-2">
        <button mat-raised-button color="primary" (click)="iniciarSesion()">Iniciar sesión</button>
        <button mat-raised-button color="accent" (click)="registrarse()">Registrarse</button>
      </div>
    </div>
  `,
  imports: [MatButtonModule, MatDialogModule],
})
export class PostulacionDialogComponent {
  private dialog = inject(MatDialog);
  private authEvents = inject(AuthEventsService);

  iniciarSesion() {
    this.dialog.closeAll();
    this.authEvents.triggerLogin();
  }

  registrarse() {
    this.dialog.closeAll();
    this.authEvents.triggerRegister();
  }
}
