import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericLoaderComponent } from './generic-loader.component';

describe('GenericLoaderComponent', () => {
  let component: GenericLoaderComponent;
  let fixture: ComponentFixture<GenericLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
