import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PlatformService } from '../../../services/platform.service';
import { Task, JobField, DifficultyLevel, TaskFilters } from '../../../models/platform.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  isLoading = true;
  error: string | null = null;

  // Filters
  selectedJobField: JobField | '' = '';
  selectedDifficulty: DifficultyLevel | '' = '';
  searchQuery = '';

  jobFields: (JobField | '')[] = [
    '',
    'software_engineering',
    'accounting',
    'marketing',
    'sales',
    'human_resources',
    'project_management',
    'data_science',
    'graphic_design',
    'customer_service',
    'finance',
    'legal',
    'healthcare',
    'education',
    'operations',
    'consulting',
    'other'
  ];

  difficultyLevels: (DifficultyLevel | '')[] = [
    '',
    'beginner',
    'intermediate',
    'advanced',
    'expert'
  ];

  constructor(private platformService: PlatformService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  async loadTasks(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const filters: TaskFilters = {};
      if (this.selectedJobField) filters.job_field = this.selectedJobField;
      if (this.selectedDifficulty) filters.difficulty_level = this.selectedDifficulty;

      const response = await this.platformService.getTasks(filters);
      if (response.error) {
        this.error = response.error;
      } else {
        this.tasks = response.data || [];
        this.applySearchFilter();
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to load tasks';
    } finally {
      this.isLoading = false;
    }
  }

  applySearchFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredTasks = this.tasks;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredTasks = this.tasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
  }

  onFilterChange(): void {
    this.loadTasks();
  }

  onSearchChange(): void {
    this.applySearchFilter();
  }

  clearFilters(): void {
    this.selectedJobField = '';
    this.selectedDifficulty = '';
    this.searchQuery = '';
    this.loadTasks();
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
}
