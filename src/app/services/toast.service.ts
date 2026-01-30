import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastData | null>(null);
  public toast$ = this.toastSubject.asObservable();

  showSuccess(message: string): void {
    this.toastSubject.next({ message, type: 'success' });
  }

  showError(message: string): void {
    this.toastSubject.next({ message, type: 'error' });
  }

  showWarning(message: string): void {
    this.toastSubject.next({ message, type: 'warning' });
  }

  showInfo(message: string): void {
    this.toastSubject.next({ message, type: 'info' });
  }

  hide(): void {
    this.toastSubject.next(null);
  }
}