import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  isDialog = true;
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
      this.registerForm = this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        rol: ['trabajador', [Validators.required]]
      }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: any) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  get f() {
    return this.registerForm.controls;
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    // Usar MSAL para redirigir al flujo de registro de Azure AD B2C
    try {
      const msal = await import('@azure/msal-browser');
      const client = new msal.PublicClientApplication({
        auth: {
          clientId: '1b8c46cb-d440-4839-8a95-e876e2025d18',
          authority: 'https://instantjobb2c.b2clogin.com/instantjobb2c.onmicrosoft.com/B2C_1_signup', // Policy de registro
          redirectUri: 'http://localhost:4200/'
        }
      });
      client.loginRedirect({
        scopes: ['openid', 'profile', 'email']
      });
    } catch (err) {
      this.error = 'Error al iniciar el registro en Azure AD B2C';
      this.loading = false;
    }
  }
}