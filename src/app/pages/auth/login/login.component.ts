// src/app/pages/auth/login/login.component.ts
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MsalService } from '@azure/msal-angular';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service'; // ajusta si tu ruta difiere

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
  <div class="row justify-content-center">
    <div class="col-12 col-md-6 col-lg-4">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h4 class="mb-3 text-center">Iniciar sesión</h4>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="w-100 mb-2">
              <mat-label>Correo</mat-label>
              <input matInput formControlName="email" type="email">
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-100 mb-3">
              <mat-label>Contraseña</mat-label>
              <input matInput formControlName="password" type="password">
            </mat-form-field>

            <button mat-raised-button color="primary" class="w-100" [disabled]="form.invalid">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
  `
})
export class LoginComponent {
  form;

  constructor(
    private fb: FormBuilder,
    private msal: MsalService,
    private router: Router,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.msal.loginPopup().subscribe({
      next: (res) => {
        // fijar cuenta activa
        if (res.account) {
          this.msal.instance.setActiveAccount(res.account);
        }
        const acc = this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
        if (!acc) return;

        // leer claims y mapear a tu rol interno
        const claims: any = acc.idTokenClaims || {};
        const rol: 'empleador' | 'trabajador' | 'admin' | 'notario' =
          (claims['roles']?.[0] || claims['extension_Role'] || claims['role'] || 'trabajador');

        // sincroniza tu AuthService (navbar dinámico, etc.)
        this.auth.isLogged.set(true);
        this.auth.role.set(rol);

        // redirección inmediata según rol
        if (rol === 'empleador') this.router.navigateByUrl('/ofertas/nueva');
        else if (rol === 'trabajador') this.router.navigateByUrl('/ofertas');
        else this.router.navigateByUrl('/');
      },
      error: (err) => {
        console.error('Error de loginPopup:', err);
      }
    });
  }
}
