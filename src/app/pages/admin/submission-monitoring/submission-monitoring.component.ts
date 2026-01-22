import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SubmissionService } from '../../../core/services/submission.service';
import { Submission, SubmissionStatus } from '../../../core/models/database.types';

@Component({
  selector: 'app-submission-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './submission-monitoring.component.html',
  styleUrls: ['./submission-monitoring.component.css']
})
export class SubmissionMonitoringComponent implements OnInit {
  submissions: Submission[] = [];
  filteredSubmissions: Submission[] = [];
  isLoading = true;
  error: string | null = null;

  // Filters
  selectedStatus: SubmissionStatus | 'all' = 'all';
  selectedCategory = '';
  searchQuery = '';

  // Pagination
  currentPage = 1;
  perPage = 15;
  totalSubmissions = 0;
  totalPages = 0;

  // Selected submission for details
  selectedSubmission: Submission | null = null;
  showSubmissionDetails = false;

  statusOptions: Array<{ value: SubmissionStatus | 'all'; label: string; color: string }> = [
    { value: 'all', label: 'All Status', color: 'gray' },
    { value: 'pending_validation', label: 'Pending Validation', color: 'gray' },
    { value: 'validation_failed', label: 'Validation Failed', color: 'red' },
    { value: 'awaiting_review', label: 'Awaiting Review', color: 'blue' },
    { value: 'under_review', label: 'Under Review', color: 'yellow' },
    { value: 'review_complete', label: 'Review Complete', color: 'purple' },
    { value: 'rejected', label: 'Rejected', color: 'red' }
  ];

  categories: string[] = [];

  constructor(private submissionService: SubmissionService) {}

  ngOnInit(): void {
    this.loadSubmissions();
    this.loadCategories();
  }

  loadSubmissions(): void {
    this.isLoading = true;
    this.error = null;

    const filters = {
      status: this.selectedStatus !== 'all' ? this.selectedStatus : undefined,
      category: this.selectedCategory || undefined,
      search: this.searchQuery || undefined
    };

    this.submissionService.getAllSubmissions(filters).subscribe(result => {
      if (result.error) {
        this.error = result.error;
      } else {
        this.submissions = result.data || [];
      }
      this.applyFilters();
      this.isLoading = false;
    });
  }

  loadCategories(): void {
    // TODO: Load categories from TaskService
    this.categories = [
      'Marketing',
      'Sales',
      'Design',
      'Development',
      'Data Analysis',
      'Customer Service'
    ];
  }

  applyFilters(): void {
    let filtered = [...this.submissions];

    // Status filter
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(s => s.status === this.selectedStatus);
    }

    // Category filter
    if (this.selectedCategory) {
      // TODO: Join with tasks table to filter by category
      // filtered = filtered.filter(s => s.task?.category === this.selectedCategory);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.id.toLowerCase().includes(query) ||
        s.candidate_id.toLowerCase().includes(query)
      );
    }

    this.filteredSubmissions = filtered;
    this.totalSubmissions = filtered.length;
    this.totalPages = Math.ceil(this.totalSubmissions / this.perPage);
    this.currentPage = 1;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedStatus = 'all';
    this.selectedCategory = '';
    this.searchQuery = '';
    this.applyFilters();
  }

  // Pagination
  get paginatedSubmissions(): Submission[] {
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;
    return this.filteredSubmissions.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }

  get pages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Submission Actions
  viewSubmissionDetails(submission: Submission): void {
    this.selectedSubmission = submission;
    this.showSubmissionDetails = true;
  }

  closeSubmissionDetails(): void {
    this.selectedSubmission = null;
    this.showSubmissionDetails = false;
  }

  flagSubmission(submission: Submission): void {
    if (confirm('Are you sure you want to flag this submission for review?')) {
      this.submissionService.flagSubmission(submission.id).subscribe(result => {
        if (result.error) {
          alert(`Error: ${result.error}`);
        } else {
          alert('Submission flagged successfully');
        }
      });
    }
  }

  deleteSubmission(submission: Submission): void {
    if (confirm('Are you sure you want to permanently delete this submission? This action cannot be undone.')) {
      this.submissionService.deleteSubmission(submission.id).subscribe(result => {
        if (result.error) {
          alert(`Error: ${result.error}`);
        } else {
          this.submissions = this.submissions.filter(s => s.id !== submission.id);
          this.applyFilters();
          this.closeSubmissionDetails();
        }
      });
    }
  }

  downloadSubmissionFiles(submission: Submission): void {
    // TODO: Implement download all files
    alert('Downloading all files...');
  }

  // UI Helpers
  getStatusColor(status: SubmissionStatus): string {
    const colors: Record<SubmissionStatus, string> = {
      pending_validation: 'bg-gray-100 text-gray-800',
      validation_failed: 'bg-red-100 text-red-800',
      awaiting_review: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      review_complete: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: SubmissionStatus): string {
    const labels: Record<SubmissionStatus, string> = {
      pending_validation: 'Pending Validation',
      validation_failed: 'Validation Failed',
      awaiting_review: 'Awaiting Review',
      under_review: 'Under Review',
      review_complete: 'Review Complete',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return this.formatDate(dateString);
  }

  getTotalFiles(submission: Submission): number {
    return submission.submitted_files.reduce((total, field) => total + field.files.length, 0);
  }

  refresh(): void {
    this.loadSubmissions();
  }
}
