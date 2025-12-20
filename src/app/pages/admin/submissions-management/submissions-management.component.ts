import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { TaskSubmission } from '../../../models/platform.model';

@Component({
  selector: 'app-submissions-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './submissions-management.component.html',
  styleUrls: ['./submissions-management.component.css']
})
export class SubmissionsManagementComponent implements OnInit {
  submissions: TaskSubmission[] = [];
  loading = true;
  error: string | null = null;

  flaggedFilter: boolean | null = null;
  selectedSubmission: TaskSubmission | null = null;
  showOverrideModal = false;
  newScore = 0;
  overrideReason = '';
  actionLoading = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadSubmissions();
  }

  loadSubmissions(): void {
    this.loading = true;
    this.error = null;

    const filters = {
      flagged: this.flaggedFilter !== null ? this.flaggedFilter : undefined
    };

    this.adminService.getAllSubmissions(filters).subscribe({
      next: (data) => {
        this.submissions = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load submissions';
        this.loading = false;
        console.error('Error loading submissions:', err);
      }
    });
  }

  applyFilters(): void {
    this.loadSubmissions();
  }

  clearFilters(): void {
    this.flaggedFilter = null;
    this.loadSubmissions();
  }

  openOverrideModal(submission: TaskSubmission): void {
    this.selectedSubmission = submission;
    this.newScore = submission.score || 0;
    this.overrideReason = '';
    this.showOverrideModal = true;
  }

  closeOverrideModal(): void {
    this.showOverrideModal = false;
    this.selectedSubmission = null;
    this.overrideReason = '';
  }

  overrideScore(): void {
    if (!this.selectedSubmission) return;

    if (!this.overrideReason || this.overrideReason.length < 20) {
      alert('Please provide a detailed reason (minimum 20 characters)');
      return;
    }

    this.actionLoading = true;

    this.adminService.overrideSubmissionScore(
      this.selectedSubmission.id,
      this.newScore,
      this.overrideReason
    ).subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeOverrideModal();
        this.loadSubmissions();
      },
      error: (err) => {
        this.actionLoading = false;
        alert('Failed to override score: ' + err.message);
      }
    });
  }

  flagSubmission(submission: TaskSubmission): void {
    const reason = prompt('Enter reason for flagging this submission:');
    if (!reason) return;

    this.adminService.flagSubmission(submission.id, reason).subscribe({
      next: () => {
        this.loadSubmissions();
      },
      error: (err) => {
        alert('Failed to flag submission: ' + err.message);
      }
    });
  }

  getScoreBadgeColor(score?: number): string {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }
}
