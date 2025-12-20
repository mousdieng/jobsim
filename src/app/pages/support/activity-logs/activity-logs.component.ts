import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Activity Logs</h2>
        <p class="mt-1 text-gray-600">View support activity and audit trail (read-only)</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
            <select [(ngModel)]="filterAction" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Actions</option>
              <option value="ticket_created">Ticket Created</option>
              <option value="ticket_updated">Ticket Updated</option>
              <option value="ticket_resolved">Ticket Resolved</option>
              <option value="escalation">Escalation</option>
              <option value="admin_decision">Admin Decision</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <select [(ngModel)]="filterAgent" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Agents</option>
              <option value="you">You</option>
              <option value="agent1">Support Agent 1</option>
              <option value="agent2">Support Agent 2</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Custom</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search logs..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Activity Timeline -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Activity Timeline</h3>
        </div>
        <div class="p-6">
          <div class="flow-root">
            <ul class="-mb-8">
              <li *ngFor="let log of activityLogs; let last = last">
                <div class="relative pb-8">
                  <span *ngIf="!last" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div class="relative flex space-x-3">
                    <div>
                      <span [class]="getActionIconClass(log.action)">
                        <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path *ngIf="log.action === 'ticket_created'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                          <path *ngIf="log.action === 'ticket_updated'" fill-rule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clip-rule="evenodd" />
                          <path *ngIf="log.action === 'ticket_resolved'" fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                          <path *ngIf="log.action === 'escalation'" fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                          <path *ngIf="log.action === 'admin_decision'" fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p class="text-sm text-gray-900">
                          <span class="font-medium">{{ log.agent }}</span> {{ log.description }}
                          <span class="font-medium text-blue-600">{{ log.target }}</span>
                        </p>
                        <p *ngIf="log.details" class="mt-1 text-sm text-gray-600">{{ log.details }}</p>
                      </div>
                      <div class="text-right text-sm whitespace-nowrap text-gray-500">
                        {{ log.timestamp }}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Read-Only Notice -->
      <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700">
              <strong>Read-Only Access:</strong> Activity logs are for reference only. Support agents can view logs related to tickets they handled and Admin decisions on escalated cases.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ActivityLogsComponent {
  filterAction = '';
  filterAgent = '';
  searchQuery = '';

  activityLogs = [
    {
      action: 'ticket_resolved',
      agent: 'You',
      description: 'resolved ticket',
      target: '#2901',
      details: 'Student submission issue fixed - cleared browser cache',
      timestamp: '5 min ago'
    },
    {
      action: 'escalation',
      agent: 'You',
      description: 'escalated ticket',
      target: '#2893',
      details: 'Inappropriate content - requires Admin review',
      timestamp: '2 hours ago'
    },
    {
      action: 'admin_decision',
      agent: 'Admin',
      description: 'made decision on escalated case',
      target: '#2821',
      details: 'Decision: Task removed, enterprise account warned',
      timestamp: '2 days ago'
    },
    {
      action: 'ticket_updated',
      agent: 'Support Agent 1',
      description: 'updated ticket',
      target: '#2895',
      details: 'Status changed to In Progress',
      timestamp: '3 hours ago'
    },
    {
      action: 'ticket_created',
      agent: 'You',
      description: 'created ticket',
      target: '#2905',
      details: 'Enterprise onboarding assistance request',
      timestamp: '4 hours ago'
    },
    {
      action: 'ticket_resolved',
      agent: 'Support Agent 2',
      description: 'resolved ticket',
      target: '#2887',
      details: 'Technical issue - browser compatibility fixed',
      timestamp: '5 hours ago'
    },
    {
      action: 'escalation',
      agent: 'Support Agent 1',
      description: 'escalated ticket',
      target: '#2871',
      details: 'User ban request - repeated policy violations',
      timestamp: '6 hours ago'
    }
  ];

  getActionIconClass(action: string): string {
    const classes: { [key: string]: string } = {
      'ticket_created': 'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-blue-500',
      'ticket_updated': 'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-yellow-500',
      'ticket_resolved': 'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-green-500',
      'escalation': 'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-purple-500',
      'admin_decision': 'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-indigo-500'
    };
    return classes[action] || classes['ticket_created'];
  }
}
