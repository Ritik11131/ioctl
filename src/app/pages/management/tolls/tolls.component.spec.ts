import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TollsComponent } from './tolls.component';

describe('TollsComponent', () => {
  let component: TollsComponent;
  let fixture: ComponentFixture<TollsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TollsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TollsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
