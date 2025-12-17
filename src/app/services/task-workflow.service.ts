import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StartTaskRequest {
  user_id: string;
  task_id: string;
  user_name: string;
  user_role?: string;
}

export interface StartTaskResponse {
  success: boolean;
  data: {
    deadline: string;
    meetingIds: string[];
    progressId: string;
  };
  message: string;
}

export interface EvaluateSubmissionRequest {
  submission_id: string;
}

export interface EvaluateSubmissionResponse {
  success: boolean;
  data: {
    overall_score: number;
    letter_grade: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    detailed_feedback: string;
  };
  message: string;
}

export interface EvaluateMeetingRequest {
  meeting_id: string;
}

export interface MeetingEvaluation {
  score: number;
  grade: string;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

export interface EvaluateMeetingResponse {
  success: boolean;
  data: MeetingEvaluation;
  message: string;
}

export interface CompleteTaskRequest {
  user_id: string;
  task_id: string;
  submission_id: string;
}

export interface CompleteTaskResponse {
  success: boolean;
  data: {
    submission_score: number;
    submission_grade: string;
    meetings_evaluated: number;
    overall_score: number;
  };
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TaskWorkflowService {
  private apiUrl = environment.aiEngineUrl;

  constructor(private http: HttpClient) {}

  /**
   * Start a task for a user
   * - Calculates deadline
   * - Creates task progress
   * - Generates AI meetings
   */
  startTask(request: StartTaskRequest): Observable<StartTaskResponse> {
    return this.http.post<StartTaskResponse>(
      `${this.apiUrl}/workflow/tasks/start`,
      request
    );
  }

  /**
   * Evaluate a submission with AI
   */
  evaluateSubmission(submissionId: string): Observable<EvaluateSubmissionResponse> {
    return this.http.post<EvaluateSubmissionResponse>(
      `${this.apiUrl}/workflow/submissions/evaluate`,
      { submission_id: submissionId }
    );
  }

  /**
   * Evaluate meeting performance with AI
   */
  evaluateMeeting(meetingId: string): Observable<EvaluateMeetingResponse> {
    return this.http.post<EvaluateMeetingResponse>(
      `${this.apiUrl}/workflow/meetings/evaluate`,
      { meeting_id: meetingId }
    );
  }

  /**
   * Complete a task workflow
   * - Evaluates submission
   * - Evaluates all meetings
   * - Calculates overall score (70% submission + 30% meetings)
   */
  completeTask(request: CompleteTaskRequest): Observable<CompleteTaskResponse> {
    return this.http.post<CompleteTaskResponse>(
      `${this.apiUrl}/workflow/tasks/complete`,
      request
    );
  }
}
