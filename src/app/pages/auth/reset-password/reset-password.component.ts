import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Check if we have a valid session (user clicked the reset link)
    this.checkSession();
  }

  async checkSession(): Promise<void> {
    const session = await this.supabase.getSession();
    if (!session) {
      this.errorMessage = 'Invalid or expired reset link. Please request a new one.';
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const { password } = this.resetPasswordForm.value;

      const { error } = await this.supabase.client.auth.updateUser({
        password: password
      });

      if (error) {
        this.errorMessage = error.message;
      } else {
        this.successMessage = 'Password updated successfully! Redirecting to login...';

        // Wait a moment before redirecting
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'An unexpected error occurred';
    } finally {
      this.isLoading = false;
    }
  }

  getErrorMessage(field: string): string | null {
    const control = this.resetPasswordForm.get(field);

    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return `${this.capitalize(field)} is required`;
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `${this.capitalize(field)} must be at least ${minLength} characters`;
    }

    return null;
  }

  getFormError(): string | null {
    if (this.resetPasswordForm.errors?.['passwordMismatch'] && this.resetPasswordForm.get('confirmPassword')?.touched) {
      return 'Passwords do not match';
    }
    return null;
  }

  private capitalize(str: string): string {
    if (str === 'confirmPassword') return 'Confirm password';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
