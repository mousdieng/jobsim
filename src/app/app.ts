import { Component, OnInit } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    NgIf,
    AsyncPipe,
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App implements OnInit {
  isAuthenticated$: Observable<boolean>;
  isLoading$: Observable<boolean>;
  currentUser$: Observable<User | null>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.isLoading$ = this.authService.loading$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Navigation is handled by Angular Router
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  navigateHome(): void {
    this.router.navigate(['/home']);
  }

  handleSignOut(): void {
    this.authService.signOut();
  }
}
