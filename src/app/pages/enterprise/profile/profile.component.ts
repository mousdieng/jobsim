import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { EnterpriseService } from '../../../services/enterprise.service';
import { Enterprise } from '../../../models/platform.model';

@Component({
  selector: 'app-enterprise-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class EnterpriseProfileComponent implements OnInit, OnDestroy {
  enterprise: Enterprise | null = null;
  isLoading = true;
  isEditing = false;
  isSaving = false;
  error: string | null = null;
  saveError: string | null = null;
  saveSuccess = false;

  // Edit form
  editForm = {
    description: '',
    logo_url: '',
    website: '',
    location: '',
    contact_email: '',
    contact_phone: ''
  };

  private subscriptions: Subscription[] = [];

  constructor(private enterpriseService: EnterpriseService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProfile(): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.enterpriseService.getEnterpriseProfile().subscribe({
      next: (enterprise) => {
        this.enterprise = enterprise;
        this.populateEditForm();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load profile';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  populateEditForm(): void {
    if (!this.enterprise) return;

    this.editForm = {
      description: this.enterprise.description || '',
      logo_url: this.enterprise.logo_url || '',
      website: this.enterprise.website || '',
      location: this.enterprise.location || '',
      contact_email: this.enterprise.contact_email || '',
      contact_phone: this.enterprise.contact_phone || ''
    };
  }

  startEditing(): void {
    this.populateEditForm();
    this.isEditing = true;
    this.saveError = null;
    this.saveSuccess = false;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.populateEditForm();
    this.saveError = null;
  }

  saveProfile(): void {
    this.isSaving = true;
    this.saveError = null;
    this.saveSuccess = false;

    const updateData = {
      description: this.editForm.description || undefined,
      logo_url: this.editForm.logo_url || undefined,
      website: this.editForm.website || undefined,
      location: this.editForm.location || undefined,
      contact_email: this.editForm.contact_email,
      contact_phone: this.editForm.contact_phone || undefined
    };

    const sub = this.enterpriseService.updateEnterpriseProfile(updateData).subscribe({
      next: (updatedEnterprise) => {
        this.enterprise = updatedEnterprise;
        this.saveSuccess = true;
        this.isEditing = false;
        this.isSaving = false;

        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      },
      error: (err) => {
        this.saveError = err.message || 'Failed to save profile';
        this.isSaving = false;
      }
    });
    this.subscriptions.push(sub);
  }

  getVerificationStatusColor(): string {
    if (!this.enterprise) return 'bg-gray-100 text-gray-800';

    if (this.enterprise.is_verified) {
      return 'bg-green-100 text-green-800';
    } else if (this.enterprise.status === 'pending') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (this.enterprise.status === 'suspended') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  getVerificationStatusText(): string {
    if (!this.enterprise) return 'Unknown';

    if (this.enterprise.is_verified) {
      return 'Verified';
    } else if (this.enterprise.status === 'pending') {
      return 'Pending Verification';
    } else if (this.enterprise.status === 'suspended') {
      return 'Suspended';
    }
    return this.enterprise.status;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
