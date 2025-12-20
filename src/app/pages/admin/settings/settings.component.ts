import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">System Configuration</h2>
        <p class="mt-1 text-gray-600">Manage platform settings and configurations</p>
      </div>

      <!-- Platform Settings -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Platform Settings</h3>
        </div>
        <div class="p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
              <input
                type="text"
                value="JobSim Senegal"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <input
                type="email"
                value="support@jobsim.sn"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                <option>French</option>
                <option>English</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                <option>Africa/Dakar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Task Settings -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Task Settings</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">Task Validation Required</p>
              <p class="text-sm text-gray-600">All tasks must be validated by admin before going live</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="flex items-center justify-between pt-4 border-t">
            <div>
              <p class="font-medium text-gray-900">Auto-Archive Inactive Tasks</p>
              <p class="text-sm text-gray-600">Archive tasks after 90 days of inactivity</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="pt-4 border-t">
            <label class="block text-sm font-medium text-gray-700 mb-2">Max Tasks per Enterprise (Monthly)</label>
            <input
              type="number"
              value="100"
              class="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      <!-- Security Settings -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Security Settings</h3>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900">Require Email Verification</p>
              <p class="text-sm text-gray-600">Users must verify their email before accessing tasks</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div class="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                value="30"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
              <input
                type="number"
                value="5"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex justify-end space-x-4">
        <button class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Reset to Defaults
        </button>
        <button class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  `
})
export class AdminSettingsComponent {}
