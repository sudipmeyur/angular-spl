import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ConfirmationConfig {
  title: string;
  message: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

export interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  title?: string;
  icon?: string;
  action?: {
    text: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UiService {

  // Loading/Processing state
  private isProcessingSubject = new BehaviorSubject<boolean>(false);
  public isProcessing$ = this.isProcessingSubject.asObservable();

  private processingMessageSubject = new BehaviorSubject<string>('Processing...');
  public processingMessage$ = this.processingMessageSubject.asObservable();

  // Confirmation modal state
  private showConfirmationSubject = new BehaviorSubject<boolean>(false);
  public showConfirmation$ = this.showConfirmationSubject.asObservable();

  private confirmationConfigSubject = new BehaviorSubject<ConfirmationConfig>({
    title: '',
    message: '',
    icon: 'fas fa-question-circle',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'info'
  });
  public confirmationConfig$ = this.confirmationConfigSubject.asObservable();

  private confirmationCallbackSubject = new BehaviorSubject<(() => void) | null>(null);
  private confirmationCancelCallbackSubject = new BehaviorSubject<(() => void) | null>(null);

  // Toast notifications state
  private toastSubject = new BehaviorSubject<ToastConfig | null>(null);
  public toast$ = this.toastSubject.asObservable();

  private toastQueueSubject = new BehaviorSubject<ToastConfig[]>([]);
  public toastQueue$ = this.toastQueueSubject.asObservable();

  private toastTimeoutId: any = null;

  constructor() { }

  // ==================== PROCESSING LOADER ====================
  
  /**
   * Show full-screen processing loader
   * @param message Optional message to display
   */
  showProcessing(message: string = 'Processing...'): void {
    this.processingMessageSubject.next(message);
    this.isProcessingSubject.next(true);
  }

  /**
   * Hide processing loader
   */
  hideProcessing(): void {
    this.isProcessingSubject.next(false);
  }

  /**
   * Update processing message
   */
  updateProcessingMessage(message: string): void {
    this.processingMessageSubject.next(message);
  }

  /**
   * Check if processing is active
   */
  isProcessingActive(): boolean {
    return this.isProcessingSubject.value;
  }

  // ==================== CONFIRMATION MODAL ====================

  /**
   * Show confirmation dialog
   * @param config Confirmation configuration
   * @param onConfirm Callback when user confirms
   * @param onCancel Optional callback when user cancels
   */
  showConfirmation(
    config: ConfirmationConfig,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    // Set defaults
    const finalConfig: ConfirmationConfig = {
      icon: 'fas fa-question-circle',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      type: 'info',
      ...config
    };

    console.log('showConfirmation called with config:', finalConfig);
    console.log('Callback function:', onConfirm);

    this.confirmationConfigSubject.next(finalConfig);
    this.confirmationCallbackSubject.next(onConfirm);
    this.confirmationCancelCallbackSubject.next(onCancel || null);
    this.showConfirmationSubject.next(true);
  }

  /**
   * Confirm action - called from template
   */
  confirmAction(): void {
    const callback = this.confirmationCallbackSubject.value;
    console.log('confirmAction called, callback exists:', !!callback);
    this.hideConfirmation();
    if (callback) {
      console.log('Executing confirmation callback');
      callback();
    } else {
      console.warn('No callback found for confirmation action');
    }
  }

  /**
   * Cancel action - called from template
   */
  cancelAction(): void {
    const callback = this.confirmationCancelCallbackSubject.value;
    this.hideConfirmation();
    if (callback) {
      callback();
    }
  }

  /**
   * Hide confirmation dialog
   */
  hideConfirmation(): void {
    this.showConfirmationSubject.next(false);
    this.confirmationCallbackSubject.next(null);
    this.confirmationCancelCallbackSubject.next(null);
  }

  /**
   * Get current confirmation config
   */
  getConfirmationConfig(): ConfirmationConfig {
    return this.confirmationConfigSubject.value;
  }

  // ==================== TOAST NOTIFICATIONS ====================

  /**
   * Show success toast
   */
  showSuccess(message: string, duration: number = 4000, title?: string): void {
    this.showToast({
      message,
      type: 'success',
      duration,
      title,
      icon: 'fas fa-check-circle'
    });
  }

  /**
   * Show error toast
   */
  showError(message: string, duration: number = 6000, title?: string): void {
    console.log('UiService.showError called:', { message, duration, title });
    this.showToast({
      message,
      type: 'error',
      duration,
      title,
      icon: 'fas fa-exclamation-circle'
    });
  }

  /**
   * Show info toast
   */
  showInfo(message: string, duration: number = 4000, title?: string): void {
    this.showToast({
      message,
      type: 'info',
      duration,
      title,
      icon: 'fas fa-info-circle'
    });
  }

  /**
   * Show warning toast
   */
  showWarning(message: string, duration: number = 5000, title?: string): void {
    this.showToast({
      message,
      type: 'warning',
      duration,
      title,
      icon: 'fas fa-exclamation-triangle'
    });
  }

  /**
   * Show toast with action button
   */
  showToastWithAction(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
    actionText: string,
    actionCallback: () => void,
    duration: number = 8000,
    title?: string
  ): void {
    console.log('UiService.showToastWithAction called:', { message, type, actionText, duration, title });
    
    const iconMap = {
      'success': 'fas fa-check-circle',
      'error': 'fas fa-exclamation-circle',
      'info': 'fas fa-info-circle',
      'warning': 'fas fa-exclamation-triangle'
    };

    this.showToast({
      message,
      type,
      duration,
      title,
      icon: iconMap[type],
      action: {
        text: actionText,
        callback: actionCallback
      }
    });
  }

  /**
   * Show generic toast
   */
  private showToast(config: ToastConfig): void {
    console.log('UiService.showToast called with config:', config);
    
    // Clear existing timeout
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }

    // Set default duration
    const duration = config.duration || 5000;
    console.log('Toast duration set to:', duration);

    // Show toast
    this.toastSubject.next(config);
    console.log('Toast subject updated, current value:', this.toastSubject.value);

    // Auto-hide after duration
    this.toastTimeoutId = setTimeout(() => {
      console.log('Auto-hiding toast after', duration, 'ms');
      this.hideToast();
    }, duration);
  }

  /**
   * Hide current toast
   */
  hideToast(): void {
    this.toastSubject.next(null);
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  /**
   * Get current toast
   */
  getCurrentToast(): ToastConfig | null {
    return this.toastSubject.value;
  }

  // ==================== ALERT DIALOG ====================

  /**
   * Show alert dialog (simple confirmation)
   */
  showAlert(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    onClose?: () => void
  ): void {
    const iconMap = {
      'info': 'fas fa-info-circle',
      'success': 'fas fa-check-circle',
      'warning': 'fas fa-exclamation-triangle',
      'error': 'fas fa-exclamation-circle'
    };

    this.showConfirmation(
      {
        title,
        message,
        icon: iconMap[type],
        confirmText: 'OK',
        cancelText: '',
        type: type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type
      },
      onClose || (() => { })
    );
  }

  // ==================== COMBINED OPERATIONS ====================

  /**
   * Execute operation with processing loader
   * Automatically shows/hides processing loader
   */
  executeWithLoader<T>(
    operation: () => Promise<T>,
    message: string = 'Processing...'
  ): Promise<T> {
    this.showProcessing(message);
    return operation()
      .then(result => {
        this.hideProcessing();
        return result;
      })
      .catch(error => {
        this.hideProcessing();
        throw error;
      });
  }

  /**
   * Execute operation with confirmation
   * Shows confirmation dialog before executing operation
   */
  executeWithConfirmation(
    confirmConfig: ConfirmationConfig,
    operation: () => Promise<void> | void,
    showLoader: boolean = true,
    loaderMessage: string = 'Processing...'
  ): void {
    this.showConfirmation(
      confirmConfig,
      () => {
        if (showLoader) {
          this.showProcessing(loaderMessage);
        }

        try {
          const result = operation();
          if (result instanceof Promise) {
            result
              .then(() => {
                if (showLoader) {
                  this.hideProcessing();
                }
              })
              .catch(error => {
                if (showLoader) {
                  this.hideProcessing();
                }
                console.error('Operation failed:', error);
              });
          } else {
            if (showLoader) {
              this.hideProcessing();
            }
          }
        } catch (error) {
          if (showLoader) {
            this.hideProcessing();
          }
          console.error('Operation failed:', error);
        }
      }
    );
  }

  /**
   * Show success message with optional action
   */
  showSuccessWithAction(
    message: string,
    actionText: string = 'OK',
    onAction?: () => void
  ): void {
    this.showAlert('Success', message, 'success', onAction);
  }

  /**
   * Show error message with optional action
   */
  showErrorWithAction(
    message: string,
    actionText: string = 'OK',
    onAction?: () => void
  ): void {
    this.showAlert('Error', message, 'error', onAction);
  }
}
