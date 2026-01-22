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

        // Load current task if enrolled
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
}
