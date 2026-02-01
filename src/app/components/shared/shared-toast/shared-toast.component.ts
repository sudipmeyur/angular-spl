import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastService, ToastData } from '../../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-shared-toast',
  template: `
    <div *ngIf="currentToast" class="custom-toast">
      <div class="toast-content">
        <div class="toast-icon">
          <i class="fas" 
             [class.fa-check-circle]="currentToast.type === 'success'" 
             [class.fa-exclamation-circle]="currentToast.type === 'error'"
             [class.fa-exclamation-triangle]="currentToast.type === 'warning'"
             [class.fa-info-circle]="currentToast.type === 'info'"></i>
        </div>
        <div class="toast-message">
          <p>{{currentToast.message}}</p>
        </div>
        <button (click)="hideToast()" class="toast-close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./shared-toast.component.css']
})
export class SharedToastComponent implements OnInit, OnDestroy {
  currentToast: ToastData | null = null;

  // Subscription management
  private subscription: Subscription | null = null;

  constructor(private toastService: ToastService) { }

  ngOnInit(): void {
    this.subscription = this.toastService.toast$.subscribe(toast => {
      this.currentToast = toast;
    });
  }

  hideToast(): void {
    this.toastService.hide();
  }

  ngOnDestroy(): void {
    // Unsubscribe from subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}