import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { UserProfile } from '../../../models/platform.model';
import { RoleDisplayNamePipe } from '../../../pipes/role-display-name.pipe';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RoleDisplayNamePipe],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit {
  users: UserProfile[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  statusFilter = '';
  userTypeFilter = '';
  searchQuery = '';

  // Action modal
  selectedUser: UserProfile | null = null;
  showActionModal = false;
  actionType: 'suspend' | 'ban' | 'unsuspend' | null = null;
  actionReason = '';
  actionLoading = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    const filters = {
      status: this.statusFilter || undefined,
      user_type: this.userTypeFilter || undefined,
      search: this.searchQuery || undefined
    };

    this.adminService.getAllUsers(filters).subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users';
        this.loading = false;
        console.error('Error loading users:', err);
      }
    });
  }

  applyFilters(): void {
    this.loadUsers();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.userTypeFilter = '';
    this.searchQuery = '';
    this.loadUsers();
  }

  openActionModal(user: UserProfile, action: 'suspend' | 'ban' | 'unsuspend'): void {
    this.selectedUser = user;
    this.actionType = action;
    this.actionReason = '';
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedUser = null;
    this.actionType = null;
    this.actionReason = '';
  }

  performAction(): void {
    if (!this.selectedUser || !this.actionType) return;

    if ((this.actionType === 'suspend' || this.actionType === 'ban') && !this.actionReason) {
      alert('Please provide a reason for this action');
      return;
    }

    this.actionLoading = true;

    let action$;
    if (this.actionType === 'suspend') {
      action$ = this.adminService.suspendUser(this.selectedUser.id, this.actionReason);
    } else if (this.actionType === 'ban') {
      action$ = this.adminService.banUser(this.selectedUser.id, this.actionReason);
    } else {
      action$ = this.adminService.unsuspendUser(this.selectedUser.id);
    }

    action$.subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeActionModal();
        this.loadUsers(); // Reload users
      },
      error: (err) => {
        this.actionLoading = false;
        alert('Failed to perform action: ' + err.message);
        console.error('Action error:', err);
      }
    });
  }

  getUserStatusBadge(status?: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'banned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getUserRoleBadge(role?: string): string {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'support':
        return 'bg-indigo-100 text-indigo-800';
      case 'enterprise':
        return 'bg-blue-100 text-blue-800';
      case 'mentor':
        return 'bg-indigo-100 text-indigo-800'; // Legacy, same as support
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }
}
