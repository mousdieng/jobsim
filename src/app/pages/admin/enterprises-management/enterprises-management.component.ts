import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
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

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute
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
      alert('Please provide a reason for this action');
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
      },
      error: (err) => {
        this.actionLoading = false;
        alert('Failed to perform action: ' + err.message);
        console.error('Action error:', err);
      }
    });
  }

  getStatusBadge(status: string): string {
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
}
