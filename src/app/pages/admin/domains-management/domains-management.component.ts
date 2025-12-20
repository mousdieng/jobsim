import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-domains-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Domain Management</h2>
        <p class="mt-1 text-gray-600">Manage professional domains and skill categories</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Professional Domains</h3>
          <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            + Create Domain
          </button>
        </div>

        <div class="space-y-4">
          <div class="border border-gray-200 rounded-lg p-6">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900">Software Engineering</h4>
                  <p class="text-sm text-gray-600">Programming, development, and technical tasks</p>
                </div>
              </div>
              <div class="flex space-x-2">
                <button class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Edit</button>
                <button class="text-red-600 hover:text-red-900 text-sm font-medium">Archive</button>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Active Tasks:</span>
                <span class="ml-2 font-semibold text-gray-900">1,247</span>
              </div>
              <div>
                <span class="text-gray-600">Students:</span>
                <span class="ml-2 font-semibold text-gray-900">8,942</span>
              </div>
              <div>
                <span class="text-gray-600">Enterprises:</span>
                <span class="ml-2 font-semibold text-gray-900">89</span>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-6">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900">Accounting & Finance</h4>
                  <p class="text-sm text-gray-600">Financial analysis, bookkeeping, and reporting</p>
                </div>
              </div>
              <div class="flex space-x-2">
                <button class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Edit</button>
                <button class="text-red-600 hover:text-red-900 text-sm font-medium">Archive</button>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Active Tasks:</span>
                <span class="ml-2 font-semibold text-gray-900">427</span>
              </div>
              <div>
                <span class="text-gray-600">Students:</span>
                <span class="ml-2 font-semibold text-gray-900">3,241</span>
              </div>
              <div>
                <span class="text-gray-600">Enterprises:</span>
                <span class="ml-2 font-semibold text-gray-900">34</span>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-6">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900">Digital Marketing</h4>
                  <p class="text-sm text-gray-600">Social media, content, and campaign management</p>
                </div>
              </div>
              <div class="flex space-x-2">
                <button class="text-indigo-600 hover:text-indigo-900 text-sm font-medium">Edit</button>
                <button class="text-red-600 hover:text-red-900 text-sm font-medium">Archive</button>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-600">Active Tasks:</span>
                <span class="ml-2 font-semibold text-gray-900">289</span>
              </div>
              <div>
                <span class="text-gray-600">Students:</span>
                <span class="ml-2 font-semibold text-gray-900">2,187</span>
              </div>
              <div>
                <span class="text-gray-600">Enterprises:</span>
                <span class="ml-2 font-semibold text-gray-900">45</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DomainsManagementComponent {}
