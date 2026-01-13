import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../services/platform.service';
import { TaskWorkflowService } from '../../../services/task-workflow.service';
import { AuthService } from '../../../services/auth.service';
import { Task, Meeting, TaskSubmission } from '../../../models/platform.model';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css']
})
export class TaskDetailComponent implements OnInit {
  task: Task | null = null;
  meetings: Meeting[] = [];
  userSubmission: TaskSubmission | null = null;
  isLoading = true;
  error: string | null = null;

  // Task workflow
  taskStarted = false;
  taskDeadline: Date | null = null;
  isStartingTask = false;
  startTaskError: string | null = null;

  // Submission form
  showSubmissionForm = false;
  submissionContent = '';
  submissionNotes = '';
  isSubmitting = false;
  submissionError: string | null = null;
  submissionSuccess = false;

  // Evaluation
  isEvaluating = false;
  evaluationResult: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private platformService: PlatformService,
    private workflowService: TaskWorkflowService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (taskId) {
      this.loadTaskDetails(taskId);
    }
  }

  async loadTaskDetails(taskId: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      // Load task
      const taskResponse = await this.platformService.getTask(taskId);
      if (taskResponse.error) {
        this.error = taskResponse.error;
        return;
      }
      this.task = taskResponse.data;

      // Load meetings for this task
      const meetingsResponse = await this.platformService.getMeetings(taskId);
      if (meetingsResponse.data) {
        this.meetings = meetingsResponse.data;
      }

      // Check if user has already submitted
      const submissionsResponse = await this.platformService.getUserSubmissions();
      if (submissionsResponse.data) {
        this.userSubmission = submissionsResponse.data.find(s => s.task_id === taskId) || null;
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to load task details';
    } finally {
      this.isLoading = false;
    }
  }

  openSubmissionForm(): void {
    this.showSubmissionForm = true;
    this.submissionError = null;
    this.submissionSuccess = false;
  }

  closeSubmissionForm(): void {
    this.showSubmissionForm = false;
    this.submissionContent = '';
    this.submissionNotes = '';
  }

  async submitWork(): Promise<void> {
    if (!this.task || !this.submissionContent.trim()) {
      this.submissionError = 'Please provide your submission content';
      return;
    }

    this.isSubmitting = true;
    this.submissionError = null;

    try {
      const response = await this.platformService.submitTask({
        task_id: this.task.id,
        content: {
          type: 'text',
          data: this.submissionContent,
          notes: this.submissionNotes
        },
        notes: this.submissionNotes,
        time_spent_minutes: 0
      });

      if (response.error) {
        this.submissionError = response.error;
      } else {
        this.submissionSuccess = true;
        this.userSubmission = response.data;
        setTimeout(() => {
          this.closeSubmissionForm();
        }, 2000);
      }
    } catch (err: any) {
      this.submissionError = err.message || 'Failed to submit work';
    } finally {
      this.isSubmitting = false;
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

  getCreatorBadge(creator: string): string {
    switch (creator) {
      case 'ai': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-blue-100 text-blue-800';
      case 'platform': return 'bg-gray-100 text-gray-800';
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

  async startTask(): Promise<void> {
    if (!this.task) return;

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.startTaskError = 'You must be logged in to start a task';
      return;
    }

    this.isStartingTask = true;
    this.startTaskError = null;

    try {
      const response = await this.workflowService.startTask({
        user_id: currentUser.id,
        task_id: this.task.id,
        user_name: currentUser.name || 'User',
        user_role: currentUser.user_type || 'Professional'
      }).toPromise();

      if (response?.success) {
        this.taskStarted = true;
        this.taskDeadline = new Date(response.data.deadline);
        // Reload meetings to get the AI-generated ones
        await this.loadTaskDetails(this.task.id);
      } else {
        this.startTaskError = 'Failed to start task';
      }
    } catch (err: any) {
      this.startTaskError = err.message || 'Failed to start task';
    } finally {
      this.isStartingTask = false;
    }
  }

  async evaluateSubmission(): Promise<void> {
    if (!this.userSubmission) return;

    this.isEvaluating = true;

    try {
      const response = await this.workflowService.evaluateSubmission(
        this.userSubmission.id
      ).toPromise();

      if (response?.success) {
        this.evaluationResult = response.data;
        // Reload submission to get updated score
        await this.loadTaskDetails(this.task!.id);
      }
    } catch (err: any) {
      console.error('Failed to evaluate submission:', err);
    } finally {
      this.isEvaluating = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/app/tasks']);
  }
}
