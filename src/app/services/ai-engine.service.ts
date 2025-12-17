import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  JobField,
  DifficultyLevel,
  MeetingType,
  Task,
  Meeting,
} from '../models/platform.model';

export interface TaskGenerationRequest {
  job_field: JobField;
  difficulty_level: DifficultyLevel;
  count?: number;
  specific_skills?: string[];
  context?: string;
}

export interface GeneratedTask {
  title: string;
  description: string;
  instructions: string;
  job_field: JobField;
  difficulty_level: DifficultyLevel;
  estimated_duration: string;
  skills_required: string[];
  deliverables: any[];
  resources: any[];
  tags: string[];
}

export interface MeetingGenerationRequest {
  task_id: string;
  meeting_type: MeetingType;
  user_id: string;
}

export interface EvaluationResult {
  overall_score: number;
  letter_grade: string;
  criteria_breakdown: {
    criterion: string;
    weight: number;
    score: number;
    max_score: number;
    feedback: string;
  }[];
  strengths: string[];
  areas_for_improvement: string[];
  detailed_feedback: string;
  recommendations: string[];
}

export interface AIResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AIEngineService {
  private apiUrl: string;

  constructor(private http: HttpClient) {
    this.apiUrl = environment.aiEngineUrl || 'http://localhost:3001/api';
  }

  // Task Generation
  generateTasks(request: TaskGenerationRequest): Observable<GeneratedTask[]> {
    return this.http
      .post<AIResponse<GeneratedTask[]>>(`${this.apiUrl}/tasks/generate`, request)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error || 'Task generation failed');
          }
          return response.data;
        }),
        catchError((error) => {
          console.error('AI Engine Error:', error);
          throw error;
        })
      );
  }

  generateAndSaveTasks(request: TaskGenerationRequest): Observable<{ task_ids: string[] }> {
    return this.http
      .post<AIResponse<{ task_ids: string[] }>>(`${this.apiUrl}/tasks/generate-and-save`, request)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error || 'Task generation and save failed');
          }
          return response.data;
        }),
        catchError((error) => {
          console.error('AI Engine Error:', error);
          throw error;
        })
      );
  }

  balanceTaskCatalog(): Observable<{ field: JobField; generated: number }[]> {
    return this.http
      .post<AIResponse<{ field: JobField; generated: number }[]>>(
        `${this.apiUrl}/tasks/balance-catalog`,
        {}
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error || 'Catalog balancing failed');
          }
          return response.data;
        }),
        catchError((error) => {
          console.error('AI Engine Error:', error);
          throw error;
        })
      );
  }

  // Meeting Simulation
  generateMeeting(request: MeetingGenerationRequest): Observable<{ meeting_id: string }> {
    return this.http
      .post<AIResponse<{ meeting_id: string }>>(`${this.apiUrl}/meetings/generate`, request)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error || 'Meeting generation failed');
          }
          return response.data;
        }),
        catchError((error) => {
          console.error('AI Engine Error:', error);
          throw error;
        })
      );
  }

  generateMeetingSeries(
    taskId: string,
    userId: string
  ): Observable<{ meeting_ids: string[] }> {
    return this.http
      .post<AIResponse<{ meeting_ids: string[] }>>(`${this.apiUrl}/meetings/generate-series`, {
        task_id: taskId,
        user_id: userId,
      })
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error || 'Meeting series generation failed');
          }
          return response.data;
        }),
        catchError((error) => {
          console.error('AI Engine Error:', error);
          throw error;
        })
      );
  }

  // Evaluation
  evaluateSubmission(submissionId: string): Observable<EvaluationResult> {
    return this.http
      .post<AIResponse<EvaluationResult>>(`${this.apiUrl}/evaluations/evaluate`, {
        submission_id: submissionId,
      })
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error || 'Evaluation failed');
          }
          return response.data;
        }),
        catchError((error) => {
          console.error('AI Engine Error:', error);
          throw error;
        })
      );
  }

  batchEvaluateSubmissions(
    submissionIds: string[]
  ): Observable<Record<string, EvaluationResult>> {
    return this.http
      .post<AIResponse<Record<string, EvaluationResult>>>(`${this.apiUrl}/evaluations/batch`, {
        submission_ids: submissionIds,
      })
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error || 'Batch evaluation failed');
          }
          return response.data;
        }),
        catchError((error) => {
          console.error('AI Engine Error:', error);
          throw error;
        })
      );
  }

  getQuickScore(content: string, criteria: string[]): Observable<{ score: number }> {
    return this.http
      .post<AIResponse<{ score: number }>>(`${this.apiUrl}/evaluations/quick-score`, {
        content,
        criteria,
      })
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.error || 'Quick score calculation failed');
          }
          return response.data;
        }),
        catchError((error) => {
          console.error('AI Engine Error:', error);
          throw error;
        })
      );
  }

  // Health Check
  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl.replace('/api', '')}/health`);
  }
}
