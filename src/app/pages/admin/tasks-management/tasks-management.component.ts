import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { Task } from '../../../models/platform.model';

@Component({
  selector: 'app-tasks-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tasks-management.component.html',
  styleUrls: ['./tasks-management.component.css']
})
export class TasksManagementComponent implements OnInit {
  tasks: Task[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  lifecycleStatusFilter = '';
  flaggedFilter: boolean | null = null;

  // Action modal
  selectedTask: Task | null = null;
  showActionModal = false;
  actionType: 'validate' | 'reject' | 'flag' | 'archive' | 'feature' | 'delete' | null = null;
  actionNotes = '';
  actionLoading = false;
  featureValue = false;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get filters from query params
    this.route.queryParams.subscribe(params => {
      if (params['lifecycle_status']) {
        this.lifecycleStatusFilter = params['lifecycle_status'];
      }
      if (params['flagged']) {
        this.flaggedFilter = params['flagged'] === 'true';
      }
      this.loadTasks();
    });
  }

  loadTasks(): void {
    this.loading = true;
    this.error = null;

    if (this.lifecycleStatusFilter) {
      this.adminService.getTasksByLifecycleStatus(
        this.lifecycleStatusFilter as any
      ).subscribe({
        next: (data) => {
          this.tasks = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load tasks';
          this.loading = false;
          console.error('Error loading tasks:', err);
        }
      });
    } else {
      const filters = {
        flagged: this.flaggedFilter !== null ? this.flaggedFilter : undefined
      };

      this.adminService.getAllTasks(filters).subscribe({
        next: (data) => {
          this.tasks = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load tasks';
          this.loading = false;
          console.error('Error loading tasks:', err);
        }
      });
    }
  }

  applyFilters(): void {
    this.loadTasks();
  }

  clearFilters(): void {
    this.lifecycleStatusFilter = '';
    this.flaggedFilter = null;
    this.loadTasks();
  }

  openActionModal(
    task: Task,
    action: 'validate' | 'reject' | 'flag' | 'archive' | 'feature' | 'delete'
  ): void {
    this.selectedTask = task;
    this.actionType = action;
    this.actionNotes = '';
    this.showActionModal = true;

    if (action === 'feature') {
      this.featureValue = !task.is_featured;
    }
  }

  editTask(task: Task): void {
    // Navigate to create task page with task ID for editing
    this.router.navigate(['/admin/tasks/create'], { queryParams: { id: task.id } });
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedTask = null;
    this.actionType = null;
    this.actionNotes = '';
  }

  performAction(): void {
    if (!this.selectedTask || !this.actionType) return;

    if ((this.actionType === 'reject' || this.actionType === 'flag') && !this.actionNotes) {
      alert('Please provide a reason for this action');
      return;
    }

    this.actionLoading = true;

    let action$;
    switch (this.actionType) {
      case 'validate':
        action$ = this.adminService.validateTask(this.selectedTask.id, this.actionNotes);
        break;
      case 'reject':
        action$ = this.adminService.rejectTaskValidation(this.selectedTask.id, this.actionNotes);
        break;
      case 'flag':
        action$ = this.adminService.flagTask(this.selectedTask.id, this.actionNotes);
        break;
      case 'archive':
        action$ = this.adminService.archiveTask(this.selectedTask.id, this.actionNotes);
        break;
      case 'feature':
        action$ = this.adminService.featureTask(this.selectedTask.id, this.featureValue);
        break;
      case 'delete':
        action$ = this.adminService.deleteTask(this.selectedTask.id, this.actionNotes);
        break;
      default:
        this.actionLoading = false;
        return;
    }

    action$.subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeActionModal();
        this.loadTasks();
      },
      error: (err) => {
        this.actionLoading = false;
        alert('Failed to perform action: ' + err.message);
        console.error('Action error:', err);
      }
    });
  }

  getLifecycleStatusBadge(status?: string): string {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'validation_pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getLifecycleStatusLabel(status?: string): string {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'validation_pending':
        return 'Pending Validation';
      case 'active':
        return 'Active';
      case 'archived':
        return 'Archived';
      default:
        return 'Unknown';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
}
