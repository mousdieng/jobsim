import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TaskService } from '../../../core/services/task.service';
import { SubmissionService } from '../../../core/services/submission.service';
import { XPService } from '../../../core/services/xp.service';

interface DashboardStats {
  users: {
    total: number;
    candidates: number;
    enterprise_reps: number;
    admins: number;
    active_today: number;
  };
  tasks: {
    total: number;
    active: number;
    draft: number;
    archived: number;
    by_difficulty: {
      beginner: number;
      intermediate: number;
      advanced: number;
      expert: number;
    };
  };
  submissions: {
    total: number;
    pending_validation: number;
    awaiting_review: number;
    under_review: number;
    approved: number;
    rejected: number;
  };
  xp: {
    total_awarded: number;
    average_per_user: number;
    highest_level: number;
  };
}

interface TopCandidate {
  id: string;
  full_name: string;
  avatar_url: string | null;
  overall_xp: number;
  overall_level: number;
  tasks_completed: number;
}

interface RecentActivity {
  id: string;
  type: 'submission' | 'review' | 'task_created' | 'user_registered';
  description: string;
  user_name: string;
  timestamp: string;
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  topCandidates: TopCandidate[] = [];
  recentActivity: RecentActivity[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private taskService: TaskService,
    private submissionService: SubmissionService,
    private xpService: XPService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // Load all data in parallel
    Promise.all([
      this.loadStats(),
      this.loadTopCandidates(),
      this.loadRecentActivity()
    ])
      .then(() => {
        this.isLoading = false;
      })
      .catch(err => {
        this.error = err.message || 'Failed to load dashboard data';
        this.isLoading = false;
      });
  }

  async loadStats(): Promise<void> {
    // TODO: Implement actual API calls
    // For now, using placeholder data
    this.stats = {
      users: {
        total: 247,
        candidates: 198,
        enterprise_reps: 42,
        admins: 7,
        active_today: 89
      },
      tasks: {
        total: 156,
        active: 132,
        draft: 18,
        archived: 6,
        by_difficulty: {
          beginner: 45,
          intermediate: 58,
          advanced: 38,
          expert: 15
        }
      },
      submissions: {
        total: 1247,
        pending_validation: 23,
        awaiting_review: 45,
        under_review: 18,
        approved: 1089,
        rejected: 72
      },
      xp: {
        total_awarded: 487250,
        average_per_user: 2461,
        highest_level: 7
      }
    };
  }

  async loadTopCandidates(): Promise<void> {
    this.xpService.getLeaderboard(5).subscribe(result => {
      if (result.data) {
        this.topCandidates = result.data.map((entry: any) => ({
          id: entry.candidate_id,
          full_name: entry.full_name,
          avatar_url: entry.avatar_url,
          overall_xp: entry.xp,
          overall_level: entry.level,
          tasks_completed: entry.tasks_completed
        }));
      }
    });
  }

  async loadRecentActivity(): Promise<void> {
    // TODO: Implement actual API call for recent activity
    // For now, using placeholder data
    this.recentActivity = [
      {
        id: '1',
        type: 'submission',
        description: 'Submitted work for "Create Marketing Campaign"',
        user_name: 'Moussa Dieng',
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: '2',
        type: 'review',
        description: 'Reviewed submission for "Data Analysis Task"',
        user_name: 'Enterprise Rep 1',
        timestamp: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: '3',
        type: 'task_created',
        description: 'Created new task "Customer Service Simulation"',
        user_name: 'Admin User',
        timestamp: new Date(Date.now() - 1200000).toISOString()
      },
      {
        id: '4',
        type: 'user_registered',
        description: 'New candidate registered',
        user_name: 'New User',
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ];
  }

  // Calculated metrics
  get taskCompletionRate(): number {
    if (!this.stats) return 0;
    const total = this.stats.submissions.total;
    const approved = this.stats.submissions.approved;
    return total > 0 ? Math.round((approved / total) * 100) : 0;
  }

  get averageTasksPerCandidate(): number {
    if (!this.stats) return 0;
    const candidates = this.stats.users.candidates;
    const submissions = this.stats.submissions.total;
    return candidates > 0 ? Math.round((submissions / candidates) * 10) / 10 : 0;
  }

  get platformEngagementRate(): number {
    if (!this.stats) return 0;
    const total = this.stats.users.total;
    const active = this.stats.users.active_today;
    return total > 0 ? Math.round((active / total) * 100) : 0;
  }

  // UI Helpers
  getActivityIcon(type: string): string {
    const icons = {
      submission: '📝',
      review: '👀',
      task_created: '✨',
      user_registered: '👤'
    };
    return icons[type as keyof typeof icons] || '📌';
  }

  getActivityColor(type: string): string {
    const colors = {
      submission: 'bg-blue-100 text-blue-800',
      review: 'bg-green-100 text-green-800',
      task_created: 'bg-purple-100 text-purple-800',
      user_registered: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  getDifficultyColor(difficulty: string): string {
    const colors = {
      beginner: 'bg-green-500',
      intermediate: 'bg-yellow-500',
      advanced: 'bg-orange-500',
      expert: 'bg-red-500'
    };
    return colors[difficulty as keyof typeof colors] || 'bg-gray-500';
  }

  getDifficultyCount(difficulty: string): number {
    if (!this.stats) return 0;
    return this.stats.tasks.by_difficulty[difficulty as keyof typeof this.stats.tasks.by_difficulty] || 0;
  }

  getDifficultyPercentage(difficulty: string): number {
    if (!this.stats) return 0;
    const count = this.stats.tasks.by_difficulty[difficulty as keyof typeof this.stats.tasks.by_difficulty];
    const total = this.stats.tasks.total;
    return total > 0 ? (count / total) * 100 : 0;
  }

  getInitials(name: string | null): string {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  refresh(): void {
    this.loadDashboardData();
  }
}
