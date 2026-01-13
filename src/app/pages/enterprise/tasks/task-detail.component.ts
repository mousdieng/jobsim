import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { EnterpriseService } from '../../../services/enterprise.service';

@Component({
  selector: 'app-enterprise-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css']
})
export class EnterpriseTaskDetailComponent implements OnInit, OnDestroy {
  task: any = null;
  submissions: any[] = [];
  isLoading = true;
  isLoadingSubmissions = false;
  error: string | null = null;
  taskId: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private enterpriseService: EnterpriseService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.taskId = params['id'];
      this.loadTaskDetails();
      this.loadSubmissions();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTaskDetails(): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.enterpriseService.getTask(this.taskId).subscribe({
      next: (task: any) => {
        this.task = task;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Failed to load task details';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  loadSubmissions(): void {
    this.isLoadingSubmissions = true;

    const sub = this.enterpriseService.getTaskSubmissions(this.taskId).subscribe({
      next: (submissions: any) => {
        this.submissions = submissions;
        this.isLoadingSubmissions = false;
      },
      error: (err: any) => {
        console.error('Failed to load submissions:', err);
        this.isLoadingSubmissions = false;
      }
    });
    this.subscriptions.push(sub);
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending_validation': 'bg-yellow-100 text-yellow-800',
      'published': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'archived': 'bg-gray-100 text-gray-600'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getSubmissionStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'submitted': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'reviewed': 'bg-purple-100 text-purple-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getDifficultyBadgeClass(difficulty: string): string {
    const difficultyClasses: { [key: string]: string } = {
      'beginner': 'bg-blue-100 text-blue-800',
      'intermediate': 'bg-purple-100 text-purple-800',
      'advanced': 'bg-orange-100 text-orange-800',
      'expert': 'bg-red-100 text-red-800'
    };
    return difficultyClasses[difficulty] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
