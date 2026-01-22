import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/database.types';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  // Available roles for registration
  availableRoles: { value: UserRole; label: string; description: string }[] = [
    {
      value: 'candidate',
      label: 'Candidate',
      description: 'Join as a candidate to complete tasks and gain experience'
    },
    {
      value: 'enterprise_rep',
      label: 'Enterprise Representative',
      description: 'Represent your company, create tasks, and review submissions'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {
    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['candidate', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
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
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    try {
      const { full_name, email, password, role } = this.registerForm.value;

      this.successMessage = 'Creating your account...';

      const response = await this.authService.signUp({
        full_name,
        email,
        password,
        role
      });

      if (response.error) {
        this.errorMessage = response.error;
        this.successMessage = null;
      } else if (response.data) {
        this.successMessage = 'Account created successfully! Redirecting...';

        // Redirect based on role
        setTimeout(() => {
          const user = response.data!;
          switch (user.role) {
            case 'candidate':
              this.router.navigate(['/app/dashboard']);
              break;
            case 'enterprise_rep':
              this.router.navigate(['/app/enterprise/dashboard']);
              break;
            default:
              this.router.navigate(['/app/dashboard']);
          }
        }, 1500);
      } else {
        this.errorMessage = 'Account created but profile is still loading. Please try signing in.';
        this.successMessage = null;
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'An unexpected error occurred';
      this.successMessage = null;
    } finally {
      this.isLoading = false;
    }
  }

  getErrorMessage(field: string): string | null {
    const control = this.registerForm.get(field);

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
      const minLength = control.errors['minlength'].requiredLength;
      return `${this.capitalize(field)} must be at least ${minLength} characters`;
    }

    return null;
  }

  getFormError(): string | null {
    if (this.registerForm.errors?.['passwordMismatch'] && this.registerForm.get('confirmPassword')?.touched) {
      return 'Passwords do not match';
    }
    return null;
  }

  private capitalize(str: string): string {
    if (str === 'full_name') return 'Full name';
    if (str === 'role') return 'Role';
    if (str === 'confirmPassword') return 'Confirm password';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Calculate password strength
   * Returns: 0 (weak), 1 (medium), 2 (strong)
   */
  getPasswordStrength(): number {
    const password = this.registerForm.get('password')?.value || '';

    if (password.length === 0) return 0;

    let strength = 0;

    // Check length
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Check for numbers
    if (/\d/.test(password)) strength++;

    // Check for lowercase and uppercase
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;

    // Check for special characters
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    // Normalize to 0-2 scale
    if (strength <= 2) return 0; // weak
    if (strength <= 3) return 1; // medium
    return 2; // strong
  }

  /**
   * Get password strength label
   */
  getPasswordStrengthLabel(): string {
    const strength = this.getPasswordStrength();
    const password = this.registerForm.get('password')?.value || '';

    if (password.length === 0) return '';

    switch (strength) {
      case 0: return 'Faible';
      case 1: return 'Moyen';
      case 2: return 'Fort';
      default: return '';
    }
  }

  /**
   * Get password strength color class
   */
  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();

    switch (strength) {
      case 0: return 'text-red-600';
      case 1: return 'text-yellow-600';
      case 2: return 'text-green-600';
      default: return 'text-gray-500';
    }
  }

  /**
   * Get password strength bar color class
   */
  getPasswordStrengthBarColor(): string {
    const strength = this.getPasswordStrength();

    switch (strength) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  }

  /**
   * Get password strength bar width
   */
  getPasswordStrengthWidth(): string {
    const strength = this.getPasswordStrength();
    const password = this.registerForm.get('password')?.value || '';

    if (password.length === 0) return '0%';

    switch (strength) {
      case 0: return '33%';
      case 1: return '66%';
      case 2: return '100%';
      default: return '0%';
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
