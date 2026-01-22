import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';
import { NotificationToastComponent } from '../../components/notification-toast/notification-toast.component';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NotificationToastComponent],
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
    private router: Router,
    public languageService: LanguageService
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

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  isStudent(): boolean {
    return this.user?.role === 'candidate' || !this.user?.role;
  }

  isEnterprise(): boolean {
    return this.user?.role === 'enterprise_rep';
  }

  isSupport(): boolean {
    return this.user?.role === 'platform_support';
  }
}
