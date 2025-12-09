import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisContratosComponent } from './mis-contratos.component';

describe('MisContratosComponent', () => {
  let component: MisContratosComponent;
  let fixture: ComponentFixture<MisContratosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisContratosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisContratosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
