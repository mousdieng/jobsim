import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
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
  actionType: 'suspend' | 'ban' | 'unsuspend' | 'delete' | 'changeRole' | null = null;
  actionReason = '';
  actionLoading = false;

  // Create user modal
  showCreateUserModal = false;
  createUserForm = {
    email: '',
    password: '',
    name: '',
    user_type: 'support' as 'admin' | 'support' | 'enterprise',
    enterprise_id: ''
  };

  // Role change
  newRole: 'admin' | 'support' | 'enterprise' | 'student' = 'student';

  // Available enterprises for linking
  availableEnterprises: any[] = [];

  // Confirmation modal
  showConfirmModal = false;
  confirmModalData: {
    title: string;
    message: string;
    confirmText: string;
    confirmAction: () => void;
  } | null = null;

  // Form validation errors
  validationErrors: { [key: string]: string } = {};

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadEnterprises();
  }

  loadEnterprises(): void {
    this.adminService.getAllEnterprises().subscribe({
      next: (data) => {
        this.availableEnterprises = data;
      },
      error: (err) => {
        console.error('Error loading enterprises:', err);
      }
    });
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

  openCreateUserModal(): void {
    this.showCreateUserModal = true;
    this.createUserForm = {
      email: '',
      password: '',
      name: '',
      user_type: 'support',
      enterprise_id: ''
    };
  }

  closeCreateUserModal(): void {
    this.showCreateUserModal = false;
  }

  createUser(): void {
    // Validate form
    this.validationErrors = {};

    if (!this.createUserForm.email) {
      this.validationErrors['email'] = 'L\'email est requis';
    }
    if (!this.createUserForm.password) {
      this.validationErrors['password'] = 'Le mot de passe est requis';
    } else if (this.createUserForm.password.length < 8) {
      this.validationErrors['password'] = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (!this.createUserForm.name) {
      this.validationErrors['name'] = 'Le nom est requis';
    }

    if (Object.keys(this.validationErrors).length > 0) {
      this.notificationService.error('Veuillez remplir tous les champs requis correctement');
      return;
    }

    this.actionLoading = true;

    this.adminService.createUser(this.createUserForm).subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeCreateUserModal();
        this.loadUsers();
        this.notificationService.success(`Utilisateur créé avec succès!`);
      },
      error: (err) => {
        this.actionLoading = false;
        this.notificationService.error('Échec de la création de l\'utilisateur: ' + err.message);
        console.error('Create user error:', err);
      }
    });
  }

  openActionModal(user: UserProfile, action: 'suspend' | 'ban' | 'unsuspend' | 'delete' | 'changeRole'): void {
    this.selectedUser = user;
    this.actionType = action;
    this.actionReason = '';
    this.newRole = user.user_type as any;
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

    // Validate that actions requiring reason have one
    const reasonRequired = ['suspend', 'ban', 'delete', 'changeRole'];
    if (reasonRequired.includes(this.actionType) && !this.actionReason) {
      this.notificationService.warning('Veuillez fournir une raison pour cette action');
      return;
    }

    // Confirm destructive actions
    if (this.actionType === 'delete') {
      this.confirmModalData = {
        title: 'Supprimer l\'Utilisateur',
        message: `Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT cet utilisateur?\n\nUtilisateur: ${this.selectedUser.name} (${this.selectedUser.email})\n\nCette action NE PEUT PAS être annulée!`,
        confirmText: 'Supprimer Définitivement',
        confirmAction: () => this.executeAction()
      };
      this.showConfirmModal = true;
      return;
    }

    this.executeAction();
  }

  executeAction(): void {
    if (!this.selectedUser || !this.actionType) return;

    this.actionLoading = true;

    let action$;
    switch (this.actionType) {
      case 'suspend':
        action$ = this.adminService.suspendUser(this.selectedUser.id, this.actionReason);
        break;
      case 'ban':
        action$ = this.adminService.banUser(this.selectedUser.id, this.actionReason);
        break;
      case 'unsuspend':
        action$ = this.adminService.unsuspendUser(this.selectedUser.id);
        break;
      case 'delete':
        action$ = this.adminService.deleteUser(this.selectedUser.id, this.actionReason);
        break;
      case 'changeRole':
        if (this.newRole === this.selectedUser.user_type) {
          this.notificationService.warning('Veuillez sélectionner un rôle différent');
          this.actionLoading = false;
          return;
        }
        action$ = this.adminService.changeUserRole(this.selectedUser.id, this.newRole, this.actionReason);
        break;
      default:
        this.actionLoading = false;
        return;
    }

    action$.subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeActionModal();
        this.closeConfirmModal();
        this.loadUsers();
        this.notificationService.success(`Action effectuée avec succès!`);
      },
      error: (err) => {
        this.actionLoading = false;
        this.closeConfirmModal();
        this.notificationService.error('Échec de l\'action: ' + err.message);
        console.error('Action error:', err);
      }
    });
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmModalData = null;
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
