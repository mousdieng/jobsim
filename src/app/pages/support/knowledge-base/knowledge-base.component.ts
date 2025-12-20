import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Knowledge Base</h2>
        <p class="mt-1 text-gray-600">Support resources and documentation (read-only)</p>
      </div>

      <!-- Categories -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100 text-sm">Category</p>
              <p class="text-2xl font-bold mt-1">Platform Rules</p>
              <p class="text-sm text-blue-100 mt-2">12 articles</p>
            </div>
            <div class="bg-white/20 rounded-full p-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-purple-100 text-sm">Category</p>
              <p class="text-2xl font-bold mt-1">Escalation Guidelines</p>
              <p class="text-sm text-purple-100 mt-2">8 articles</p>
            </div>
            <div class="bg-white/20 rounded-full p-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-green-100 text-sm">Category</p>
              <p class="text-2xl font-bold mt-1">Response Templates</p>
              <p class="text-sm text-green-100 mt-2">24 templates</p>
            </div>
            <div class="bg-white/20 rounded-full p-3">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Platform Rules -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Platform Rules & Guidelines</h3>
        </div>
        <div class="divide-y divide-gray-200">
          <div *ngFor="let rule of platformRules" class="p-6">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div class="ml-4 flex-1">
                <h4 class="text-lg font-semibold text-gray-900">{{ rule.title }}</h4>
                <p class="mt-2 text-sm text-gray-600">{{ rule.description }}</p>
                <div class="mt-3 flex items-center text-xs text-gray-500">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Last updated: {{ rule.lastUpdated }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Escalation Guidelines -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">When to Escalate to Admin</h3>
        </div>
        <div class="p-6 space-y-4">
          <div *ngFor="let guideline of escalationGuidelines" class="flex items-start space-x-3">
            <div class="flex-shrink-0 mt-1">
              <div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">{{ guideline.scenario }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ guideline.action }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Response Templates -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Common Response Templates</h3>
        </div>
        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div *ngFor="let template of responseTemplates" class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-gray-900">{{ template.name }}</h4>
              <button class="text-xs text-blue-600 hover:text-blue-800">Copy</button>
            </div>
            <p class="text-sm text-gray-600">{{ template.preview }}</p>
            <div class="mt-2 flex items-center text-xs text-gray-500">
              <span class="px-2 py-1 bg-gray-100 rounded">{{ template.category }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Known Issues -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Known Issues & Solutions</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affects</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workaround</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let issue of knownIssues">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ issue.title }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ issue.affects }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [class]="issue.status === 'investigating' ? 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800' : 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800'">
                    {{ issue.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">{{ issue.workaround }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class KnowledgeBaseComponent {
  platformRules = [
    {
      title: 'User Content Policy',
      description: 'All user-generated content must be professional and respectful. Tasks cannot contain offensive language, discriminatory content, or violate intellectual property rights.',
      lastUpdated: 'Jan 15, 2025'
    },
    {
      title: 'Task Submission Guidelines',
      description: 'Students must submit original work. Plagiarism is strictly prohibited and may result in account suspension.',
      lastUpdated: 'Jan 10, 2025'
    },
    {
      title: 'Enterprise Partner Rules',
      description: 'Enterprise partners must create tasks that align with approved professional domains and provide clear, achievable objectives.',
      lastUpdated: 'Dec 20, 2024'
    }
  ];

  escalationGuidelines = [
    {
      scenario: 'User Ban Request',
      action: 'Repeated violations of platform rules require Admin decision. Document all incidents and escalate with evidence.'
    },
    {
      scenario: 'Content Violation',
      action: 'Inappropriate, offensive, or harmful content must be escalated immediately. Temporarily hide the content pending Admin review.'
    },
    {
      scenario: 'Role Change Request',
      action: 'Only Admins can modify user roles. Escalate with verification of user identity and reason for change.'
    },
    {
      scenario: 'System Configuration Issues',
      action: 'Support cannot modify system settings. Escalate technical issues that affect platform functionality.'
    },
    {
      scenario: 'Payment/Billing Disputes',
      action: 'Financial matters require Admin oversight. Gather all transaction details before escalating.'
    }
  ];

  responseTemplates = [
    {
      name: 'Task Submission Error',
      preview: 'Thank you for contacting support. I understand you\'re experiencing issues submitting your task...',
      category: 'Technical'
    },
    {
      name: 'Password Reset',
      preview: 'I\'ll help you reset your password. I\'m sending a password reset link to your email...',
      category: 'Account'
    },
    {
      name: 'Enterprise Onboarding',
      preview: 'Welcome to JobSim Senegal! Let me guide you through the enterprise onboarding process...',
      category: 'Onboarding'
    },
    {
      name: 'Task Quality Feedback',
      preview: 'Thank you for your feedback about task quality. We take all quality concerns seriously...',
      category: 'Quality'
    }
  ];

  knownIssues = [
    {
      title: 'Submission button unresponsive',
      affects: 'Students on Safari browser',
      status: 'investigating',
      workaround: 'Advise using Chrome or Firefox temporarily'
    },
    {
      title: 'Email verification delay',
      affects: 'All new users',
      status: 'known',
      workaround: 'Check spam folder, resend after 10 minutes'
    }
  ];
}
