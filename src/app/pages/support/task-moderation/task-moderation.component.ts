import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Task Moderation</h2>
        <p class="mt-1 text-gray-600">Review and moderate reported tasks (limited scope)</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option>All Tasks</option>
              <option>Flagged for Review</option>
              <option>Pending Admin</option>
              <option>Cleared</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option>All Reasons</option>
              <option>Inappropriate Content</option>
              <option>Quality Concern</option>
              <option>Policy Violation</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search tasks..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Reported Tasks -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Reported Tasks</h3>
          <span class="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">5 pending review</span>
        </div>
        <div class="divide-y divide-gray-200">
          <div *ngFor="let task of reportedTasks" class="p-6 hover:bg-gray-50">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <h4 class="text-lg font-semibold text-gray-900">{{ task.title }}</h4>
                  <span [class]="task.severity === 'high' ? 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800' : 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'">
                    {{ task.severity }} severity
                  </span>
                </div>
                <div class="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span class="text-gray-600">Created by:</span>
                    <span class="ml-2 font-medium text-gray-900">{{ task.createdBy }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Domain:</span>
                    <span class="ml-2 font-medium text-gray-900">{{ task.domain }}</span>
                  </div>
                  <div>
                    <span class="text-gray-600">Reported:</span>
                    <span class="ml-2 font-medium text-gray-900">{{ task.reportedDate }}</span>
                  </div>
                </div>
                <div class="mt-3 bg-red-50 border-l-4 border-red-400 p-3">
                  <p class="text-sm text-red-800"><strong>Reason:</strong> {{ task.reportReason }}</p>
                  <p class="text-sm text-red-700 mt-1">{{ task.reportDetails }}</p>
                </div>
                <div class="mt-3 text-sm text-gray-700">
                  <p><strong>Task Description:</strong></p>
                  <p class="mt-1">{{ task.description }}</p>
                </div>
              </div>
            </div>
            <div class="mt-4 flex items-center space-x-3">
              <button class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Escalate to Admin
              </button>
              <button class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Hide Temporarily
              </button>
              <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Restrictions Notice -->
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Support Moderation Restrictions</h3>
            <div class="mt-2 text-sm text-yellow-700">
              <ul class="list-disc list-inside space-y-1">
                <li>Cannot edit task core content</li>
                <li>Cannot permanently delete tasks</li>
                <li>Cannot approve enterprise-created tasks without Admin rules</li>
                <li>Can only temporarily hide tasks pending Admin review</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TaskModerationComponent {
  reportedTasks = [
    {
      title: 'Build a REST API with Authentication',
      createdBy: 'TechCorp Senegal',
      domain: 'Software Engineering',
      reportedDate: '2 hours ago',
      severity: 'high',
      reportReason: 'Inappropriate Content',
      reportDetails: 'Task contains language that may be offensive or inappropriate for platform standards.',
      description: 'Create a REST API using Node.js with JWT authentication...'
    },
    {
      title: 'Financial Report Analysis',
      createdBy: 'Finance Solutions SN',
      domain: 'Accounting',
      reportedDate: '5 hours ago',
      severity: 'medium',
      reportReason: 'Quality Concern',
      reportDetails: 'Instructions are unclear and may confuse students.',
      description: 'Analyze the provided financial statements and create a summary report...'
    },
    {
      title: 'Social Media Campaign Strategy',
      createdBy: 'Marketing Pro',
      domain: 'Digital Marketing',
      reportedDate: '1 day ago',
      severity: 'high',
      reportReason: 'Policy Violation',
      reportDetails: 'Task asks students to work with real client data without proper authorization.',
      description: 'Develop a comprehensive social media strategy for our client...'
    }
  ];
}
