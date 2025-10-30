import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfertasListComponent } from './ofertas-list.component';

describe('OfertasListComponent', () => {
  let component: OfertasListComponent;
  let fixture: ComponentFixture<OfertasListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfertasListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfertasListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
