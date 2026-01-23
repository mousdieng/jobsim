import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { PlatformService } from '../../services/platform.service';
import { User } from '../../models/user.model';
import { Task, TaskSubmission } from '../../models/platform.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  user: User | null = null;
  recommendedTasks: Task[] = [];
  recentSubmissions: TaskSubmission[] = [];
  isLoading = true;
  error: string | null = null;
  isMobileMenuOpen = false;
  isProfileMenuOpen = false;
  private lastToggleTime = 0;

  stats = {
    completedTasks: 0,
    pendingTasks: 0,
    averageScore: 0,
    totalScore: 0
  };

  constructor(
    private authService: AuthService,
    private platformService: PlatformService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.loadDashboardData();
      }
    });
  }

  async loadDashboardData(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      // Load recommended tasks based on user's job field
      const tasksResponse = await this.platformService.getTasks({
        job_field: this.user?.job_field
      });

      if (tasksResponse.data) {
        this.recommendedTasks = tasksResponse.data.slice(0, 6);
      }

      // Load user submissions
      const submissionsResponse = await this.platformService.getUserSubmissions();
      if (submissionsResponse.data) {
        this.recentSubmissions = submissionsResponse.data.slice(0, 5);

        // Calculate stats
        const completed = submissionsResponse.data.filter(s =>
          s.status === 'reviewed' || s.status === 'approved'
        );
        const pending = submissionsResponse.data.filter(s =>
          s.status === 'submitted' || s.status === 'under_review'
        );

        this.stats.completedTasks = completed.length;
        this.stats.pendingTasks = pending.length;
      }

      // Use user profile stats
      if (this.user) {
        this.stats.averageScore = this.user.average_score;
        this.stats.totalScore = this.user.total_score;
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to load dashboard data';
    } finally {
      this.isLoading = false;
    }
  }

  getDifficultyColor(level: string): string {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/']);
  }

  toggleMobileMenu(): void {
    // Prevent double-triggering from both touch and click events
    const now = Date.now();
    if (now - this.lastToggleTime < 300) {
      return;
    }
    this.lastToggleTime = now;
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  getInitials(): string {
    if (!this.user?.name) return 'U';
    const names = this.user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  isStudent(): boolean {
    return this.user?.role === 'candidate' || !this.user?.role;
  }

  isEnterprise(): boolean {
    return this.user?.role === 'enterprise_rep';
  }

  isSupport(): boolean {
    return this.user?.role === 'platform_support';
  }
}
