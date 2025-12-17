import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-white">
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
              <a routerLink="/browse-tasks" class="text-indigo-100 hover:bg-white/10 hover:text-white inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Browse Tasks
              </a>
              <a routerLink="/about" class="bg-white/20 text-white inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
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
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 class="text-4xl font-bold text-gray-900 mb-8">About JobSim Senegal</h1>

        <div class="prose prose-lg max-w-none">
          <p class="text-xl text-gray-600 mb-6">
            JobSim Senegal is a work simulation platform designed to help job seekers in Senegal
            gain practical experience and showcase their skills to potential employers.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
          <p class="text-gray-600 mb-6">
            We bridge the gap between education and employment by providing realistic work simulations
            that prepare job seekers for the challenges they'll face in their careers.
          </p>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">How It Works</h2>
          <div class="space-y-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  1
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Choose Your Path</h3>
                <p class="text-gray-600">Select tasks that match your career goals and skill level</p>
              </div>
            </div>

            <div class="flex">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  2
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Complete Tasks</h3>
                <p class="text-gray-600">Work on realistic projects and submit your solutions</p>
              </div>
            </div>

            <div class="flex">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  3
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Get Feedback</h3>
                <p class="text-gray-600">Receive AI-powered evaluation and improve your skills</p>
              </div>
            </div>

            <div class="flex">
              <div class="flex-shrink-0">
                <div class="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  4
                </div>
              </div>
              <div class="ml-4">
                <h3 class="text-lg font-medium text-gray-900">Build Your Portfolio</h3>
                <p class="text-gray-600">Showcase your best work to potential employers</p>
              </div>
            </div>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">For Job Seekers</h2>
          <ul class="list-disc list-inside text-gray-600 space-y-2">
            <li>Practice with realistic work scenarios</li>
            <li>Build a portfolio of completed projects</li>
            <li>Get noticed by employers looking for talent</li>
            <li>Improve your skills with AI-powered feedback</li>
          </ul>

          <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">For Employers</h2>
          <ul class="list-disc list-inside text-gray-600 space-y-2">
            <li>Find candidates with proven skills</li>
            <li>Post real work tasks to identify talent</li>
            <li>Review portfolios of completed work</li>
            <li>Connect with qualified candidates</li>
          </ul>

          <div class="mt-12 bg-indigo-50 rounded-lg p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p class="text-gray-600 mb-6">
              Join JobSim Senegal today and start building the skills and portfolio you need to succeed.
            </p>
            <a routerLink="/auth/register" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
              Create Free Account
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AboutComponent {}
