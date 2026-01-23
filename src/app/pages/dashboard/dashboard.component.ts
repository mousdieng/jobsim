import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { XPService } from '../../core/services/xp.service';
import { TaskService } from '../../core/services/task.service';
import { User, LevelInfo, Task } from '../../core/models/database.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;

  // XP and Gamification
  levelInfo: LevelInfo | null = null;
  currentTask: Task | null = null;
  recentAchievements: any[] = [];
  inProgressTasks: any[] = [];

  constructor(
    private authService: AuthService,
    private xpService: XPService,
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoading = false;

      if (user?.candidateProfile) {
        // Calculate level info from overall XP
        this.levelInfo = this.xpService.getLevelInfo(user.candidateProfile.overall_xp);

        // Load in-progress tasks
        this.loadInProgressTasks();

        // Load current task if enrolled (legacy)
        if (user.candidateProfile.current_task_id) {
          this.loadCurrentTask(user.candidateProfile.current_task_id);
        }

        // Get recent achievements
        this.recentAchievements = user.candidateProfile.achievements.slice(-3).reverse();
      }
    });
  }

  loadCurrentTask(taskId: string): void {
    this.taskService.getTask(taskId).subscribe(result => {
      if (result.data) {
        this.currentTask = result.data;
      }
    });
  }

  loadInProgressTasks(): void {
    this.taskService.getInProgressTasks().subscribe(result => {
      console.log('📊 In-Progress Tasks Response:', result);
      if (result.data) {
        this.inProgressTasks = result.data;
        console.log('✅ In-Progress Tasks Loaded:', this.inProgressTasks);
      } else {
        console.log('❌ No in-progress tasks or error:', result.error);
      }
    });
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }

  getUserRoleLabel(): string {
    if (!this.currentUser) return 'User';

    switch (this.currentUser.role) {
      case 'candidate':
        return 'Candidate';
      case 'enterprise_rep':
        return 'Enterprise Representative';
      case 'admin':
        return 'Administrator';
      case 'platform_support':
        return 'Platform Support';
      default:
        return 'User';
    }
  }

  getProgressPercentage(): number {
    return this.levelInfo?.xp_progress_percentage || 0;
  }

  navigateToTasks(): void {
    this.router.navigate(['/app/tasks']);
  }

  navigateToCurrentTask(): void {
    if (this.currentTask) {
      this.router.navigate(['/app/tasks', this.currentTask.id]);
    }
  }

  navigateToTask(taskId: string): void {
    this.router.navigate(['/app/tasks', taskId]);
  }

  getTimeRemaining(deadline: string): string {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    const diff = deadlineTime - now;

    if (diff < 0) {
      return 'Expired';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} heure${hours > 1 ? 's' : ''} restante${hours > 1 ? 's' : ''}`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes} minute${minutes > 1 ? 's' : ''} restante${minutes > 1 ? 's' : ''}`;
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
