import { Request, Response } from 'express';
import { scoringEvaluatorService } from '../services/scoring-evaluator.service';
import { z } from 'zod';

const evaluationRequestSchema = z.object({
  submission_id: z.string().uuid(),
});

const batchEvaluationSchema = z.object({
  submission_ids: z.array(z.string().uuid()).min(1).max(10),
});

const quickScoreSchema = z.object({
  content: z.string().min(10),
  criteria: z.array(z.string()).min(1),
});

export class EvaluationController {
  async evaluateSubmission(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = evaluationRequestSchema.parse(req.body);

      const evaluation = await scoringEvaluatorService.evaluateAndSaveSubmission(
        validatedData.submission_id
      );

      res.status(200).json({
        success: true,
        data: evaluation,
        message: 'Submission evaluated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Evaluation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to evaluate submission',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async batchEvaluate(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = batchEvaluationSchema.parse(req.body);

      const results = await scoringEvaluatorService.batchEvaluateSubmissions(
        validatedData.submission_ids
      );

      const evaluations: Record<string, any> = {};
      results.forEach((value, key) => {
        evaluations[key] = value;
      });

      res.status(200).json({
        success: true,
        data: evaluations,
        message: `Evaluated ${results.size} submission(s) successfully`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Batch evaluation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to batch evaluate submissions',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async quickScore(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = quickScoreSchema.parse(req.body);

      const score = await scoringEvaluatorService.getQuickScore(
        validatedData.content,
        validatedData.criteria
      );

      res.status(200).json({
        success: true,
        data: { score },
        message: 'Quick score calculated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Quick score error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate quick score',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const evaluationController = new EvaluationController();
