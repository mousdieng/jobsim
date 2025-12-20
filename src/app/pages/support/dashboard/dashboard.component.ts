import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-support-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Support Dashboard</h2>
        <p class="mt-1 text-gray-600">Monitor tickets and operational metrics</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Open Tickets</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">12</p>
              <p class="text-sm text-red-600 mt-1">Requires attention</p>
            </div>
            <div class="bg-red-100 rounded-full p-3">
              <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">In Progress</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">7</p>
              <p class="text-sm text-yellow-600 mt-1">Being handled</p>
            </div>
            <div class="bg-yellow-100 rounded-full p-3">
              <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Resolved Today</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">34</p>
              <p class="text-sm text-green-600 mt-1">+12% from yesterday</p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">18m</p>
              <p class="text-sm text-purple-600 mt-1">-5m improvement</p>
            </div>
            <div class="bg-purple-100 rounded-full p-3">
              <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket Type Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Tickets by Type</h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span class="ml-3 text-sm font-medium text-gray-700">Student Issues</span>
              </div>
              <span class="text-lg font-bold text-gray-900">8</span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span class="ml-3 text-sm font-medium text-gray-700">Enterprise Issues</span>
              </div>
              <span class="text-lg font-bold text-gray-900">4</span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span class="ml-3 text-sm font-medium text-gray-700">Technical Issues</span>
              </div>
              <span class="text-lg font-bold text-gray-900">5</span>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
                <span class="ml-3 text-sm font-medium text-gray-700">Content Moderation</span>
              </div>
              <span class="text-lg font-bold text-gray-900">2</span>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">Ticket #2847 resolved</p>
                  <p class="text-xs text-gray-500">Student submission error - 5 minutes ago</p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">New ticket assigned</p>
                  <p class="text-xs text-gray-500">Enterprise onboarding help - 12 minutes ago</p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">Escalated to Admin</p>
                  <p class="text-xs text-gray-500">Task content violation - 28 minutes ago</p>
                </div>
              </div>

              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">Ticket updated</p>
                  <p class="text-xs text-gray-500">Technical issue - additional info provided - 1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Escalated Cases -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Escalated Cases Awaiting Admin Action</h3>
          <span class="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">3 pending</span>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalation Reason</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalated On</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">#2893</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Content Violation</td>
                <td class="px-6 py-4 text-sm text-gray-500">Task contains inappropriate content requiring admin review</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Awaiting Admin</span></td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">#2871</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">User Ban Request</td>
                <td class="px-6 py-4 text-sm text-gray-500">Repeated violation of platform rules by enterprise user</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5 hours ago</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Awaiting Admin</span></td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">#2845</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Role Change Request</td>
                <td class="px-6 py-4 text-sm text-gray-500">Student requesting upgrade to enterprise account</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 day ago</td>
                <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Awaiting Admin</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a routerLink="/support/tickets" class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-100">Quick Action</p>
              <p class="text-xl font-bold mt-1">View All Tickets</p>
            </div>
            <svg class="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>

        <a routerLink="/support/knowledge" class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-100">Resources</p>
              <p class="text-xl font-bold mt-1">Knowledge Base</p>
            </div>
            <svg class="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>

        <a routerLink="/support/escalations" class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-purple-100">Critical</p>
              <p class="text-xl font-bold mt-1">Escalations</p>
            </div>
            <svg class="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      </div>
    </div>
  `
})
export class SupportDashboardComponent {}
