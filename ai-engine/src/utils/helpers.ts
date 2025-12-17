import { v4 as uuidv4 } from 'uuid';
import { JobField, DifficultyLevel, ExperienceLevel } from '../types';

export const generateId = (): string => uuidv4();

export const formatJobField = (field: JobField): string => {
  const mapping: Record<JobField, string> = {
    software_engineering: 'Software Engineering',
    accounting: 'Accounting',
    marketing: 'Marketing',
    sales: 'Sales',
    human_resources: 'Human Resources',
    project_management: 'Project Management',
    data_science: 'Data Science',
    graphic_design: 'Graphic Design',
    customer_service: 'Customer Service',
    finance: 'Finance',
    legal: 'Legal',
    healthcare: 'Healthcare',
    education: 'Education',
    operations: 'Operations',
    consulting: 'Consulting',
    other: 'Other',
  };
  return mapping[field] || field;
};

export const getDifficultyMultiplier = (level: DifficultyLevel): number => {
  const multipliers: Record<DifficultyLevel, number> = {
    beginner: 1.0,
    intermediate: 1.5,
    advanced: 2.0,
    expert: 2.5,
  };
  return multipliers[level];
};

export const getExperienceMultiplier = (level: ExperienceLevel): number => {
  const multipliers: Record<ExperienceLevel, number> = {
    junior: 1.0,
    mid: 1.3,
    senior: 1.6,
  };
  return multipliers[level];
};

export const calculateDeadline = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

export const estimateTaskDuration = (difficulty: DifficultyLevel): string => {
  const durations: Record<DifficultyLevel, string> = {
    beginner: '2-4 hours',
    intermediate: '4-8 hours',
    advanced: '1-2 days',
    expert: '2-5 days',
  };
  return durations[difficulty];
};

export const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const sanitizeJSON = (text: string): string => {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
};

export const calculateLetterGrade = (score: number): string => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};
