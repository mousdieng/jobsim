import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isLoading = false;
    });
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }

  getUserTypeLabel(): string {
    if (!this.currentUser) return '';

    const type = this.currentUser.user_type || this.currentUser.role?.toLowerCase();
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'User';
  }
}
