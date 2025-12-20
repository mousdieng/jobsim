import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  user: User | null = null;
  isMobileMenuOpen = false;
  isProfileMenuOpen = false;
  private lastToggleTime = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  toggleMobileMenu(): void {
    // Prevent double-triggering from both touch and click events
    const now = Date.now();
    if (now - this.lastToggleTime < 300) {
      console.log('toggleMobileMenu: Ignoring duplicate event');
      return;
    }
    this.lastToggleTime = now;

    console.log('toggleMobileMenu called, current state:', this.isMobileMenuOpen);
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    console.log('toggleMobileMenu new state:', this.isMobileMenuOpen);
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
    this.router.navigate(['/auth/login']);
  }

  getInitials(): string {
    if (!this.user?.name) return 'U';
    const names = this.user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  formatJobField(field: string): string {
    return field.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  isAdmin(): boolean {
    return this.user?.user_type === 'admin';
  }

  isStudent(): boolean {
    return this.user?.user_type === 'student' || !this.user?.user_type;
  }

  isEnterprise(): boolean {
    return this.user?.user_type === 'enterprise';
  }

  isSupport(): boolean {
    return this.user?.user_type === 'support';
  }
}
