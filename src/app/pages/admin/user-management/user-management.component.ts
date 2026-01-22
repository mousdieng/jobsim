import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../services/admin.service';
import { User, UserRole, Company } from '../../../core/models/database.types';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = true;
  error: string | null = null;

  // Filters
  selectedRole: UserRole | 'all' = 'all';
  selectedStatus: 'all' | 'active' | 'inactive' = 'all';
  searchQuery = '';

  // Pagination
  currentPage = 1;
  perPage = 20;
  totalUsers = 0;
  totalPages = 0;

  // Selected user for details/actions
  selectedUser: User | null = null;
  showUserDetails = false;
  actionInProgress = false;

  // Create User Modal
  showCreateUserModal = false;
  createUserInProgress = false;
  createUserError: string | null = null;
  createUserSuccess = false;
  companies: any[] = [];
  newUser = {
    name: '',
    email: '',
    password: '',
    role: '' as UserRole | '',
    company_id: ''
  };

  roles: Array<{ value: UserRole | 'all'; label: string }> = [
    { value: 'all', label: 'All Roles' },
    { value: 'candidate', label: 'Candidates' },
    { value: 'enterprise_rep', label: 'Enterprise Reps' },
    { value: 'admin', label: 'Admins' },
    { value: 'platform_support', label: 'Platform Support' }
  ];

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadCompanies();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;

    this.authService.getAllUsers().then(result => {
      if (result.error) {
        this.error = result.error;
      } else {
        this.users = result.data || [];
      }
      this.applyFilters();
      this.isLoading = false;
    });
  }

  applyFilters(): void {
    let filtered = [...this.users];

    // Role filter
    if (this.selectedRole !== 'all') {
      filtered = filtered.filter(u => u.role === this.selectedRole);
    }

    // Status filter
    if (this.selectedStatus !== 'all') {
      const isActive = this.selectedStatus === 'active';
      filtered = filtered.filter(u => u.is_active === isActive);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    this.filteredUsers = filtered;
    this.totalUsers = filtered.length;
    this.totalPages = Math.ceil(this.totalUsers / this.perPage);
    this.currentPage = 1; // Reset to first page when filters change
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedRole = 'all';
    this.selectedStatus = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }

  // Pagination
  get paginatedUsers(): User[] {
    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;
    return this.filteredUsers.slice(start, end);
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

  // User Actions
  viewUserDetails(user: User): void {
    this.selectedUser = user;
    this.showUserDetails = true;
  }

  closeUserDetails(): void {
    this.selectedUser = null;
    this.showUserDetails = false;
  }

  toggleUserStatus(user: User): void {
    if (confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) {
      this.actionInProgress = true;

      this.authService.updateUserStatus(user.id, !user.is_active).then(result => {
        if (result.error) {
          alert(`Error: ${result.error}`);
        } else {
          user.is_active = !user.is_active;
        }
        this.actionInProgress = false;
      });
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to permanently delete ${user.full_name || user.email}? This action cannot be undone.`)) {
      this.actionInProgress = true;

      this.authService.deleteUser(user.id).then(result => {
        if (result.error) {
          alert(`Error: ${result.error}`);
        } else {
          this.users = this.users.filter(u => u.id !== user.id);
          this.applyFilters();
          this.closeUserDetails();
        }
        this.actionInProgress = false;
      });
    }
  }

  // UI Helpers
  getRoleBadgeColor(role: UserRole): string {
    const colors = {
      candidate: 'bg-green-100 text-green-800',
      enterprise_rep: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800',
      platform_support: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  }

  getRoleLabel(role: UserRole): string {
    const labels = {
      candidate: 'Candidate',
      enterprise_rep: 'Enterprise Rep',
      admin: 'Admin',
      platform_support: 'Platform Support'
    };
    return labels[role] || role;
  }

  getStatusBadgeColor(isActive: boolean): string {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getInitials(name: string | null, email: string): string {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  }

  // Create User Methods
  loadCompanies(): void {
    this.adminService.getAllEnterprises().subscribe({
      next: (companies) => {
        this.companies = companies;
      },
      error: (error) => {
        console.error('Failed to load companies:', error);
      }
    });
  }

  openCreateUserModal(): void {
    this.showCreateUserModal = true;
    this.createUserError = null;
    this.createUserSuccess = false;
    this.resetNewUserForm();
  }

  closeCreateUserModal(): void {
    this.showCreateUserModal = false;
    this.resetNewUserForm();
  }

  resetNewUserForm(): void {
    this.newUser = {
      name: '',
      email: '',
      password: '',
      role: '',
      company_id: ''
    };
  }

  onRoleChange(): void {
    // Clear company_id if role is not enterprise_rep
    if (this.newUser.role !== 'enterprise_rep') {
      this.newUser.company_id = '';
    }
  }

  createUser(): void {
    this.createUserInProgress = true;
    this.createUserError = null;
    this.createUserSuccess = false;

    // Validate form
    if (!this.newUser.name || !this.newUser.email || !this.newUser.password || !this.newUser.role) {
      this.createUserError = 'Please fill in all required fields';
      this.createUserInProgress = false;
      return;
    }

    if (this.newUser.role === 'enterprise_rep' && !this.newUser.company_id) {
      this.createUserError = 'Please select a company for enterprise representative';
      this.createUserInProgress = false;
      return;
    }

    // Call admin service
    this.adminService.createUser({
      name: this.newUser.name,
      email: this.newUser.email,
      password: this.newUser.password,
      role: this.newUser.role as UserRole,
      company_id: this.newUser.company_id || undefined
    }).subscribe({
      next: (user) => {
        this.createUserSuccess = true;
        this.createUserInProgress = false;

        // Reload users list
        this.loadUsers();

        // Close modal after 2 seconds
        setTimeout(() => {
          this.closeCreateUserModal();
        }, 2000);
      },
      error: (error) => {
        this.createUserError = error.message || 'Failed to create user. Please try again.';
        this.createUserInProgress = false;
      }
    });
  }
}
