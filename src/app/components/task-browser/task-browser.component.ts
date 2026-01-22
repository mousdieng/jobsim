import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TaskService, TaskFilters } from '../../core/services/task.service';
import { Task, TaskDifficulty } from '../../core/models/database.types';

/**
 * Task Browser Component
 * Allows users to browse, filter, and enroll in tasks
 */
@Component({
  selector: 'app-task-browser',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './task-browser.component.html',
  styleUrls: ['./task-browser.component.css']
})
export class TaskBrowserComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  isLoading = true;

  // Filters
  filters = {
    category: '',
    difficulty: '' as TaskDifficulty | '',
    search: ''
  };

  categories: string[] = [];
  difficulties: TaskDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

  constructor(
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadCategories();
  }

  loadTasks(): void {
    this.isLoading = true;
    // Convert empty strings to undefined for TaskFilters
    const filters: TaskFilters = {
      category: this.filters.category || undefined,
      difficulty: this.filters.difficulty || undefined,
      search: this.filters.search || undefined
    };
    this.taskService.getTasks(filters).subscribe(result => {
      if (result.data) {
        this.tasks = result.data;
        this.filteredTasks = result.data;
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

  applyFilters(): void {
    this.loadTasks();
  }

  resetFilters(): void {
    this.filters = {
      category: '',
      difficulty: '',
      search: ''
    };
    this.loadTasks();
  }

  enrollInTask(taskId: string): void {
    this.taskService.enrollInTask(taskId).subscribe(result => {
      if (result.error) {
        alert(result.error);
      } else {
        alert('Successfully enrolled in task!');
        this.router.navigate(['/app/tasks', taskId]);
      }
    });
  }

  viewTaskDetails(taskId: string): void {
    this.router.navigate(['/app/tasks', taskId]);
  }

  getDifficultyColor(difficulty: TaskDifficulty): string {
    const colors: Record<TaskDifficulty, string> = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-orange-100 text-orange-800',
      expert: 'bg-red-100 text-red-800'
    };
    return colors[difficulty];
  }

  getDifficultyMultiplier(difficulty: TaskDifficulty): number {
    const multipliers: Record<TaskDifficulty, number> = {
      beginner: 1.0,
      intermediate: 1.5,
      advanced: 2.0,
      expert: 3.0
    };
    return multipliers[difficulty];
  }

  calculateMaxXP(task: Task): number {
    return Math.round(task.base_xp * this.getDifficultyMultiplier(task.difficulty) * 2.0); // First attempt multiplier
  }
}
