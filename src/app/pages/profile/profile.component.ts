import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/database.types';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isEditing = false;
  isSaving = false;
  saveError: string | null = null;
  saveSuccess = false;

  // Edit form - matches new schema
  editForm = {
    full_name: '',
    avatar_url: '',
    linkedin_url: '',
    portfolio_url: '',
    skills: '',
    preferred_categories: '',
    availability_hours: 0
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.populateEditForm();
      }
    });
  }

  populateEditForm(): void {
    if (!this.user) return;

    this.editForm = {
      full_name: this.user.full_name || '',
      avatar_url: this.user.avatar_url || '',
      linkedin_url: this.user.candidateProfile?.linkedin_url || '',
      portfolio_url: this.user.candidateProfile?.portfolio_url || '',
      skills: this.user.candidateProfile?.skills?.join(', ') || '',
      preferred_categories: this.user.candidateProfile?.preferred_categories?.join(', ') || '',
      availability_hours: this.user.candidateProfile?.availability_hours || 0
    };
  }

  startEditing(): void {
    this.populateEditForm();
    this.isEditing = true;
    this.saveError = null;
    this.saveSuccess = false;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.populateEditForm();
  }

  async saveProfile(): Promise<void> {
    this.isSaving = true;
    this.saveError = null;
    this.saveSuccess = false;

    try {
      const skills = this.editForm.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const categories = this.editForm.preferred_categories
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Update base profile
      const profileResponse = await this.authService.updateProfile({
        full_name: this.editForm.full_name,
        avatar_url: this.editForm.avatar_url || undefined
      });

      if (profileResponse.error) {
        this.saveError = profileResponse.error;
        return;
      }

      // Update candidate profile if user is a candidate
      if (this.user?.role === 'candidate') {
        const candidateResponse = await this.authService.updateCandidateProfile({
          linkedin_url: this.editForm.linkedin_url || undefined,
          portfolio_url: this.editForm.portfolio_url || undefined,
          skills: skills.length > 0 ? skills : undefined,
          preferred_categories: categories.length > 0 ? categories : undefined,
          availability_hours: this.editForm.availability_hours || undefined
        });

        if (candidateResponse.error) {
          this.saveError = candidateResponse.error;
          return;
        }
      }

      this.saveSuccess = true;
      this.isEditing = false;
      setTimeout(() => {
        this.saveSuccess = false;
      }, 3000);
    } catch (err: any) {
      this.saveError = err.message || 'Failed to save profile';
    } finally {
      this.isSaving = false;
    }
  }

}
