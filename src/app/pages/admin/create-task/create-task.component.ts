import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TaskService } from '../../../core/services/task.service';
import { StorageService } from '../../../core/services/storage.service';
import {
  TaskDifficulty,
  TaskStatus,
  SubmissionFileConfig,
  SubmissionConfig,
  TaskAttachment
} from '../../../core/models/database.types';

@Component({
  selector: 'app-create-task',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-task.component.html',
  styleUrls: ['./create-task.component.css']
})
export class CreateTaskComponent implements OnInit {
  taskForm!: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  success = false;

  // Options
  difficultyLevels: TaskDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  statusOptions: TaskStatus[] = ['draft', 'active', 'archived'];
  fileTypes: Array<{ value: string; label: string }> = [
    { value: 'document', label: 'Document' },
    { value: 'images', label: 'Images' },
    { value: 'spreadsheet', label: 'Spreadsheet' },
    { value: 'design', label: 'Design File' },
    { value: 'video', label: 'Video' },
    { value: 'code', label: 'Code' }
  ];

  // Common categories
  categories: string[] = [
    'Marketing',
    'Sales',
    'Design',
    'Development',
    'Data Analysis',
    'Customer Service',
    'Project Management',
    'Content Writing',
    'Human Resources',
    'Finance'
  ];

  // Attachments
  taskAttachments: File[] = [];
  uploadingAttachments = false;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private storageService: StorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      instructions: ['', [Validators.required, Validators.minLength(50)]],
      category: ['', Validators.required],
      job_role: ['', Validators.required],
      skill_tags: ['', Validators.required],
      difficulty: ['beginner', Validators.required],
      base_xp: [100, [Validators.required, Validators.min(100), Validators.max(1000)]],
      estimated_time_minutes: [60, [Validators.min(5), Validators.max(480)]],
      evaluation_criteria: ['', Validators.required],
      status: ['draft', Validators.required],
      requiredFiles: this.fb.array([]),
      optionalFiles: this.fb.array([])
    });

    // Add at least one required file field
    this.addRequiredFile();
  }

  // Form Array Getters
  get requiredFiles(): FormArray {
    return this.taskForm.get('requiredFiles') as FormArray;
  }

  get optionalFiles(): FormArray {
    return this.taskForm.get('optionalFiles') as FormArray;
  }

  // File Config Management
  createFileConfigGroup(): FormGroup {
    return this.fb.group({
      label: ['', Validators.required],
      type: ['document', Validators.required],
      allowed_formats: ['', Validators.required],
      max_size_mb: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
      max_files: [1, [Validators.min(1), Validators.max(10)]],
      description: ['', Validators.required]
    });
  }

  addRequiredFile(): void {
    this.requiredFiles.push(this.createFileConfigGroup());
  }

  removeRequiredFile(index: number): void {
    if (this.requiredFiles.length > 1) {
      this.requiredFiles.removeAt(index);
    }
  }

  addOptionalFile(): void {
    this.optionalFiles.push(this.createFileConfigGroup());
  }

  removeOptionalFile(index: number): void {
    this.optionalFiles.removeAt(index);
  }

  // Attachment Management
  onAttachmentsSelected(event: any): void {
    const files = Array.from(event.target.files) as File[];
    this.taskAttachments = [...this.taskAttachments, ...files];
  }

  removeAttachment(index: number): void {
    this.taskAttachments.splice(index, 1);
  }

  // Helpers
  getDifficultyMultiplier(difficulty: TaskDifficulty): number {
    const multipliers = {
      beginner: 1.0,
      intermediate: 1.5,
      advanced: 2.0,
      expert: 3.0
    };
    return multipliers[difficulty] || 1.0;
  }

  calculateMaxXP(): number {
    const baseXp = this.taskForm.get('base_xp')?.value || 100;
    const difficulty = this.taskForm.get('difficulty')?.value || 'beginner';
    const multiplier = this.getDifficultyMultiplier(difficulty);
    return Math.round(baseXp * multiplier * 2.0); // First attempt multiplier
  }

  // Validation
  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (!field) return '';

    if (field.errors?.['required']) return 'This field is required';
    if (field.errors?.['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
    if (field.errors?.['maxlength']) return `Maximum length is ${field.errors['maxlength'].requiredLength}`;
    if (field.errors?.['min']) return `Minimum value is ${field.errors['min'].min}`;
    if (field.errors?.['max']) return `Maximum value is ${field.errors['max'].max}`;

    return '';
  }

  // Form Submission
  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.error = 'Please fill in all required fields correctly';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    try {
      // 1. Upload attachments if any
      let uploadedAttachments: TaskAttachment[] = [];
      if (this.taskAttachments.length > 0) {
        uploadedAttachments = await this.uploadTaskAttachments();
      }

      // 2. Parse form data
      const formValue = this.taskForm.value;

      // Parse skill tags (comma-separated)
      const skillTags = formValue.skill_tags
        .split(',')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      // Parse evaluation criteria (newline-separated)
      const evaluationCriteria = formValue.evaluation_criteria
        .split('\n')
        .map((criterion: string) => criterion.trim())
        .filter((criterion: string) => criterion.length > 0);

      // Build submission config
      const requiredFiles: SubmissionFileConfig[] = this.requiredFiles.value.map((fileConfig: any) => ({
        label: fileConfig.label,
        type: fileConfig.type,
        allowed_formats: fileConfig.allowed_formats.split(',').map((f: string) => f.trim()),
        max_size_mb: fileConfig.max_size_mb,
        max_files: fileConfig.max_files,
        description: fileConfig.description
      }));

      const optionalFiles: SubmissionFileConfig[] = this.optionalFiles.value.map((fileConfig: any) => ({
        label: fileConfig.label,
        type: fileConfig.type,
        allowed_formats: fileConfig.allowed_formats.split(',').map((f: string) => f.trim()),
        max_size_mb: fileConfig.max_size_mb,
        max_files: fileConfig.max_files,
        description: fileConfig.description
      }));

      const submissionConfig: SubmissionConfig = {
        required_files: requiredFiles,
        optional_files: optionalFiles.length > 0 ? optionalFiles : undefined
      };

      // 3. Create task
      const taskData = {
        title: formValue.title,
        description: formValue.description,
        instructions: formValue.instructions,
        category: formValue.category,
        job_role: formValue.job_role,
        skill_tags: skillTags,
        difficulty: formValue.difficulty,
        base_xp: formValue.base_xp,
        difficulty_multiplier: this.getDifficultyMultiplier(formValue.difficulty),
        estimated_time_minutes: formValue.estimated_time_minutes || null,
        submission_config: submissionConfig,
        evaluation_criteria: evaluationCriteria,
        attachments: uploadedAttachments,
        status: formValue.status
      };

      // 4. Submit to service
      this.taskService.createTask(taskData).subscribe(result => {
        if (result.error) {
          this.error = result.error;
          this.isSubmitting = false;
        } else {
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/app/admin/tasks']);
          }, 2000);
        }
      });
    } catch (err: any) {
      this.error = err.message || 'Failed to create task';
      this.isSubmitting = false;
    }
  }

  async uploadTaskAttachments(): Promise<TaskAttachment[]> {
    this.uploadingAttachments = true;
    const tempTaskId = 'temp-' + Date.now();

    try {
      const uploadResult = await this.storageService.uploadTaskAttachments(
        tempTaskId,
        this.taskAttachments
      ).toPromise();

      if (!uploadResult?.data) {
        throw new Error('Attachment upload failed');
      }

      return uploadResult.data;
    } finally {
      this.uploadingAttachments = false;
    }
  }

  cancel(): void {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      this.router.navigate(['/app/admin/tasks']);
    }
  }
}
