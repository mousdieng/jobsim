import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { JobField, ExperienceLevel } from '../../models/platform.model';

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

  // Edit form
  editForm = {
    name: '',
    bio: '',
    location: '',
    job_field: 'other' as JobField,
    experience_level: 'junior' as ExperienceLevel,
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    skills: '',
    is_available_for_hire: true
  };

  jobFields: JobField[] = [
    'software_engineering',
    'accounting',
    'marketing',
    'sales',
    'human_resources',
    'project_management',
    'data_science',
    'graphic_design',
    'customer_service',
    'finance',
    'legal',
    'healthcare',
    'education',
    'operations',
    'consulting',
    'other'
  ];

  experienceLevels: ExperienceLevel[] = ['junior', 'mid', 'senior'];

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
      name: this.user.name || '',
      bio: this.user.bio || '',
      location: this.user.location || '',
      job_field: this.user.job_field || 'other',
      experience_level: this.user.experience_level || 'junior',
      linkedin_url: this.user.linkedin_url || '',
      github_url: this.user.github_url || '',
      portfolio_url: this.user.portfolio_url || '',
      skills: this.user.skills?.join(', ') || '',
      is_available_for_hire: this.user.is_available_for_hire ?? true
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

      const response = await this.authService.updateProfile({
        name: this.editForm.name,
        bio: this.editForm.bio || undefined,
        location: this.editForm.location || undefined,
        job_field: this.editForm.job_field,
        experience_level: this.editForm.experience_level,
        linkedin_url: this.editForm.linkedin_url || undefined,
        github_url: this.editForm.github_url || undefined,
        portfolio_url: this.editForm.portfolio_url || undefined,
        skills: skills,
        is_available_for_hire: this.editForm.is_available_for_hire
      });

      if (response.error) {
        this.saveError = response.error;
      } else {
        this.saveSuccess = true;
        this.isEditing = false;
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      }
    } catch (err: any) {
      this.saveError = err.message || 'Failed to save profile';
    } finally {
      this.isSaving = false;
    }
  }

}
