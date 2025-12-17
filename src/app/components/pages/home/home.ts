import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
  standalone: true
})
export class HomeComponent {
  features = [
    {
      icon: '💼',
      title: 'Real Job Simulations',
      description: 'Practice authentic tasks from Marketing, Sales, and Accounting roles used by real companies in Senegal.'
    },
    {
      icon: '🎯',
      title: 'Expert Feedback',
      description: 'Get detailed feedback from industry mentors to improve your skills and boost your confidence.'
    },
    {
      icon: '📊',
      title: 'Track Your Progress',
      description: 'Monitor your performance, earn badges, and build a portfolio that proves your capabilities.'
    },
    {
      icon: '🏆',
      title: 'Stand Out to Employers',
      description: 'Showcase your completed simulations and scores to potential employers across Senegal.'
    }
  ];

  simulations = [
    {
      title: 'Digital Marketing Campaign',
      category: 'Marketing',
      difficulty: 'Intermediate',
      duration: '2-3 hours',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      title: 'Sales Strategy Development',
      category: 'Sales',
      difficulty: 'Advanced',
      duration: '3-4 hours',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      title: 'Financial Report Analysis',
      category: 'Accounting',
      difficulty: 'Beginner',
      duration: '1-2 hours',
      color: 'bg-green-100 text-green-700'
    }
  ];

  testimonials = [
    {
      name: 'Aminata Diallo',
      role: 'Marketing Student',
      image: '👩🏾‍💼',
      quote: 'JobSim helped me understand real marketing tasks. I got my first internship after showcasing my completed simulations!'
    },
    {
      name: 'Moussa Ndiaye',
      role: 'Recent Graduate',
      image: '👨🏾‍💼',
      quote: 'The feedback from mentors was invaluable. I learned more in 3 simulations than in months of theory.'
    },
    {
      name: 'Fatou Sow',
      role: 'Accounting Major',
      image: '👩🏾‍💻',
      quote: 'Finally, a platform that bridges the gap between education and real work. Highly recommended!'
    }
  ];

  stats = [
    { value: '500+', label: 'Students Trained' },
    { value: '50+', label: 'Job Simulations' },
    { value: '20+', label: 'Partner Companies' },
    { value: '85%', label: 'Success Rate' }
  ];

  isAuthenticated$;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
