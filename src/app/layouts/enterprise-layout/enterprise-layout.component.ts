import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EnterpriseService } from '../../services/enterprise.service';
import { Enterprise } from '../../models/platform.model';
import { NotificationToastComponent } from '../../components/notification-toast/notification-toast.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  visible?: boolean;
}

@Component({
  selector: 'app-enterprise-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationToastComponent],
  templateUrl: './enterprise-layout.component.html',
  styleUrls: ['./enterprise-layout.component.css']
})
export class EnterpriseLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  enterprise: Enterprise | null = null;
  canCreateTasks = false;
  loading = true;
  noEnterpriseLinked = false;

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      route: '/enterprise/dashboard',
      visible: true
    },
    {
      label: 'Company Profile',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      route: '/enterprise/profile',
      visible: true
    },
    {
      label: 'Tasks',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      route: '/enterprise/tasks',
      visible: true
    },
    {
      label: 'Analytics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      route: '/enterprise/analytics',
      visible: true
    }
    // TODO: Uncomment these routes once the components are created
    // {
    //   label: 'Candidates',
    //   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    //   route: '/enterprise/candidates',
    //   visible: true
    // },
    // {
    //   label: 'Support',
    //   icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
    //   route: '/enterprise/support',
    //   visible: true
    // },
    // {
    //   label: 'Notifications',
    //   icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    //   route: '/enterprise/notifications',
    //   visible: true
    // }
  ];

  constructor(
    private authService: AuthService,
    private enterpriseService: EnterpriseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEnterpriseData();
  }

  loadEnterpriseData(): void {
    this.loading = true;

    // Load enterprise profile
    this.enterpriseService.getEnterpriseProfile().subscribe({
      next: (enterprise) => {
        this.enterprise = enterprise;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading enterprise:', err);
        this.loading = false;

        // Check if the error is about no enterprise linked
        if (err.message === 'NO_ENTERPRISE_LINKED') {
          // User is enterprise role but not linked to any enterprise yet
          // This is expected for newly created enterprise users
          console.warn('Enterprise user not linked to any enterprise');
          this.noEnterpriseLinked = true;
        }
      }
    });

    // Check task creation permission (will also fail if no enterprise)
    this.enterpriseService.canCreateTasks().subscribe({
      next: (canCreate) => {
        this.canCreateTasks = canCreate;
      },
      error: (err) => {
        // Silently handle - expected if no enterprise linked
        this.canCreateTasks = false;
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  async logout(): Promise<void> {
    try {
      await this.authService.signOut();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getInitials(): string {
    if (!this.enterprise?.name) return 'E';
    return this.enterprise.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
}
