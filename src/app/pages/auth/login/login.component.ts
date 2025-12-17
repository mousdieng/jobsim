import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  showPassword = false;
  returnUrl: string = '/app/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Get return URL from route parameters or default to dashboard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/app/dashboard';

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
      } else if (response.user) {
        // Successful login, navigate to return URL
        this.router.navigateByUrl(this.returnUrl);
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
      return `${this.capitalize(field)} is required`;
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }

    if (control.errors['minlength']) {
      return `${this.capitalize(field)} must be at least ${control.errors['minlength'].requiredLength} characters`;
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
