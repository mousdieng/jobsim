import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center">
        <!-- 404 Icon -->
        <div class="mx-auto">
          <h1 class="text-9xl font-extrabold text-indigo-600">404</h1>
        </div>

        <!-- Error Message -->
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Page Not Found
        </h2>
        <p class="mt-2 text-base text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>

        <!-- Search Suggestions -->
        <div class="mt-6 text-left bg-gray-100 rounded-lg p-4">
          <p class="text-sm font-medium text-gray-700 mb-2">You might want to:</p>
          <ul class="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Check the URL for typos</li>
            <li>Go back to the previous page</li>
            <li>Start from the home page</li>
          </ul>
        </div>

        <!-- Actions -->
        <div class="mt-6 space-y-3">
          <a
            routerLink="/app/dashboard"
            class="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Home
          </a>
          <button
            (click)="goBack()"
            class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go Back
          </button>
        </div>

        <!-- Popular Links -->
        <div class="mt-8">
          <p class="text-sm font-medium text-gray-700 mb-3">Popular Pages</p>
          <div class="flex flex-wrap gap-2 justify-center">
            <a routerLink="/app/dashboard" class="text-xs px-3 py-1 bg-white rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">
              Home
            </a>
            <a routerLink="/app/tasks" class="text-xs px-3 py-1 bg-white rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">
              Tasks
            </a>
            <a routerLink="/app/profile" class="text-xs px-3 py-1 bg-white rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50">
              Profile
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class NotFoundComponent {
  goBack(): void {
    window.history.back();
  }
}
