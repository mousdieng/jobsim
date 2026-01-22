import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { ApiResponse } from '../models/database.types';
import { AuthService } from './auth.service';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadResult {
  path: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Storage Service - Handles all Supabase Storage operations
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  // Storage bucket names
  private readonly BUCKETS = {
    TASK_ATTACHMENTS: 'task-attachments',
    SUBMISSION_FILES: 'submission-files',
    AVATARS: 'avatars',
    COMPANY_LOGOS: 'company-logos'
  };

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService
  ) {}

  /**
   * Upload a file to a specific bucket
   */
  uploadFile(
    bucket: string,
    path: string,
    file: File
  ): Observable<ApiResponse<FileUploadResult>> {
    return from(
      (async () => {
        const { data, error } = await this.supabase.client.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          return { data: null, error };
        }

        // Get public URL
        const { data: urlData } = this.supabase.client.storage
          .from(bucket)
          .getPublicUrl(path);

        const result: FileUploadResult = {
          path: data.path,
          url: urlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type
        };

        return { data: result, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Upload multiple files
   */
  uploadFiles(
    bucket: string,
    basePath: string,
    files: File[]
  ): Observable<ApiResponse<FileUploadResult[]>> {
    return from(
      (async () => {
        const results: FileUploadResult[] = [];

        for (const file of files) {
          const fileName = `${Date.now()}-${file.name}`;
          const path = `${basePath}/${fileName}`;

          const { data, error } = await this.supabase.client.storage
            .from(bucket)
            .upload(path, file);

          if (error) {
            return { data: null, error };
          }

          const { data: urlData } = this.supabase.client.storage
            .from(bucket)
            .getPublicUrl(path);

          results.push({
            path: data.path,
            url: urlData.publicUrl,
            name: file.name,
            size: file.size,
            type: file.type
          });
        }

        return { data: results, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Delete a file
   */
  deleteFile(bucket: string, path: string): Observable<ApiResponse<void>> {
    return from(
      this.supabase.client.storage.from(bucket).remove([path])
    ).pipe(
      map(({ data, error }) => ({
        data: null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Delete multiple files
   */
  deleteFiles(bucket: string, paths: string[]): Observable<ApiResponse<void>> {
    return from(
      this.supabase.client.storage.from(bucket).remove(paths)
    ).pipe(
      map(({ data, error }) => ({
        data: null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Download a file
   */
  downloadFile(bucket: string, path: string): Observable<ApiResponse<Blob>> {
    return from(
      this.supabase.client.storage.from(bucket).download(path)
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * List files in a directory
   */
  listFiles(bucket: string, path: string = ''): Observable<ApiResponse<any[]>> {
    return from(
      this.supabase.client.storage.from(bucket).list(path)
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Upload submission files
   */
  uploadSubmissionFiles(
    submissionId: string,
    candidateId: string,
    files: File[]
  ): Observable<ApiResponse<FileUploadResult[]>> {
    const basePath = `submissions/${candidateId}/${submissionId}`;
    return this.uploadFiles(this.BUCKETS.SUBMISSION_FILES, basePath, files);
  }

  /**
   * Upload task attachment (Admin only)
   */
  uploadTaskAttachment(
    taskId: string,
    file: File
  ): Observable<ApiResponse<FileUploadResult>> {
    const user = this.authService.getCurrentUser();

    if (!user || user.role !== 'admin') {
      return from(Promise.resolve({
        data: null,
        error: 'Only admins can upload task attachments'
      }));
    }

    const fileName = `${Date.now()}-${file.name}`;
    const path = `tasks/${taskId}/${fileName}`;

    return this.uploadFile(this.BUCKETS.TASK_ATTACHMENTS, path, file);
  }

  /**
   * Upload multiple task attachments (Admin only)
   */
  uploadTaskAttachments(
    taskId: string,
    files: File[]
  ): Observable<ApiResponse<any[]>> {
    const user = this.authService.getCurrentUser();

    if (!user || user.role !== 'admin') {
      return from(Promise.resolve({
        data: null,
        error: 'Only admins can upload task attachments'
      }));
    }

    const basePath = `tasks/${taskId}`;
    return this.uploadFiles(this.BUCKETS.TASK_ATTACHMENTS, basePath, files);
  }

  /**
   * Upload avatar
   */
  uploadAvatar(userId: string, file: File): Observable<ApiResponse<FileUploadResult>> {
    // Delete old avatar first
    const oldPath = `${userId}/avatar`;

    return from(
      (async () => {
        // Try to delete old avatar (ignore errors if it doesn't exist)
        await this.supabase.client.storage
          .from(this.BUCKETS.AVATARS)
          .remove([oldPath]);

        // Upload new avatar
        const { data, error } = await this.supabase.client.storage
          .from(this.BUCKETS.AVATARS)
          .upload(oldPath, file, { upsert: true });

        if (error) {
          return { data: null, error };
        }

        const { data: urlData } = this.supabase.client.storage
          .from(this.BUCKETS.AVATARS)
          .getPublicUrl(oldPath);

        const result: FileUploadResult = {
          path: data.path,
          url: urlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type
        };

        // Update profile with new avatar URL
        await this.supabase.client
          .from('profiles')
          .update({ avatar_url: result.url })
          .eq('id', userId);

        return { data: result, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Upload company logo (Enterprise Rep only)
   */
  uploadCompanyLogo(
    companyId: string,
    file: File
  ): Observable<ApiResponse<FileUploadResult>> {
    const user = this.authService.getCurrentUser();

    if (!user || (user.role !== 'enterprise_rep' && user.role !== 'admin')) {
      return from(Promise.resolve({
        data: null,
        error: 'Only enterprise reps and admins can upload company logos'
      }));
    }

    const oldPath = `${companyId}/logo`;

    return from(
      (async () => {
        // Delete old logo
        await this.supabase.client.storage
          .from(this.BUCKETS.COMPANY_LOGOS)
          .remove([oldPath]);

        // Upload new logo
        const { data, error } = await this.supabase.client.storage
          .from(this.BUCKETS.COMPANY_LOGOS)
          .upload(oldPath, file, { upsert: true });

        if (error) {
          return { data: null, error };
        }

        const { data: urlData } = this.supabase.client.storage
          .from(this.BUCKETS.COMPANY_LOGOS)
          .getPublicUrl(oldPath);

        const result: FileUploadResult = {
          path: data.path,
          url: urlData.publicUrl,
          name: file.name,
          size: file.size,
          type: file.type
        };

        // Update company with new logo URL
        await this.supabase.client
          .from('companies')
          .update({ logo_url: result.url })
          .eq('id', companyId);

        return { data: result, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    allowedFormats: string[],
    maxSizeMB: number
  ): { valid: boolean; error?: string } {
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !allowedFormats.includes(extension)) {
      return {
        valid: false,
        error: `Invalid file format. Allowed: ${allowedFormats.join(', ')}`
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `File too large. Maximum ${maxSizeMB}MB allowed`
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();

    const iconMap: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      csv: '📊',
      ppt: '📊',
      pptx: '📊',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      svg: '🖼️',
      mp4: '🎥',
      mov: '🎥',
      avi: '🎥',
      zip: '🗜️',
      rar: '🗜️',
      txt: '📃',
      md: '📃'
    };

    return iconMap[extension || ''] || '📎';
  }
}
