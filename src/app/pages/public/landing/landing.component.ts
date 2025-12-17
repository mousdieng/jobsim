import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
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
              <a routerLink="/browse-tasks" class="text-indigo-100 hover:bg-white/10 hover:text-white inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
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

      <!-- Hero Section -->
      <div class="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%239C92AC&quot; fill-opacity=&quot;0.4&quot;%3E%3Cpath d=&quot;M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z&quot;/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="relative z-10 pt-16 pb-20 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
            <div class="lg:grid lg:grid-cols-12 lg:gap-8">
              <!-- Left Content -->
              <div class="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                <!-- Trust Badge -->
                <div class="inline-flex items-center px-3 py-1 mb-6 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                  <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Trusted by 10,000+ Job Seekers in Senegal
                </div>

                <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                  <span class="block">Bridge the Gap Between</span>
                  <span class="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Education & Employment</span>
                </h1>
                <p class="mt-6 text-lg text-gray-600 sm:text-xl md:mt-8 lg:text-lg xl:text-xl">
                  Join Senegal's premier work simulation platform. Practice real-world tasks, receive AI-powered evaluations, and showcase your skills to top employers—all for free.
                </p>

                <!-- Value Props -->
                <div class="mt-8 space-y-3">
                  <div class="flex items-center text-gray-700">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Realistic workplace simulations with AI meetings</span>
                  </div>
                  <div class="flex items-center text-gray-700">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Instant AI-powered feedback on every submission</span>
                  </div>
                  <div class="flex items-center text-gray-700">
                    <svg class="w-5 h-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Build a portfolio that gets you hired</span>
                  </div>
                </div>

                <!-- CTA Buttons -->
                <div class="mt-10 sm:flex sm:justify-center lg:justify-start">
                  <div class="rounded-md shadow-xl">
                    <a routerLink="/auth/register" class="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform transition hover:scale-105 md:py-4 md:text-lg md:px-10">
                      Start Free Trial
                      <svg class="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                  <div class="mt-3 sm:mt-0 sm:ml-3">
                    <a routerLink="/browse-tasks" class="w-full flex items-center justify-center px-8 py-4 border-2 border-indigo-600 text-base font-semibold rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 transition md:py-4 md:text-lg md:px-10">
                      Explore Tasks
                    </a>
                  </div>
                </div>

                <!-- Social Proof -->
                <div class="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500">
                  <div class="flex items-center">
                    <div class="flex -space-x-2">
                      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-2 border-white"></div>
                      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white"></div>
                      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-red-400 border-2 border-white"></div>
                    </div>
                    <span class="ml-3 font-medium text-gray-700">Join 10,000+ learners</span>
                  </div>
                </div>
              </div>

              <!-- Right Visual -->
              <div class="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                <div class="relative mx-auto w-full rounded-lg shadow-2xl lg:max-w-md">
                  <div class="relative block w-full bg-white rounded-lg overflow-hidden">
                    <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-white">
                      <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-2">
                          <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                            </svg>
                          </div>
                          <div>
                            <div class="text-sm font-semibold">Your Progress</div>
                            <div class="text-xs opacity-80">Keep learning!</div>
                          </div>
                        </div>
                        <div class="text-2xl font-bold">87%</div>
                      </div>
                      <div class="space-y-4">
                        <div>
                          <div class="flex justify-between text-sm mb-1">
                            <span>Tasks Completed</span>
                            <span>12/15</span>
                          </div>
                          <div class="w-full bg-white/20 rounded-full h-2">
                            <div class="bg-white rounded-full h-2 w-4/5"></div>
                          </div>
                        </div>
                        <div>
                          <div class="flex justify-between text-sm mb-1">
                            <span>Skill Level</span>
                            <span>Intermediate</span>
                          </div>
                          <div class="w-full bg-white/20 rounded-full h-2">
                            <div class="bg-white rounded-full h-2 w-3/5"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="p-6">
                      <div class="text-sm font-semibold text-gray-900 mb-4">Recent Achievements</div>
                      <div class="space-y-3">
                        <div class="flex items-center">
                          <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">Perfect Score!</div>
                            <div class="text-xs text-gray-500">Marketing Campaign Task</div>
                          </div>
                        </div>
                        <div class="flex items-center">
                          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                          </div>
                          <div class="ml-3">
                            <div class="text-sm font-medium text-gray-900">First Completion</div>
                            <div class="text-xs text-gray-500">Data Analysis Task</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="bg-indigo-700 py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="text-center">
              <div class="text-4xl font-bold text-white">10,000+</div>
              <div class="mt-1 text-sm text-indigo-200">Active Learners</div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-white">500+</div>
              <div class="mt-1 text-sm text-indigo-200">Real Work Tasks</div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-white">15+</div>
              <div class="mt-1 text-sm text-indigo-200">Job Categories</div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-white">92%</div>
              <div class="mt-1 text-sm text-indigo-200">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="lg:text-center">
            <h2 class="text-base text-indigo-600 font-bold tracking-wide uppercase">Why Choose JobSim</h2>
            <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to land your dream job
            </p>
            <p class="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our AI-powered platform simulates real workplace scenarios to give you the edge in today's competitive job market.
            </p>
          </div>

          <div class="mt-10">
            <div class="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <!-- Feature 1 -->
              <div class="relative">
                <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Real Work Tasks</p>
                <p class="mt-2 ml-16 text-base text-gray-500">
                  Complete realistic tasks from various industries including tech, finance, marketing, and more.
                </p>
              </div>

              <!-- Feature 2 -->
              <div class="relative">
                <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p class="ml-16 text-lg leading-6 font-medium text-gray-900">AI-Powered Feedback</p>
                <p class="mt-2 ml-16 text-base text-gray-500">
                  Get instant, detailed feedback on your work from our AI evaluation system.
                </p>
              </div>

              <!-- Feature 3 -->
              <div class="relative">
                <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Portfolio Building</p>
                <p class="mt-2 ml-16 text-base text-gray-500">
                  Build a professional portfolio that showcases your skills to potential employers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Testimonials Section -->
      <div class="bg-gray-50 py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-12">
            <h2 class="text-base text-indigo-600 font-bold tracking-wide uppercase">Success Stories</h2>
            <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Trusted by thousands of job seekers across Senegal
            </p>
          </div>
          <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
            <!-- Testimonial 1 -->
            <div class="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div class="flex items-center mb-4">
                <div class="flex text-yellow-400">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </div>
              </div>
              <p class="text-gray-600 italic mb-4">"JobSim helped me build a portfolio that landed me my first tech job. The AI feedback was incredibly helpful in improving my skills."</p>
              <div class="flex items-center">
                <div class="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">A</div>
                <div class="ml-3">
                  <div class="font-semibold text-gray-900">Aminata Diallo</div>
                  <div class="text-sm text-gray-500">Software Developer @ DakarTech</div>
                </div>
              </div>
            </div>

            <!-- Testimonial 2 -->
            <div class="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div class="flex items-center mb-4">
                <div class="flex text-yellow-400">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </div>
              </div>
              <p class="text-gray-600 italic mb-4">"The AI meeting simulations were game-changers. I felt prepared for real interviews and got hired within 2 months!"</p>
              <div class="flex items-center">
                <div class="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">M</div>
                <div class="ml-3">
                  <div class="font-semibold text-gray-900">Moussa Ndiaye</div>
                  <div class="text-sm text-gray-500">Marketing Manager @ SenegalBiz</div>
                </div>
              </div>
            </div>

            <!-- Testimonial 3 -->
            <div class="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div class="flex items-center mb-4">
                <div class="flex text-yellow-400">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </div>
              </div>
              <p class="text-gray-600 italic mb-4">"As a recent graduate, JobSim gave me practical experience that my degree couldn't. Highly recommended!"</p>
              <div class="flex items-center">
                <div class="w-12 h-12 bg-gradient-to-br from-pink-400 to-red-400 rounded-full flex items-center justify-center text-white font-bold">F</div>
                <div class="ml-3">
                  <div class="font-semibold text-gray-900">Fatou Sall</div>
                  <div class="text-sm text-gray-500">Data Analyst @ FinTech Senegal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 relative overflow-hidden">
        <!-- Decorative shapes -->
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-0 left-0 w-64 h-64 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div class="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full transform translate-x-1/3 translate-y-1/3"></div>
        </div>

        <div class="max-w-4xl mx-auto text-center py-20 px-4 sm:py-24 sm:px-6 lg:px-8 relative z-10">
          <h2 class="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
            <span class="block">Your Dream Job is Waiting</span>
            <span class="block mt-2 text-indigo-200">Start Practicing Today</span>
          </h2>
          <p class="mt-6 text-xl leading-7 text-indigo-100 max-w-2xl mx-auto">
            Join 10,000+ ambitious professionals who are mastering real-world skills and landing better jobs through JobSim Senegal.
          </p>
          <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a routerLink="/auth/register" class="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-base font-bold rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 transform transition hover:scale-105 shadow-2xl">
              Get Started - It's Free
              <svg class="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a routerLink="/browse-tasks" class="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-base font-bold rounded-lg text-white bg-transparent hover:bg-white/10 transition">
              Explore Tasks
            </a>
          </div>
          <div class="mt-8 flex items-center justify-center gap-8 text-indigo-200 text-sm">
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No credit card required
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Free forever
            </div>
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="bg-gray-50">
        <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div class="flex justify-center space-x-6 md:order-2">
            <a href="#" class="text-gray-400 hover:text-gray-500">About</a>
            <a href="#" class="text-gray-400 hover:text-gray-500">Contact</a>
            <a href="#" class="text-gray-400 hover:text-gray-500">Privacy</a>
          </div>
          <div class="mt-8 md:mt-0 md:order-1">
            <p class="text-center text-base text-gray-400">
              &copy; 2025 JobSim Senegal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: []
})
export class LandingComponent {}
