import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { AdminStats } from '../../../models/platform.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  stats: AdminStats | null = null;
  loading = true;
  error: string | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.adminService.getAdminStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load admin statistics';
        this.loading = false;
        console.error('Error loading stats:', err);
      }
    });
  }

  getActionTypeLabel(actionType: string): string {
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getActionTypeColor(actionType: string): string {
    if (actionType.includes('suspend') || actionType.includes('ban')) {
      return 'text-red-600';
    }
    if (actionType.includes('approve')) {
      return 'text-green-600';
    }
    if (actionType.includes('flag')) {
      return 'text-yellow-600';
    }
    return 'text-gray-600';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}
