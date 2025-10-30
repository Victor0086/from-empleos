import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentosUploadComponent } from './documentos-upload.component';

describe('DocumentosUploadComponent', () => {
  let component: DocumentosUploadComponent;
  let fixture: ComponentFixture<DocumentosUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentosUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentosUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
