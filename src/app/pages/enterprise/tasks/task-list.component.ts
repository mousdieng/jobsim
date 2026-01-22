import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { EnterpriseService } from '../../../services/enterprise.service';

@Component({
  selector: 'app-enterprise-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class EnterpriseTaskListComponent implements OnInit, OnDestroy {
  tasks: any[] = [];
  isLoading = true;
  error: string | null = null;
  canCreateTasks = false;

  // Filter state
  filterStatus: string = 'all';
  searchQuery: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private enterpriseService: EnterpriseService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.checkTaskCreationPermission();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTasks(): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.enterpriseService.getEnterpriseTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load tasks';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  checkTaskCreationPermission(): void {
    const sub = this.enterpriseService.canCreateTasks().subscribe({
      next: (canCreate) => {
        this.canCreateTasks = canCreate;
      },
      error: (err) => {
        console.error('Error checking task creation permission:', err);
        this.canCreateTasks = false;
      }
    });
    this.subscriptions.push(sub);
  }

  getFilteredTasks(): any[] {
    let filtered = this.tasks;

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === this.filterStatus);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
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

  getDifficultyBadgeClass(difficulty: string): string {
    const difficultyClasses: { [key: string]: string } = {
      'beginner': 'bg-blue-100 text-blue-800',
      'intermediate': 'bg-purple-100 text-purple-800',
      'advanced': 'bg-orange-100 text-orange-800',
      'expert': 'bg-red-100 text-red-800'
    };
    return difficultyClasses[difficulty] || 'bg-gray-100 text-gray-800';
  }
}
