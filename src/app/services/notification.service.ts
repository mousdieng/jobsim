import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);

  get notifications() {
    return this.notifications$.asObservable();
  }

  success(message: string, duration = 5000): void {
    this.show('success', message, duration);
  }

  error(message: string, duration = 7000): void {
    this.show('error', message, duration);
  }

  warning(message: string, duration = 6000): void {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 5000): void {
    this.show('info', message, duration);
  }

  private show(type: Notification['type'], message: string, duration: number): void {
    const notification: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      duration
    };

    const current = this.notifications$.value;
    this.notifications$.next([...current, notification]);

    if (duration > 0) {
      setTimeout(() => this.remove(notification.id), duration);
    }
  }

  remove(id: string): void {
    const current = this.notifications$.value;
    this.notifications$.next(current.filter(n => n.id !== id));
  }
}
