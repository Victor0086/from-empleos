import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-oferta-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
  <div class="row justify-content-center">
    <div class="col-12 col-lg-8">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h4 class="mb-3">Publicar oferta</h4>

          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="row g-3">
              <div class="col-12 col-md-8">
                <mat-form-field class="w-100" appearance="outline">
                  <mat-label>Título</mat-label>
                  <input matInput formControlName="titulo">
                </mat-form-field>
              </div>

              <div class="col-12 col-md-4">
                <mat-form-field class="w-100" appearance="outline">
                  <mat-label>Comuna</mat-label>
                  <input matInput formControlName="comuna">
                </mat-form-field>
              </div>

              <div class="col-md-6">
                <mat-form-field class="w-100" appearance="outline">
                  <mat-label>Área</mat-label>
                  <mat-select formControlName="area">
                    <mat-option *ngFor="let a of areas" [value]="a">{{ a }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="col-md-6">
                <mat-form-field class="w-100" appearance="outline">
                  <mat-label>Tipo de empleo</mat-label>
                  <mat-select formControlName="tipo">
                    <mat-option *ngFor="let t of tipos" [value]="t">{{ t }}</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="col-md-6">
                <mat-form-field class="w-100" appearance="outline">
                  <mat-label>Sueldo desde</mat-label>
                  <input matInput type="number" formControlName="sueldoDesde">
                </mat-form-field>
              </div>

              <div class="col-md-6">
                <mat-form-field class="w-100" appearance="outline">
                  <mat-label>Sueldo hasta</mat-label>
                  <input matInput type="number" formControlName="sueldoHasta">
                </mat-form-field>
              </div>

              <div class="col-12">
                <mat-form-field appearance="outline" class="w-100">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput rows="4" formControlName="descripcion"></textarea>
                </mat-form-field>
              </div>
            </div>

            <div class="d-flex gap-2 mt-3">
              <button mat-raised-button color="primary" [disabled]="form.invalid">Publicar</button>
              <button mat-stroked-button type="button">Guardar borrador</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  `
})
export class OfertaFormComponent {
  areas = ['Construcción','TI','Logística','Diseño'];
  tipos  = ['Tiempo completo','Part-time','Temporal','Freelance'];

  form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      titulo:['', Validators.required],
      comuna:['', Validators.required],
      area:['', Validators.required],
      tipo:['', Validators.required],
      sueldoDesde:[null],
      sueldoHasta:[null],
      descripcion:['', [Validators.required, Validators.minLength(10)]],
    });
  }

  save() {
    if (this.form.valid) {
      console.log('Oferta enviada', this.form.value);
    }
  }
}
