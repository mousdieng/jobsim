import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { EnterpriseService } from '../../../services/enterprise.service';
import { AuthService } from '../../../services/auth.service';
import { PermissionService } from '../../../services/permission.service';
import { EnterpriseStats, Enterprise } from '../../../models/platform.model';

@Component({
  selector: 'app-enterprise-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class EnterpriseDashboardComponent implements OnInit, OnDestroy {
  enterprise: Enterprise | null = null;
  stats: EnterpriseStats | null = null;
  isLoading = true;
  error: string | null = null;
  canCreateTasksFlag = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private enterpriseService: EnterpriseService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.checkTaskCreationPermission();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    // Load enterprise profile
    const profileSub = this.enterpriseService.getEnterpriseProfile().subscribe({
      next: (enterprise) => {
        this.enterprise = enterprise;

        // Load stats after enterprise is loaded
        const statsSub = this.enterpriseService.getEnterpriseStats().subscribe({
          next: (stats) => {
            this.stats = stats;
            this.isLoading = false;
          },
          error: (err) => {
            this.error = err.message || 'Failed to load statistics';
            this.isLoading = false;
          }
        });
        this.subscriptions.push(statsSub);
      },
      error: (err) => {
        this.error = err.message || 'Failed to load enterprise profile';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(profileSub);
  }

  checkTaskCreationPermission(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.user_type) {
      this.canCreateTasksFlag = this.permissionService.canCreateTasks(user.user_type);
    }
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

  canCreateTasks(): boolean {
    return this.canCreateTasksFlag;
  }
}
