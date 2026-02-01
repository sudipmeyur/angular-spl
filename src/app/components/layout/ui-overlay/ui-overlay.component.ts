import { Component, OnInit, OnDestroy } from '@angular/core';
import { UiService, ConfirmationConfig, ToastConfig } from '../../../services/ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ui-overlay',
  templateUrl: './ui-overlay.component.html',
  styleUrls: ['./ui-overlay.component.css']
})
export class UiOverlayComponent implements OnInit, OnDestroy {

  isProcessing: boolean = false;
  processingMessage: string = 'Processing...';

  showConfirmation: boolean = false;
  confirmationConfig: ConfirmationConfig = {
    title: '',
    message: '',
    icon: 'fas fa-question-circle',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info'
  };

  currentToast: ToastConfig | null = null;

  // Subscription management
  private subscriptions: Subscription[] = [];

  constructor(private uiService: UiService) { }

  ngOnInit(): void {
    // Subscribe to processing state
    const processingSub = this.uiService.isProcessing$.subscribe(isProcessing => {
      this.isProcessing = isProcessing;
    });
    this.subscriptions.push(processingSub);

    // Subscribe to processing message
    const messageSub = this.uiService.processingMessage$.subscribe(message => {
      this.processingMessage = message;
    });
    this.subscriptions.push(messageSub);

    // Subscribe to confirmation state
    const confirmSub = this.uiService.showConfirmation$.subscribe(show => {
      this.showConfirmation = show;
    });
    this.subscriptions.push(confirmSub);

    // Subscribe to confirmation config
    const configSub = this.uiService.confirmationConfig$.subscribe(config => {
      this.confirmationConfig = config;
    });
    this.subscriptions.push(configSub);

    // Subscribe to toast notifications
    const toastSub = this.uiService.toast$.subscribe(toast => {
      console.log('UiOverlayComponent: Toast subscription received:', toast);
      this.currentToast = toast;
      if (toast) {
        console.log('UiOverlayComponent: Toast is now visible with message:', toast.message);
      } else {
        console.log('UiOverlayComponent: Toast is now hidden');
      }
    });
    this.subscriptions.push(toastSub);
  }

  confirmAction(): void {
    console.log('UiOverlayComponent.confirmAction() called');
    this.uiService.confirmAction();
  }

  cancelAction(): void {
    console.log('UiOverlayComponent.cancelAction() called');
    this.uiService.cancelAction();
  }

  getConfirmationButtonClass(): string {
    const typeMap = {
      'danger': 'btn-danger',
      'warning': 'btn-warning',
      'info': 'btn-info',
      'success': 'btn-success'
    };
    return typeMap[this.confirmationConfig.type || 'info'];
  }

  getToastClass(): string {
    const typeMap = {
      'success': 'toast-success',
      'error': 'toast-error',
      'info': 'toast-info',
      'warning': 'toast-warning'
    };
    return typeMap[this.currentToast?.type || 'info'];
  }

  getToastIcon(): string {
    if (this.currentToast?.icon) {
      return this.currentToast.icon;
    }
    
    const iconMap = {
      'success': 'fas fa-check-circle',
      'error': 'fas fa-exclamation-circle',
      'info': 'fas fa-info-circle',
      'warning': 'fas fa-exclamation-triangle'
    };
    return iconMap[this.currentToast?.type || 'info'];
  }

  closeToast(): void {
    console.log('UiOverlayComponent: closeToast() called');
    this.uiService.hideToast();
  }

  executeToastAction(): void {
    console.log('UiOverlayComponent: executeToastAction() called');
    if (this.currentToast?.action) {
      console.log('UiOverlayComponent: Executing toast action:', this.currentToast.action.text);
      this.currentToast.action.callback();
      this.closeToast();
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
