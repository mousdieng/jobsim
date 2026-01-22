import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TaskService } from '../../../core/services/task.service';
import { SubmissionService } from '../../../core/services/submission.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, Submission } from '../../../core/models/database.types';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css']
})
export class TaskDetailComponent implements OnInit {
  task: Task | null = null;
  userSubmissions: Submission[] = [];
  userSubmission: Submission | null = null; // Latest user submission
  isLoading = true;
  error: string | null = null;

  // Enrollment
  isEnrolled = false;
  isEnrolling = false;
  enrollError: string | null = null;
  isStartingTask = false;
  taskStarted = false;
  taskDeadline: Date | null = null;
  startTaskError: string | null = null;

  // Submission form
  showSubmissionForm = false;
  submissionFiles: File[] = [];
  submissionNotes: string = '';
  submissionContent: string = '';
  meetings: any[] = []; // AI simulation meetings
  evaluationResult: any = null; // AI evaluation results
  isEvaluating = false; // AI evaluation in progress
  isSubmitting = false;
  submissionError: string | null = null;
  submissionSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private submissionService: SubmissionService,
    private storageService: StorageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('id');
    if (taskId) {
      this.loadTaskDetails(taskId);
    }
  }

  loadTaskDetails(taskId: string): void {
    this.isLoading = true;
    this.error = null;

    // Load task
    this.taskService.getTask(taskId).subscribe(result => {
      if (result.error) {
        this.error = result.error;
        this.isLoading = false;
        return;
      }

      this.task = result.data;
      this.isLoading = false;

      // Check if user is enrolled
      const currentUser = this.authService.getCurrentUser();
      if (currentUser?.candidateProfile) {
        this.isEnrolled = currentUser.candidateProfile.current_task_id === taskId;
      }

      // Load user's submission history for this task
      if (currentUser && this.isEnrolled) {
        this.loadUserSubmissions(taskId, currentUser.id);
      }
    });
  }

  loadUserSubmissions(taskId: string, candidateId: string): void {
    this.submissionService.getTaskSubmissionHistory(taskId, candidateId).subscribe(result => {
      if (result.data) {
        this.userSubmissions = result.data;
      }
    });
  }

  enrollInTask(): void {
    if (!this.task) return;

    this.isEnrolling = true;
    this.enrollError = null;

    this.taskService.enrollInTask(this.task.id).subscribe(result => {
      if (result.error) {
        this.enrollError = result.error;
      } else {
        this.isEnrolled = true;
        alert('Successfully enrolled in task!');
      }
      this.isEnrolling = false;
    });
  }

  startTask(): void {
    if (!this.task) return;

    this.isStartingTask = true;
    this.startTaskError = null;

    // Set task as started and set deadline
    this.taskStarted = true;
    if (this.task.estimated_time_minutes) {
      const deadline = new Date();
      deadline.setMinutes(deadline.getMinutes() + this.task.estimated_time_minutes);
      this.taskDeadline = deadline;
    }
    this.isStartingTask = false;
  }

  openSubmissionForm(): void {
    this.showSubmissionForm = true;
    this.submissionError = null;
    this.submissionSuccess = false;
  }

  closeSubmissionForm(): void {
    this.showSubmissionForm = false;
    this.submissionFiles = [];
    this.submissionContent = '';
    this.submissionNotes = '';
    this.submissionError = null;
    this.submissionSuccess = false;
  }

  onFilesSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.submissionFiles = files;
  }

  async submitWork(): Promise<void> {
    if (!this.task) {
      this.submissionError = 'Task not found';
      return;
    }

    if (!this.submissionContent.trim() && this.submissionFiles.length === 0) {
      this.submissionError = 'Veuillez soumettre du contenu ou des fichiers';
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.submissionError = 'You must be logged in';
      return;
    }

    this.isSubmitting = true;
    this.submissionError = null;

    try {
      let submittedFiles: any[] = [];

      // Upload files if any
      if (this.submissionFiles.length > 0) {
        const uploadResult = await this.storageService.uploadSubmissionFiles(
          'temp-id',
          currentUser.id,
          this.submissionFiles
        ).toPromise();

        if (!uploadResult?.data) {
          this.submissionError = 'Échec du téléchargement des fichiers';
          this.isSubmitting = false;
          return;
        }

        submittedFiles.push({
          field_label: 'Fichiers',
          files: uploadResult.data.map(f => ({
            name: f.name,
            url: f.url,
            size: f.size,
            type: f.type,
            uploaded_at: new Date().toISOString()
          }))
        });
      }

      // Add text content as a "file" if provided
      if (this.submissionContent.trim()) {
        submittedFiles.push({
          field_label: 'Contenu',
          content: this.submissionContent,
          notes: this.submissionNotes || null,
          type: 'text',
          uploaded_at: new Date().toISOString()
        });
      }

      // Create submission
      this.submissionService.createSubmission({
        task_id: this.task.id,
        submitted_files: submittedFiles
      }).subscribe(result => {
        if (result.error) {
          this.submissionError = result.error;
        } else {
          this.submissionSuccess = true;
          setTimeout(() => {
            this.closeSubmissionForm();
            if (this.task) {
              this.loadUserSubmissions(this.task.id, currentUser.id);
            }
          }, 2000);
        }
        this.isSubmitting = false;
      });
    } catch (err: any) {
      this.submissionError = err.message || 'Failed to submit work';
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

  getCreatorBadge(creator: string | null): string {
    switch (creator) {
      case 'ai': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-blue-100 text-blue-800';
      case 'platform': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending_validation': return 'bg-gray-100 text-gray-800';
      case 'validation_failed': return 'bg-red-100 text-red-800';
      case 'awaiting_review': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'review_complete': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  get attemptCount(): number {
    return this.userSubmissions.length;
  }

  get canSubmit(): boolean {
    return this.isEnrolled && this.attemptCount < 5;
  }

  evaluateSubmission(): void {
    // TODO: Implement AI evaluation
    this.isEvaluating = true;
    setTimeout(() => {
      this.evaluationResult = { score: 85, feedback: 'Good work!' };
      this.isEvaluating = false;
    }, 2000);
  }

  goBack(): void {
    this.router.navigate(['/app/tasks']);
  }
}
