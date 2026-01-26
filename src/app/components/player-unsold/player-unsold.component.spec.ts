import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerUnsoldComponent } from './player-unsold.component';

describe('PlayerUnsoldComponent', () => {
  let component: PlayerUnsoldComponent;
  let fixture: ComponentFixture<PlayerUnsoldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerUnsoldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerUnsoldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
