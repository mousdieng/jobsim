import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AdminAuditLog } from '../../../models/platform.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  logs: AdminAuditLog[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  actionTypeFilter = '';
  targetTypeFilter = '';
  limit = 50;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.error = null;

    const filters = {
      action_type: this.actionTypeFilter || undefined,
      target_type: this.targetTypeFilter || undefined,
      limit: this.limit
    };

    this.adminService.getAuditLogs(filters).subscribe({
      next: (data) => {
        this.logs = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load audit logs';
        this.loading = false;
        console.error('Error loading logs:', err);
      }
    });
  }

  applyFilters(): void {
    this.loadLogs();
  }

  clearFilters(): void {
    this.actionTypeFilter = '';
    this.targetTypeFilter = '';
    this.limit = 50;
    this.loadLogs();
  }

  getActionTypeLabel(actionType: string): string {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getActionTypeBadge(actionType: string): string {
    if (actionType.includes('suspend') || actionType.includes('ban')) {
      return 'bg-red-100 text-red-800';
    }
    if (actionType.includes('approve') || actionType.includes('validate')) {
      return 'bg-green-100 text-green-800';
    }
    if (actionType.includes('flag')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (actionType.includes('unsuspend')) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  getTargetTypeBadge(targetType: string): string {
    switch (targetType) {
      case 'user':
        return 'bg-indigo-100 text-indigo-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'task':
        return 'bg-green-100 text-green-800';
      case 'submission':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  formatTargetType(targetType: string): string {
    return targetType.charAt(0).toUpperCase() + targetType.slice(1);
  }
}
