import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlatformService } from '../../../services/platform.service';
import { Task, JobField, DifficultyLevel, TaskFilters } from '../../../models/platform.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

  jobFields: { value: JobField | ''; label: string }[] = [
    { value: '', label: 'All Fields' },
    { value: 'software_engineering', label: 'Software Engineering' },
    { value: 'accounting', label: 'Accounting' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' },
    { value: 'human_resources', label: 'Human Resources' },
    { value: 'project_management', label: 'Project Management' },
    { value: 'data_science', label: 'Data Science' },
    { value: 'graphic_design', label: 'Graphic Design' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'finance', label: 'Finance' },
    { value: 'legal', label: 'Legal' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'operations', label: 'Operations' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' }
  ];

  difficultyLevels: { value: DifficultyLevel | ''; label: string }[] = [
    { value: '', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
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

  formatJobField(field: string): string {
    return field.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatDifficulty(level: string): string {
    return level.charAt(0).toUpperCase() + level.slice(1);
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
