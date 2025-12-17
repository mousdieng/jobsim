import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-browse-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Enhanced Public Navbar -->
      <nav class="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 shadow-lg sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <!-- Logo -->
            <div class="flex items-center">
              <a routerLink="/" class="flex items-center space-x-2 group">
                <div class="bg-white rounded-lg p-1.5 shadow-md group-hover:shadow-xl transition-shadow duration-200">
                  <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="hidden md:block">
                  <span class="text-xl font-bold text-white tracking-tight">JobSim</span>
                  <span class="text-xs text-indigo-200 ml-1">Senegal</span>
                </div>
              </a>
            </div>

            <!-- Desktop Navigation -->
            <div class="hidden md:flex md:items-center md:space-x-4">
              <a routerLink="/" class="text-indigo-100 hover:bg-white/10 hover:text-white inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Home
              </a>
              <a routerLink="/browse-tasks" class="bg-white/20 text-white inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Browse Tasks
              </a>
              <a routerLink="/about" class="text-indigo-100 hover:bg-white/10 hover:text-white inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                About
              </a>
              <a routerLink="/auth/login" class="text-white hover:bg-white/10 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Sign in
              </a>
              <a routerLink="/auth/register" class="inline-flex items-center px-4 py-2 border-2 border-white text-sm font-medium rounded-lg text-white bg-white/10 hover:bg-white hover:text-indigo-700 transition-all duration-200 shadow-lg">
                Get Started
              </a>
            </div>

            <!-- Mobile menu button -->
            <div class="flex items-center md:hidden">
              <button type="button" class="bg-white/10 border border-white/20 inline-flex items-center justify-center p-2 rounded-lg text-white hover:bg-white/20 transition-colors duration-200">
                <span class="sr-only">Open menu</span>
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="text-center mb-12">
          <h1 class="text-3xl font-bold text-gray-900">Browse Available Tasks</h1>
          <p class="mt-2 text-lg text-gray-600">
            Explore the types of tasks you can practice with
          </p>
        </div>

        <!-- Task Categories -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <!-- Software Engineering -->
          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 class="ml-3 text-lg font-medium text-gray-900">Software Engineering</h3>
            </div>
            <p class="text-gray-600 text-sm">Build APIs, create web applications, and solve coding challenges</p>
            <div class="mt-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                50+ tasks available
              </span>
            </div>
          </div>

          <!-- Marketing -->
          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 class="ml-3 text-lg font-medium text-gray-900">Marketing</h3>
            </div>
            <p class="text-gray-600 text-sm">Create campaigns, analyze data, and develop marketing strategies</p>
            <div class="mt-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                30+ tasks available
              </span>
            </div>
          </div>

          <!-- Data Science -->
          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 class="ml-3 text-lg font-medium text-gray-900">Data Science</h3>
            </div>
            <p class="text-gray-600 text-sm">Analyze datasets, build models, and create visualizations</p>
            <div class="mt-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                40+ tasks available
              </span>
            </div>
          </div>

          <!-- More categories... -->
          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="ml-3 text-lg font-medium text-gray-900">Accounting</h3>
            </div>
            <p class="text-gray-600 text-sm">Financial reporting, bookkeeping, and analysis tasks</p>
            <div class="mt-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                25+ tasks available
              </span>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 class="ml-3 text-lg font-medium text-gray-900">HR & Recruitment</h3>
            </div>
            <p class="text-gray-600 text-sm">Recruiting, onboarding, and employee management</p>
            <div class="mt-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                20+ tasks available
              </span>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div class="flex items-center mb-4">
              <div class="flex-shrink-0">
                <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h3 class="ml-3 text-lg font-medium text-gray-900">Project Management</h3>
            </div>
            <p class="text-gray-600 text-sm">Plan projects, manage teams, and track deliverables</p>
            <div class="mt-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                35+ tasks available
              </span>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="mt-12 text-center">
          <p class="text-lg text-gray-600 mb-4">Sign up to access all tasks and start building your portfolio</p>
          <a routerLink="/auth/register" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Create Free Account
          </a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class BrowseTasksComponent {}
