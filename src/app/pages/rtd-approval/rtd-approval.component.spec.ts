import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RtdApprovalComponent } from './rtd-approval.component';

describe('RtdApprovalComponent', () => {
  let component: RtdApprovalComponent;
  let fixture: ComponentFixture<RtdApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RtdApprovalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RtdApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
