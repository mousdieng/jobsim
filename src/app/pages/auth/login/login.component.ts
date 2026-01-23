import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/database.types';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  showPassword = false;
  returnUrl: string = '/app/dashboard';
  connectionWarning = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {
    // Get return URL from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/app/dashboard';

    // Check if there was a connection error
    if (this.route.snapshot.queryParams['connectionError'] === 'true') {
      this.connectionWarning = true;
      // Clear the query param to avoid showing the warning after page refresh
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { connectionError: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const { email, password } = this.loginForm.value;
      const response = await this.authService.signIn({ email, password });

      if (response.error) {
        this.errorMessage = response.error;
      } else if (response.data) {
        // Successful login - route based on user role
        const user: User = response.data;

        switch (user.role) {
          case 'candidate':
            this.router.navigate(['/app/dashboard']);
            break;
          case 'enterprise_rep':
            this.router.navigate(['/app/enterprise/dashboard']);
            break;
          case 'admin':
            this.router.navigate(['/app/admin/dashboard']);
            break;
          case 'platform_support':
            this.router.navigate(['/app/support/dashboard']);
            break;
          default:
            // Fallback to return URL
            this.router.navigateByUrl(this.returnUrl);
        }
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'An unexpected error occurred';
    } finally {
      this.isLoading = false;
    }
  }

  getErrorMessage(field: string): string | null {
    const control = this.loginForm.get(field);

    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return this.translate.instant('validation.required', { field: this.capitalize(field) });
    }

    if (control.errors['email']) {
      return this.translate.instant('validation.email');
    }

    if (control.errors['minlength']) {
      return this.translate.instant('validation.min_length', {
        field: this.capitalize(field),
        length: control.errors['minlength'].requiredLength
      });
    }

    return null;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
