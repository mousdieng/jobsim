import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center">
        <!-- Lock Icon -->
        <div class="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100">
          <svg class="h-12 w-12 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <!-- Error Message -->
        <h1 class="mt-6 text-4xl font-extrabold text-gray-900">
          Access Denied
        </h1>
        <p class="mt-2 text-base text-gray-600">
          You don't have permission to access this page.
        </p>

        <!-- User Info -->
        <div *ngIf="user" class="mt-4 p-4 bg-yellow-50 rounded-lg">
          <p class="text-sm text-yellow-800">
            You are logged in as <strong>{{ user.name }}</strong>
            <span class="block text-xs mt-1">Role: {{ getUserRole() }}</span>
          </p>
        </div>

        <!-- Actions -->
        <div class="mt-6 space-y-3">
          <button
            (click)="goBack()"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go Back
          </button>
          <a
            routerLink="/app/dashboard"
            class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Home
          </a>
          <button
            *ngIf="user"
            (click)="logout()"
            class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Sign Out
          </button>
        </div>

        <!-- Help Text -->
        <p class="mt-6 text-xs text-gray-500">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class UnauthorizedComponent {
  user: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.user = this.authService.getCurrentUser();
  }

  goBack(): void {
    window.history.back();
  }

  getUserRole(): string {
    if (!this.user) return 'Unknown';
    return this.user.user_type || 'Student';
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}
