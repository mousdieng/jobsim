import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-support-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './support-layout.component.html',
  styleUrls: ['./support-layout.component.css']
})
export class SupportLayoutComponent {
  isSidebarCollapsed = false;

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/support/dashboard', icon: 'chart' },
    { label: 'Tickets', route: '/support/tickets', icon: 'ticket' },
    { label: 'User Assistance', route: '/support/users', icon: 'users' },
    { label: 'Task Moderation', route: '/support/tasks', icon: 'flag' },
    { label: 'Escalations', route: '/support/escalations', icon: 'alert' },
    { label: 'Knowledge Base', route: '/support/knowledge', icon: 'book' },
    { label: 'Activity Logs', route: '/support/logs', icon: 'history' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }

  getIconPath(icon: string): string {
    const icons: { [key: string]: string } = {
      'chart': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      'ticket': 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
      'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      'flag': 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
      'alert': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'book': 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      'history': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    return icons[icon] || icons['chart'];
  }
}
