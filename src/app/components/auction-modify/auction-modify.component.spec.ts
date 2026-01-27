import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuctionModifyComponent } from './auction-modify.component';

describe('AuctionModifyComponent', () => {
  let component: AuctionModifyComponent;
  let fixture: ComponentFixture<AuctionModifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AuctionModifyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuctionModifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
