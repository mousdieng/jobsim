import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-escalations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Escalations</h2>
        <p class="mt-1 text-gray-600">Track issues escalated to Admin for review</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p class="text-sm font-medium text-gray-600">Awaiting Admin</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">3</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p class="text-sm font-medium text-gray-600">Resolved by Admin</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">18</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p class="text-sm font-medium text-gray-600">This Week</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">5</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <p class="text-sm font-medium text-gray-600">Avg Response Time</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">2.4h</p>
        </div>
      </div>

      <!-- Escalated Cases -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Escalated Cases</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalation Reason</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Escalated By</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Decision</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let escalation of escalations" [class.bg-yellow-50]="escalation.status === 'pending'">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{{ escalation.ticketId }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ escalation.issueType }}</td>
                <td class="px-6 py-4 text-sm text-gray-600 max-w-xs">{{ escalation.reason }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ escalation.escalatedBy }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ escalation.date }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="escalation.status === 'pending' ? 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800' : 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'">
                    {{ escalation.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <span *ngIf="escalation.adminDecision">{{ escalation.adminDecision }}</span>
                  <span *ngIf="!escalation.adminDecision" class="text-gray-400 italic">Awaiting decision</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Escalation History Chart -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Escalation Trends</h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p class="text-gray-500">Chart: Escalations over time by category</p>
        </div>
      </div>

      <!-- Audit Trail Notice -->
      <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700">
              All escalations are automatically logged in the audit trail. Admin decisions on escalated cases are recorded and cannot be modified by Support.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EscalationsComponent {
  escalations = [
    {
      ticketId: '#2893',
      issueType: 'Content Violation',
      reason: 'Task contains inappropriate content requiring admin review and potential removal',
      escalatedBy: 'Support Agent 1',
      date: '2 hours ago',
      status: 'pending',
      adminDecision: null
    },
    {
      ticketId: '#2871',
      issueType: 'User Ban Request',
      reason: 'Repeated violation of platform rules by enterprise user. Multiple warnings issued.',
      escalatedBy: 'Support Agent 2',
      date: '5 hours ago',
      status: 'pending',
      adminDecision: null
    },
    {
      ticketId: '#2845',
      issueType: 'Role Change',
      reason: 'Student requesting upgrade to enterprise account. Verification needed.',
      escalatedBy: 'You',
      date: '1 day ago',
      status: 'pending',
      adminDecision: null
    },
    {
      ticketId: '#2821',
      issueType: 'Content Violation',
      reason: 'Plagiarized task content reported by multiple students',
      escalatedBy: 'Support Agent 1',
      date: '2 days ago',
      status: 'resolved',
      adminDecision: 'Task removed, enterprise warned'
    },
    {
      ticketId: '#2798',
      issueType: 'Technical Issue',
      reason: 'System-wide configuration change needed to resolve recurring error',
      escalatedBy: 'You',
      date: '3 days ago',
      status: 'resolved',
      adminDecision: 'Configuration updated, issue fixed'
    }
  ];
}
