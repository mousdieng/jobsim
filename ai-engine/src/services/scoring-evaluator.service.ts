import { getAIProvider } from './ai-provider.factory';
import { supabaseService } from './supabase.service';
import { SubmissionEvaluationRequest, EvaluationResult } from '../types';
import { getScoringSystemPrompt, getEvaluationPrompt } from '../prompts/scoring-evaluation';

export class ScoringEvaluatorService {
  async evaluateSubmission(
    request: SubmissionEvaluationRequest
  ): Promise<EvaluationResult> {
    const systemPrompt = getScoringSystemPrompt();
    const userPrompt = getEvaluationPrompt(
      request.task_title,
      request.task_description,
      request.task_instructions,
      request.deliverables,
      request.skills_required,
      request.submission_content,
      request.submission_notes
    );

    // Use AI provider abstraction (supports both OpenAI and Claude)
    const aiProvider = getAIProvider();
    const aiResponse = await aiProvider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        temperature: 0.6, // Lower temperature for more consistent scoring
        max_tokens: 4096
      }
    );

    const result = aiProvider.parseJSON<EvaluationResult>(aiResponse.content);

    // Validate and normalize the result
    return this.validateEvaluationResult(result);
  }

  private validateEvaluationResult(result: EvaluationResult): EvaluationResult {
    // Ensure score is within bounds
    result.overall_score = Math.max(0, Math.min(100, result.overall_score));

    // Validate letter grade
    const validGrades = ['A', 'B', 'C', 'D', 'F'];
    if (!validGrades.includes(result.letter_grade)) {
      result.letter_grade = this.calculateLetterGrade(result.overall_score);
    }

    // Ensure criteria scores sum correctly
    let totalScore = 0;
    result.criteria_breakdown.forEach((criterion) => {
      criterion.score = Math.max(0, Math.min(criterion.max_score, criterion.score));
      totalScore += criterion.score;
    });

    // Recalculate overall score if there's a significant mismatch
    if (Math.abs(totalScore - result.overall_score) > 5) {
      result.overall_score = totalScore;
      result.letter_grade = this.calculateLetterGrade(totalScore);
    }

    return result;
  }

  private calculateLetterGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  async evaluateAndSaveSubmission(submissionId: string): Promise<EvaluationResult> {
    // Fetch submission with task details
    const submission = await supabaseService.getSubmissionById(submissionId);

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (!submission.task) {
      throw new Error('Task not found for submission');
    }

    // Prepare evaluation request
    const evaluationRequest: SubmissionEvaluationRequest = {
      task_id: submission.task_id,
      task_title: submission.task.title,
      task_description: submission.task.description,
      task_instructions: submission.task.instructions || '',
      deliverables: submission.task.deliverables || [],
      skills_required: submission.task.skills_required || [],
      submission_content:
        typeof submission.content === 'string'
          ? submission.content
          : JSON.stringify(submission.content, null, 2),
      submission_notes: submission.notes,
    };

    // Generate evaluation
    const evaluation = await this.evaluateSubmission(evaluationRequest);

    // Save evaluation to database
    await supabaseService.updateSubmissionWithEvaluation(submissionId, evaluation);

    // Update user statistics
    if (submission.user_id) {
      await supabaseService.updateUserStatistics(
        submission.user_id,
        evaluation.overall_score
      );
    }

    return evaluation;
  }

  async batchEvaluateSubmissions(submissionIds: string[]): Promise<Map<string, EvaluationResult>> {
    const results = new Map<string, EvaluationResult>();

    for (const submissionId of submissionIds) {
      try {
        console.log(`Evaluating submission: ${submissionId}`);
        const evaluation = await this.evaluateAndSaveSubmission(submissionId);
        results.set(submissionId, evaluation);

        // Delay between evaluations
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error evaluating submission ${submissionId}:`, error);
      }
    }

    return results;
  }

  async getQuickScore(content: string, criteria: string[]): Promise<number> {
    const simplePrompt = `
      Rate this submission on a scale of 0-100 based on these criteria: ${criteria.join(', ')}

      Submission:
      ${content.substring(0, 2000)}

      Respond with JSON: { "score": <number> }
    `;

    // Use AI provider abstraction (supports both OpenAI and Claude)
    const aiProvider = getAIProvider();
    const aiResponse = await aiProvider.chat(
      [
        { role: 'system', content: 'You are a quick scorer. Respond only with JSON containing a score.' },
        { role: 'user', content: simplePrompt }
      ],
      {
        temperature: 0.3,
        max_tokens: 100
      }
    );

    const result = aiProvider.parseJSON<{ score: number }>(aiResponse.content);

    return Math.max(0, Math.min(100, result.score));
  }
}

export const scoringEvaluatorService = new ScoringEvaluatorService();
