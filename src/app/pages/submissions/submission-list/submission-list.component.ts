import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-submission-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 class="text-2xl font-semibold text-gray-900">My Submissions</h1>
        <p class="mt-2 text-sm text-gray-700">
          View and manage all your task submissions
        </p>
      </div>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div class="py-4">
          <div class="text-center py-12">
            <p class="text-gray-500">Submissions list coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SubmissionListComponent {}
