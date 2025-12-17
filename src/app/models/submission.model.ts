export interface Submission {
  id: string;
  title: string;
  category: string;
  score: number | null;
  feedback: string | null;
  submitted_at: Date;
}
