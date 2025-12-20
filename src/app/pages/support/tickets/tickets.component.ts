import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Ticket {
  id: string;
  type: string;
  subject: string;
  user: string;
  userRole: string;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  assignedTo?: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  from: string;
  message: string;
  timestamp: string;
  isSupport: boolean;
}

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Ticket Management</h2>
          <p class="mt-1 text-gray-600">Handle support tickets and user inquiries</p>
        </div>
        <button
          (click)="showNewTicketModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select [(ngModel)]="filterStatus" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select [(ngModel)]="filterType" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Types</option>
              <option value="student">Student Issue</option>
              <option value="enterprise">Enterprise Issue</option>
              <option value="technical">Technical</option>
              <option value="content">Content Moderation</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select [(ngModel)]="filterPriority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search tickets..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Tickets List -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let ticket of mockTickets" class="hover:bg-gray-50 cursor-pointer" (click)="selectTicket(ticket)">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{{ ticket.id }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ ticket.subject }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>{{ ticket.user }}</div>
                  <div class="text-xs text-gray-400">{{ ticket.userRole }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ ticket.type }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getPriorityClass(ticket.priority)">{{ ticket.priority }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="getStatusClass(ticket.status)">{{ ticket.status.replace('_', ' ') }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ ticket.createdAt }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button (click)="selectTicket(ticket); $event.stopPropagation()" class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                  <button (click)="escalateTicket(ticket); $event.stopPropagation()" class="text-purple-600 hover:text-purple-900">Escalate</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ticket Detail Modal -->
      <div *ngIf="selectedTicket" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 class="text-xl font-bold text-gray-900">Ticket {{ selectedTicket.id }}</h3>
              <p class="text-sm text-gray-600">{{ selectedTicket.subject }}</p>
            </div>
            <button (click)="selectedTicket = null" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Ticket Info -->
            <div class="grid grid-cols-2 gap-4 pb-6 border-b border-gray-200">
              <div>
                <p class="text-sm text-gray-600">User</p>
                <p class="font-medium text-gray-900">{{ selectedTicket.user }}</p>
                <p class="text-xs text-gray-500">{{ selectedTicket.userRole }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Status</p>
                <span [class]="getStatusClass(selectedTicket.status)">{{ selectedTicket.status.replace('_', ' ') }}</span>
              </div>
              <div>
                <p class="text-sm text-gray-600">Priority</p>
                <span [class]="getPriorityClass(selectedTicket.priority)">{{ selectedTicket.priority }}</span>
              </div>
              <div>
                <p class="text-sm text-gray-600">Created</p>
                <p class="font-medium text-gray-900">{{ selectedTicket.createdAt }}</p>
              </div>
            </div>

            <!-- Messages -->
            <div class="space-y-4">
              <h4 class="font-semibold text-gray-900">Conversation</h4>
              <div *ngFor="let message of selectedTicket.messages" [class]="message.isSupport ? 'flex justify-end' : 'flex justify-start'">
                <div [class]="message.isSupport ? 'bg-blue-100 rounded-lg p-4 max-w-md' : 'bg-gray-100 rounded-lg p-4 max-w-md'">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-medium text-gray-900">{{ message.from }}</p>
                    <p class="text-xs text-gray-500">{{ message.timestamp }}</p>
                  </div>
                  <p class="text-sm text-gray-700">{{ message.message }}</p>
                </div>
              </div>
            </div>

            <!-- Reply Form -->
            <div class="border-t border-gray-200 pt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Reply to Ticket</label>
              <textarea
                [(ngModel)]="replyMessage"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type your response..."
              ></textarea>
              <div class="mt-2 flex items-center space-x-2">
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Send Reply
                </button>
                <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Add Internal Note
                </button>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div class="flex space-x-2">
              <button (click)="updateTicketStatus('in_progress')" class="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">Mark In Progress</button>
              <button (click)="updateTicketStatus('resolved')" class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Mark Resolved</button>
              <button (click)="showEscalationModal = true" class="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">Escalate to Admin</button>
            </div>
            <button (click)="selectedTicket = null" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>

      <!-- Escalation Modal -->
      <div *ngIf="showEscalationModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-bold text-gray-900">Escalate to Admin</h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Escalation Reason *</label>
              <textarea
                [(ngModel)]="escalationReason"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                placeholder="Explain why this ticket requires Admin attention..."
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">Minimum 20 characters required</p>
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2">
            <button (click)="showEscalationModal = false" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
            <button (click)="confirmEscalation()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Escalate</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TicketsComponent {
  filterStatus = '';
  filterType = '';
  filterPriority = '';
  searchQuery = '';
  selectedTicket: Ticket | null = null;
  showEscalationModal = false;
  showNewTicketModal = false;
  escalationReason = '';
  replyMessage = '';

  mockTickets: Ticket[] = [
    {
      id: '#2901',
      type: 'Student Issue',
      subject: 'Cannot submit completed task',
      user: 'Fatou Diop',
      userRole: 'Student',
      status: 'open',
      priority: 'high',
      createdAt: '10 min ago',
      messages: [
        { from: 'Fatou Diop', message: 'I completed the task but the submit button is not working.', timestamp: '10 min ago', isSupport: false }
      ]
    },
    {
      id: '#2895',
      type: 'Enterprise Issue',
      subject: 'Need help with task creation',
      user: 'Orange Senegal',
      userRole: 'Enterprise',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2 hours ago',
      assignedTo: 'You',
      messages: [
        { from: 'Orange Senegal', message: 'How do we create tasks for multiple domains?', timestamp: '2 hours ago', isSupport: false },
        { from: 'Support Agent', message: 'I can help with that. Let me guide you through the process.', timestamp: '1 hour ago', isSupport: true }
      ]
    },
    {
      id: '#2893',
      type: 'Content Moderation',
      subject: 'Inappropriate task content reported',
      user: 'Amadou Ba',
      userRole: 'Student',
      status: 'escalated',
      priority: 'urgent',
      createdAt: '3 hours ago',
      messages: [
        { from: 'Amadou Ba', message: 'This task contains offensive language.', timestamp: '3 hours ago', isSupport: false },
        { from: 'Support Agent', message: 'Thank you for reporting. Escalating to Admin for review.', timestamp: '2 hours ago', isSupport: true }
      ]
    },
    {
      id: '#2887',
      type: 'Technical',
      subject: 'Page not loading correctly',
      user: 'Mariama Sall',
      userRole: 'Student',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '5 hours ago',
      messages: [
        { from: 'Mariama Sall', message: 'The analytics page keeps showing an error.', timestamp: '5 hours ago', isSupport: false }
      ]
    }
  ];

  selectTicket(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.replyMessage = '';
  }

  escalateTicket(ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.showEscalationModal = true;
    this.escalationReason = '';
  }

  confirmEscalation(): void {
    if (!this.escalationReason || this.escalationReason.length < 20) {
      alert('Please provide a detailed escalation reason (minimum 20 characters)');
      return;
    }
    alert('Ticket escalated to Admin successfully');
    if (this.selectedTicket) {
      this.selectedTicket.status = 'escalated';
    }
    this.showEscalationModal = false;
    this.selectedTicket = null;
  }

  updateTicketStatus(status: 'in_progress' | 'resolved'): void {
    if (this.selectedTicket) {
      this.selectedTicket.status = status;
      alert(`Ticket status updated to ${status.replace('_', ' ')}`);
    }
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'open': 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
      'in_progress': 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
      'resolved': 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
      'escalated': 'px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800'
    };
    return classes[status] || classes['open'];
  }

  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'low': 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
      'medium': 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
      'high': 'px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800',
      'urgent': 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
    };
    return classes[priority] || classes['medium'];
  }
}
