import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validators for Angular forms
 */

/**
 * Validates that two form controls have matching values
 * Usage: Add to FormGroup validators
 * Example:
 * this.form = this.fb.group({
 *   password: [''],
 *   confirmPassword: ['']
 * }, { validators: matchFieldsValidator('password', 'confirmPassword') });
 */
export function matchFieldsValidator(
  controlName: string,
  matchingControlName: string
): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const control = formGroup.get(controlName);
    const matchingControl = formGroup.get(matchingControlName);

    if (!control || !matchingControl) {
      return null;
    }

    if (matchingControl.errors && !matchingControl.errors['fieldsMismatch']) {
      return null;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ fieldsMismatch: true });
      return { fieldsMismatch: true };
    } else {
      matchingControl.setErrors(null);
      return null;
    }
  };
}

/**
 * Validates email format
 * More strict than default Angular email validator
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const valid = emailRegex.test(control.value);

    return valid ? null : { invalidEmail: true };
  };
}

/**
 * Validates password strength
 * Requirements: At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(control.value);
    const hasLowerCase = /[a-z]/.test(control.value);
    const hasNumber = /[0-9]/.test(control.value);
    const hasMinLength = control.value.length >= 8;

    const passwordValid = hasUpperCase && hasLowerCase && hasNumber && hasMinLength;

    if (!passwordValid) {
      return {
        weakPassword: {
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasMinLength
        }
      };
    }

    return null;
  };
}

/**
 * Validates that a string contains no whitespace
 */
export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const hasWhitespace = /\s/.test(control.value);
    return hasWhitespace ? { hasWhitespace: true } : null;
  };
}

/**
 * Validates URL format
 */
export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    try {
      new URL(control.value);
      return null;
    } catch {
      return { invalidUrl: true };
    }
  };
}

/**
 * Validates phone number format (international)
 */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    // Basic international phone validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const valid = phoneRegex.test(control.value.replace(/[\s()-]/g, ''));

    return valid ? null : { invalidPhone: true };
  };
}
