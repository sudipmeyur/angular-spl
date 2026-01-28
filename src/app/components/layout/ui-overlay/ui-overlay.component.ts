import { Component, OnInit } from '@angular/core';
import { UiService, ConfirmationConfig, ToastConfig } from '../../../services/ui.service';

@Component({
  selector: 'app-ui-overlay',
  templateUrl: './ui-overlay.component.html',
  styleUrls: ['./ui-overlay.component.css']
})
export class UiOverlayComponent implements OnInit {

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

  constructor(private uiService: UiService) { }

  ngOnInit(): void {
    // Subscribe to processing state
    this.uiService.isProcessing$.subscribe(isProcessing => {
      this.isProcessing = isProcessing;
    });

    // Subscribe to processing message
    this.uiService.processingMessage$.subscribe(message => {
      this.processingMessage = message;
    });

    // Subscribe to confirmation state
    this.uiService.showConfirmation$.subscribe(show => {
      this.showConfirmation = show;
    });

    // Subscribe to confirmation config
    this.uiService.confirmationConfig$.subscribe(config => {
      this.confirmationConfig = config;
    });

    // Subscribe to toast notifications
    this.uiService.toast$.subscribe(toast => {
      this.currentToast = toast;
    });
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
    const iconMap = {
      'success': 'fas fa-check-circle',
      'error': 'fas fa-exclamation-circle',
      'info': 'fas fa-info-circle',
      'warning': 'fas fa-exclamation-triangle'
    };
    return iconMap[this.currentToast?.type || 'info'];
  }
}
