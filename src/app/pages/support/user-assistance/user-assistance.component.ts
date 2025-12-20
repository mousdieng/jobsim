import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-assistance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">User Assistance</h2>
        <p class="mt-1 text-gray-600">Search and assist platform users (read-only access)</p>
      </div>

      <!-- Search -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by name, email, or ID..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select [(ngModel)]="filterRole" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Users List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Users</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of mockUsers" class="hover:bg-gray-50">
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                      {{ user.name.charAt(0) }}
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-gray-900">{{ user.name }}</p>
                      <p class="text-xs text-gray-500">{{ user.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getRoleBadgeClass(user.role)">{{ user.role }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.domain }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="user.status === 'active' ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800' : 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'">
                    {{ user.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ user.joinedDate }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <button (click)="viewUserDetails(user)" class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                  <button class="text-green-600 hover:text-green-900">Quick Actions</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- User Detail Modal -->
      <div *ngIf="selectedUser" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 class="text-xl font-bold text-gray-900">User Details (Read-Only)</h3>
            <button (click)="selectedUser = null" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
            <!-- Profile Info -->
            <div class="flex items-center space-x-4 pb-6 border-b">
              <div class="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl">
                {{ selectedUser.name.charAt(0) }}
              </div>
              <div>
                <h4 class="text-2xl font-bold text-gray-900">{{ selectedUser.name }}</h4>
                <p class="text-gray-600">{{ selectedUser.email }}</p>
                <span [class]="getRoleBadgeClass(selectedUser.role)">{{ selectedUser.role }}</span>
              </div>
            </div>

            <!-- Account Info -->
            <div class="grid grid-cols-2 gap-6">
              <div>
                <p class="text-sm text-gray-600">User ID</p>
                <p class="font-medium text-gray-900">{{ selectedUser.id }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Status</p>
                <span [class]="selectedUser.status === 'active' ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800' : 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'">
                  {{ selectedUser.status }}
                </span>
              </div>
              <div>
                <p class="text-sm text-gray-600">Domain</p>
                <p class="font-medium text-gray-900">{{ selectedUser.domain }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Joined Date</p>
                <p class="font-medium text-gray-900">{{ selectedUser.joinedDate }}</p>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="border-t pt-6">
              <h4 class="font-semibold text-gray-900 mb-4">Available Actions</h4>
              <div class="space-y-2">
                <button class="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Resend Verification Email
                </button>
                <button class="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Send Password Reset Link
                </button>
                <button class="w-full px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Activity History
                </button>
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
                  <p class="text-sm text-yellow-700">
                    <strong>Support Restrictions:</strong> You cannot change user roles, delete accounts, or access sensitive credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button (click)="selectedUser = null" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserAssistanceComponent {
  searchQuery = '';
  filterRole = '';
  selectedUser: any = null;

  mockUsers = [
    { id: 'USR-001', name: 'Fatou Diop', email: 'fatou.diop@email.com', role: 'student', domain: 'Software Engineering', status: 'active', joinedDate: 'Jan 15, 2025' },
    { id: 'USR-002', name: 'Amadou Ba', email: 'amadou.ba@email.com', role: 'student', domain: 'Accounting', status: 'active', joinedDate: 'Jan 20, 2025' },
    { id: 'ENT-001', name: 'Orange Senegal', email: 'hr@orange.sn', role: 'enterprise', domain: 'All Domains', status: 'active', joinedDate: 'Dec 10, 2024' },
    { id: 'USR-003', name: 'Mariama Sall', email: 'mariama.sall@email.com', role: 'student', domain: 'Digital Marketing', status: 'active', joinedDate: 'Feb 1, 2025' }
  ];

  viewUserDetails(user: any): void {
    this.selectedUser = user;
  }

  getRoleBadgeClass(role: string): string {
    const classes: { [key: string]: string } = {
      'student': 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
      'enterprise': 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
    };
    return classes[role] || classes['student'];
  }
}
