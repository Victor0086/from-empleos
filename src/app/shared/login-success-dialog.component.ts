import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-login-success-dialog',
  template: `
    <div class="text-center p-4">
      <h4 class="mb-3">¡Inicio de sesión exitoso!</h4>
      <p>Bienvenido a Web Empleos.</p>
    </div>
  `,
  styles: [`
    h4 { color: #198754; }
  `]
})
export class LoginSuccessDialogComponent {
  constructor(public dialogRef: MatDialogRef<LoginSuccessDialogComponent>) {}
}
