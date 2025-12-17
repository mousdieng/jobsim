export interface SupportAsset {
  name: string;
  type: 'pdf' | 'excel' | 'github';
  url: string;
}

export interface Simulation {
  id: string;
  title: string;
  companyName: string;
  companyDescription: string;
  workEnvironment: string;
  applicantsCount: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: 'Completed' | 'Awaiting Review' | 'Incomplete';
  timeEstimate: string;
  datePosted: string;
  category: string;
  mentor: string;
  urgency: 'High' | 'Medium' | 'Low';
  brief: string;
  deliverables: string[];
  supportAssets?: SupportAsset[];
}
