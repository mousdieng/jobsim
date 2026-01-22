import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskDifficulty } from '../../../core/models/database.types';

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
  selectedCategory: string = '';
  selectedDifficulty: TaskDifficulty | '' = '';
  selectedJobField: string = '';
  searchQuery = '';

  categories: string[] = [];
  jobFields: string[] = [];

  difficultyLevels: (TaskDifficulty | '')[] = [
    '',
    'beginner',
    'intermediate',
    'advanced',
    'expert'
  ];

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadCategories();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.error = null;

    const filters: any = {};
    if (this.selectedCategory) filters.category = this.selectedCategory;
    if (this.selectedDifficulty) filters.difficulty = this.selectedDifficulty;
    if (this.searchQuery) filters.search = this.searchQuery;

    this.taskService.getTasks(filters).subscribe(result => {
      if (result.error) {
        this.error = result.error;
      } else {
        this.tasks = result.data || [];
        this.filteredTasks = this.tasks;
      }
      this.isLoading = false;
    });
  }

  loadCategories(): void {
    this.taskService.getCategories().subscribe(result => {
      if (result.data) {
        this.categories = result.data;
      }
    });
  }

  onFilterChange(): void {
    this.loadTasks();
  }

  onSearchChange(): void {
    this.loadTasks();
  }

  clearFilters(): void {
    this.selectedCategory = '';
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

  getCreatorBadge(creator: string | null): string {
    switch (creator) {
      case 'ai': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-blue-100 text-blue-800';
      case 'platform': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
