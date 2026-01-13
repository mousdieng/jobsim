import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <div
        *ngFor="let notification of notifications"
        [@slideIn]
        class="rounded-lg shadow-lg p-4 flex items-start space-x-3 transition-all duration-300"
        [ngClass]="{
          'bg-green-50 border border-green-200': notification.type === 'success',
          'bg-red-50 border border-red-200': notification.type === 'error',
          'bg-yellow-50 border border-yellow-200': notification.type === 'warning',
          'bg-blue-50 border border-blue-200': notification.type === 'info'
        }"
      >
        <!-- Icon -->
        <div class="flex-shrink-0">
          <!-- Success Icon -->
          <svg
            *ngIf="notification.type === 'success'"
            class="h-5 w-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>

          <!-- Error Icon -->
          <svg
            *ngIf="notification.type === 'error'"
            class="h-5 w-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>

          <!-- Warning Icon -->
          <svg
            *ngIf="notification.type === 'warning'"
            class="h-5 w-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            ></path>
          </svg>

          <!-- Info Icon -->
          <svg
            *ngIf="notification.type === 'info'"
            class="h-5 w-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>

        <!-- Message -->
        <div class="flex-1">
          <p
            class="text-sm font-medium"
            [ngClass]="{
              'text-green-800': notification.type === 'success',
              'text-red-800': notification.type === 'error',
              'text-yellow-800': notification.type === 'warning',
              'text-blue-800': notification.type === 'info'
            }"
          >
            {{ notification.message }}
          </p>
        </div>

        <!-- Close Button -->
        <button
          (click)="close(notification.id)"
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    :host ::ng-deep div[class*="bg-"] {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class NotificationToastComponent {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {
    this.notificationService.notifications.subscribe(
      notifications => this.notifications = notifications
    );
  }

  close(id: string): void {
    this.notificationService.remove(id);
  }
}
