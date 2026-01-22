import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { NotificationService } from '../../../services/notification.service';
import { Enterprise } from '../../../models/platform.model';

@Component({
  selector: 'app-enterprises-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './enterprises-management.component.html',
  styleUrls: ['./enterprises-management.component.css']
})
export class EnterprisesManagementComponent implements OnInit {
  enterprises: Enterprise[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  statusFilter = '';

  // Action modal
  selectedEnterprise: Enterprise | null = null;
  showActionModal = false;
  actionType: 'approve' | 'reject' | 'suspend' | 'unsuspend' | null = null;
  actionReason = '';
  actionLoading = false;

  // Create enterprise modal
  showCreateModal = false;
  createForm = {
    name: '',
    sector: '',
    description: '',
    website: '',
    location: '',
    size: '',
    contact_email: '',
    contact_phone: '',
    logo_url: '',
    can_create_tasks: false,
    admin_user_id: ''
  };
  validationErrors: { [key: string]: string } = {};
  availableUsers: any[] = [];
  loadingUsers = false;

  // Edit enterprise modal
  showEditModal = false;
  editingEnterprise: Enterprise | null = null;
  editForm = {
    name: '',
    sector: '',
    description: '',
    website: '',
    location: '',
    size: '',
    contact_email: '',
    contact_phone: '',
    logo_url: '',
    can_create_tasks: false,
    admin_user_id: ''
  };

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Get status from query params
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.statusFilter = params['status'];
      }
      this.loadEnterprises();
    });
  }

  loadEnterprises(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getAllEnterprises(this.statusFilter || undefined).subscribe({
      next: (data) => {
        this.enterprises = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load enterprises';
        this.loading = false;
        console.error('Error loading enterprises:', err);
      }
    });
  }

  applyFilters(): void {
    this.loadEnterprises();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.loadEnterprises();
  }

  openActionModal(enterprise: Enterprise, action: 'approve' | 'reject' | 'suspend' | 'unsuspend'): void {
    this.selectedEnterprise = enterprise;
    this.actionType = action;
    this.actionReason = '';
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedEnterprise = null;
    this.actionType = null;
    this.actionReason = '';
  }

  performAction(): void {
    if (!this.selectedEnterprise || !this.actionType) return;

    if ((this.actionType === 'reject' || this.actionType === 'suspend') && !this.actionReason) {
      this.notificationService.warning('Veuillez fournir une raison pour cette action');
      return;
    }

    this.actionLoading = true;

    let action$;
    switch (this.actionType) {
      case 'approve':
        action$ = this.adminService.approveEnterprise(this.selectedEnterprise.id);
        break;
      case 'reject':
        action$ = this.adminService.rejectEnterprise(this.selectedEnterprise.id, this.actionReason);
        break;
      case 'suspend':
        action$ = this.adminService.suspendEnterprise(this.selectedEnterprise.id, this.actionReason);
        break;
      case 'unsuspend':
        action$ = this.adminService.unsuspendEnterprise(this.selectedEnterprise.id);
        break;
      default:
        return;
    }

    action$.subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeActionModal();
        this.loadEnterprises();
        this.notificationService.success('Action effectuée avec succès!');
      },
      error: (err) => {
        this.actionLoading = false;
        this.notificationService.error('Échec de l\'action: ' + err.message);
        console.error('Action error:', err);
      }
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.createForm = {
      name: '',
      sector: '',
      description: '',
      website: '',
      location: '',
      size: '',
      contact_email: '',
      contact_phone: '',
      logo_url: '',
      can_create_tasks: false,
      admin_user_id: ''
    };
    this.validationErrors = {};
    this.loadEnterpriseUsers();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  loadEnterpriseUsers(): void {
    this.loadingUsers = true;
    this.adminService.getAllUsers({ role: 'enterprise_rep' }).subscribe({
      next: (users) => {
        this.availableUsers = users;
        this.loadingUsers = false;
      },
      error: (err) => {
        console.error('Error loading enterprise users:', err);
        this.loadingUsers = false;
      }
    });
  }

  createEnterprise(): void {
    // Validate form
    this.validationErrors = {};

    if (!this.createForm.name) {
      this.validationErrors['name'] = 'Enterprise name is required';
    }
    if (!this.createForm.sector) {
      this.validationErrors['sector'] = 'Industry/Sector is required';
    }
    if (!this.createForm.contact_email) {
      this.validationErrors['contact_email'] = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.createForm.contact_email)) {
      this.validationErrors['contact_email'] = 'Invalid email format';
    }
    if (this.createForm.website && !/^https?:\/\/.+/.test(this.createForm.website)) {
      this.validationErrors['website'] = 'Website must start with http:// or https://';
    }

    if (Object.keys(this.validationErrors).length > 0) {
      this.notificationService.error('Veuillez remplir tous les champs requis correctement');
      return;
    }

    this.actionLoading = true;

    this.adminService.createEnterprise({
      name: this.createForm.name,
      industry: this.createForm.sector,
      description: this.createForm.description || undefined,
      website: this.createForm.website || undefined,
      size: this.createForm.size || undefined,
      location: this.createForm.location || undefined,
      contact_email: this.createForm.contact_email,
      contact_phone: this.createForm.contact_phone || undefined,
      logo_url: this.createForm.logo_url || undefined,
      can_create_tasks: this.createForm.can_create_tasks
    }).subscribe({
      next: (enterprise) => {
        this.actionLoading = false;
        this.closeCreateModal();
        this.loadEnterprises();
        this.notificationService.success(`Enterprise "${this.createForm.name}" created successfully!`);

        // If admin_user_id is selected, link the user to this enterprise
        if (this.createForm.admin_user_id) {
          this.linkEnterpriseUser(enterprise.id, this.createForm.admin_user_id);
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.notificationService.error('Échec de la création de l\'entreprise: ' + err.message);
        console.error('Create enterprise error:', err);
      }
    });
  }

  private linkEnterpriseUser(enterpriseId: string, userId: string): void {
    // Update the enterprise to set admin_user_id
    // We'll need to add this method to the admin service
    // For now, show a success message and note that linking should be completed
    this.notificationService.info('Pour compléter la liaison, veuillez mettre à jour l\'administrateur de l\'entreprise via la page de détails de l\'entreprise');
  }

  /**
   * Derive status from new schema boolean fields
   * New schema uses: is_active, is_suspended, is_verified
   */
  getEnterpriseStatus(enterprise: Enterprise): string {
    // Cast to any to access new schema fields
    const company = enterprise as any;

    if (!company.is_verified) {
      return 'pending';
    }
    if (company.is_suspended) {
      return 'suspended';
    }
    if (!company.is_active) {
      return 'banned';
    }
    return 'active';
  }

  getStatusBadge(enterprise: Enterprise): string {
    const status = this.getEnterpriseStatus(enterprise);
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      case 'banned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  openEditModal(enterprise: Enterprise): void {
    this.editingEnterprise = enterprise;
    this.showEditModal = true;

    // Populate edit form with current values
    this.editForm = {
      name: enterprise.name || '',
      sector: enterprise.sector || '',
      description: enterprise.description || '',
      website: enterprise.website || '',
      location: enterprise.location || '',
      size: enterprise.size || '',
      contact_email: enterprise.contact_email || '',
      contact_phone: enterprise.contact_phone || '',
      logo_url: enterprise.logo_url || '',
      can_create_tasks: enterprise.can_create_tasks || false,
      admin_user_id: (enterprise as any).admin_user_id || ''
    };

    this.validationErrors = {};
    this.loadEnterpriseUsers();
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingEnterprise = null;
  }

  updateEnterprise(): void {
    if (!this.editingEnterprise) return;

    // Validate form
    this.validationErrors = {};

    if (!this.editForm.name) {
      this.validationErrors['name'] = 'Enterprise name is required';
    }
    if (!this.editForm.sector) {
      this.validationErrors['sector'] = 'Industry/Sector is required';
    }
    if (!this.editForm.contact_email) {
      this.validationErrors['contact_email'] = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.editForm.contact_email)) {
      this.validationErrors['contact_email'] = 'Invalid email format';
    }
    if (this.editForm.website && !/^https?:\/\/.+/.test(this.editForm.website)) {
      this.validationErrors['website'] = 'Website must start with http:// or https://';
    }

    if (Object.keys(this.validationErrors).length > 0) {
      this.notificationService.error('Veuillez remplir tous les champs requis correctement');
      return;
    }

    this.actionLoading = true;

    // Update enterprise
    this.adminService.updateEnterprise(this.editingEnterprise.id, {
      name: this.editForm.name,
      industry: this.editForm.sector,
      description: this.editForm.description || undefined,
      website: this.editForm.website || undefined,
      size: this.editForm.size || undefined,
      location: this.editForm.location || undefined,
      contact_email: this.editForm.contact_email,
      contact_phone: this.editForm.contact_phone || undefined,
      logo_url: this.editForm.logo_url || undefined,
      can_create_tasks: this.editForm.can_create_tasks
    }).subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeEditModal();
        this.loadEnterprises();
        this.notificationService.success(`Enterprise "${this.editForm.name}" updated successfully!`);

        // If admin_user_id changed, update the link
        if (this.editForm.admin_user_id && this.editForm.admin_user_id !== (this.editingEnterprise as any).admin_user_id) {
          this.linkEnterpriseUser(this.editingEnterprise!.id, this.editForm.admin_user_id);
        }
      },
      error: (err: any) => {
        this.actionLoading = false;
        this.notificationService.error('Échec de la mise à jour de l\'entreprise: ' + err.message);
        console.error('Update enterprise error:', err);
      }
    });
  }
}
