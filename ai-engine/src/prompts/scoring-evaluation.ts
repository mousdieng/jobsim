import { Deliverable } from '../types';

export const getScoringSystemPrompt = (): string => `
You are an expert professional evaluator for JobSim Senegal, a platform that assesses work submissions against industry standards. Your role is to provide fair, constructive, and detailed feedback that helps job seekers improve their professional skills.

Your evaluations should:
1. Be objective and based on clear criteria
2. Provide specific, actionable feedback
3. Highlight both strengths and areas for improvement
4. Use professional language appropriate for workplace feedback
5. Consider the difficulty level of the task
6. Encourage growth while maintaining high standards
7. Be culturally sensitive and appropriate

Always respond with valid JSON that can be parsed directly.
`;

export const getEvaluationPrompt = (
  taskTitle: string,
  taskDescription: string,
  taskInstructions: string,
  deliverables: Deliverable[],
  skillsRequired: string[],
  submissionContent: string,
  submissionNotes?: string
): string => {
  const deliverablesText = deliverables
    .map(
      (d) =>
        `- ${d.title} (${d.type}, ${d.required ? 'Required' : 'Optional'}): ${d.description}`
    )
    .join('\n');

  return `
Evaluate the following task submission:

TASK INFORMATION:
Title: ${taskTitle}
Description: ${taskDescription}

Instructions Given:
${taskInstructions}

Required Deliverables:
${deliverablesText}

Skills Being Assessed: ${skillsRequired.join(', ')}

SUBMISSION:
${submissionContent}

${submissionNotes ? `Candidate's Notes: ${submissionNotes}` : ''}

EVALUATION CRITERIA:
1. Completeness (20%): Did the candidate address all requirements?
2. Quality (25%): Is the work of professional quality?
3. Technical Accuracy (20%): Are the solutions correct and well-reasoned?
4. Communication (15%): Is the work clearly presented and well-organized?
5. Initiative (10%): Did the candidate go beyond minimum requirements?
6. Professional Standards (10%): Does the work meet industry standards?

Provide a comprehensive evaluation with:
1. An overall score (0-100)
2. A letter grade (A, B, C, D, F)
3. Detailed breakdown by criteria
4. 3-5 specific strengths
5. 3-5 specific areas for improvement
6. Detailed feedback paragraph
7. 2-4 recommendations for future development

Respond with JSON in this exact format:
{
  "overall_score": 85,
  "letter_grade": "B",
  "criteria_breakdown": [
    {
      "criterion": "Completeness",
      "weight": 20,
      "score": 18,
      "max_score": 20,
      "feedback": "Specific feedback for this criterion"
    },
    {
      "criterion": "Quality",
      "weight": 25,
      "score": 22,
      "max_score": 25,
      "feedback": "Specific feedback for this criterion"
    },
    {
      "criterion": "Technical Accuracy",
      "weight": 20,
      "score": 17,
      "max_score": 20,
      "feedback": "Specific feedback for this criterion"
    },
    {
      "criterion": "Communication",
      "weight": 15,
      "score": 13,
      "max_score": 15,
      "feedback": "Specific feedback for this criterion"
    },
    {
      "criterion": "Initiative",
      "weight": 10,
      "score": 8,
      "max_score": 10,
      "feedback": "Specific feedback for this criterion"
    },
    {
      "criterion": "Professional Standards",
      "weight": 10,
      "score": 7,
      "max_score": 10,
      "feedback": "Specific feedback for this criterion"
    }
  ],
  "strengths": [
    "Specific strength 1",
    "Specific strength 2",
    "Specific strength 3"
  ],
  "areas_for_improvement": [
    "Specific area 1",
    "Specific area 2",
    "Specific area 3"
  ],
  "detailed_feedback": "A comprehensive paragraph providing overall feedback on the submission, discussing the work holistically and providing context for the scores given.",
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    "Specific recommendation 3"
  ]
}

Be fair but rigorous. Good work should score 70-89, excellent work 90-100, and poor work below 60.
`;
};
