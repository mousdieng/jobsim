import { JobField, DifficultyLevel } from '../types';
import { formatJobField } from '../utils/helpers';

export const getTaskGenerationSystemPrompt = (): string => `
You are an expert professional task designer for JobSim Senegal, a platform that creates realistic workplace simulations for job seekers. Your role is to generate authentic, practical tasks that mirror real-world professional scenarios in various industries.

Your tasks should:
1. Be realistic and based on actual workplace scenarios
2. Include clear, actionable instructions
3. Have measurable deliverables
4. Provide appropriate resources and references
5. Match the specified difficulty level and job field
6. Be culturally relevant to the Senegalese and African context where applicable
7. Help candidates develop practical skills valued by employers

Always respond with valid JSON that can be parsed directly.
`;

export const getTaskGenerationUserPrompt = (
  jobField: JobField,
  difficultyLevel: DifficultyLevel,
  count: number = 1,
  specificSkills?: string[],
  context?: string
): string => {
  const skillsText = specificSkills?.length
    ? `Focus on these specific skills: ${specificSkills.join(', ')}.`
    : '';

  const contextText = context ? `Additional context: ${context}` : '';

  return `
Generate ${count} professional task(s) for the ${formatJobField(jobField)} field at the ${difficultyLevel} difficulty level.

${skillsText}
${contextText}

For each task, provide:
1. A compelling title that clearly describes the task
2. A detailed description explaining the scenario and objectives
3. Step-by-step instructions for completing the task
4. Required skills needed
5. Expected deliverables with specific requirements
6. Helpful resources (provide realistic URLs or mention "template provided")
7. Relevant tags for categorization
8. Estimated completion time appropriate for the difficulty level

Difficulty Guidelines:
- beginner: Simple tasks requiring basic knowledge, 2-4 hours
- intermediate: Moderate complexity requiring practical application, 4-8 hours
- advanced: Complex tasks requiring deep expertise, 1-2 days
- expert: Highly complex, strategic tasks, 2-5 days

Respond with a JSON array of tasks in this exact format:
[
  {
    "title": "Task Title",
    "description": "Detailed scenario description",
    "instructions": "Step 1: ...\\nStep 2: ...\\nStep 3: ...",
    "job_field": "${jobField}",
    "difficulty_level": "${difficultyLevel}",
    "estimated_duration": "X hours/days",
    "skills_required": ["skill1", "skill2", "skill3"],
    "deliverables": [
      {
        "id": "uuid",
        "title": "Deliverable Name",
        "description": "What should be delivered",
        "type": "document|code|presentation|spreadsheet|design|other",
        "required": true
      }
    ],
    "resources": [
      {
        "id": "uuid",
        "title": "Resource Name",
        "url": "https://example.com/resource",
        "type": "pdf|video|link|template|dataset",
        "description": "Brief description"
      }
    ],
    "tags": ["tag1", "tag2", "tag3"]
  }
]

Ensure all JSON is valid and properly escaped.
`;
};

export const getSkillsForJobField = (field: JobField): string[] => {
  const skillsMap: Record<JobField, string[]> = {
    software_engineering: [
      'JavaScript',
      'Python',
      'React',
      'Node.js',
      'SQL',
      'Git',
      'API Design',
      'Testing',
      'DevOps',
      'System Design',
    ],
    accounting: [
      'Financial Reporting',
      'Tax Compliance',
      'Auditing',
      'Excel',
      'OHADA',
      'Bookkeeping',
      'Budget Analysis',
      'Cost Accounting',
    ],
    marketing: [
      'Digital Marketing',
      'Social Media',
      'Content Strategy',
      'SEO',
      'Analytics',
      'Brand Management',
      'Campaign Planning',
      'Market Research',
    ],
    sales: [
      'Negotiation',
      'CRM',
      'Lead Generation',
      'Client Relations',
      'Presentation',
      'Pipeline Management',
      'Closing Techniques',
      'B2B Sales',
    ],
    human_resources: [
      'Recruitment',
      'Employee Relations',
      'Payroll',
      'Labor Law',
      'Performance Management',
      'Training',
      'HRIS',
      'Compensation',
    ],
    project_management: [
      'Agile',
      'Scrum',
      'Risk Management',
      'Stakeholder Management',
      'Budgeting',
      'Timeline Planning',
      'Resource Allocation',
      'Reporting',
    ],
    data_science: [
      'Python',
      'Machine Learning',
      'Statistics',
      'Data Visualization',
      'SQL',
      'Pandas',
      'TensorFlow',
      'Data Cleaning',
    ],
    graphic_design: [
      'Adobe Creative Suite',
      'UI/UX',
      'Typography',
      'Color Theory',
      'Brand Identity',
      'Figma',
      'Illustration',
      'Layout Design',
    ],
    customer_service: [
      'Communication',
      'Problem Solving',
      'CRM Tools',
      'Conflict Resolution',
      'Multilingual',
      'Patience',
      'Product Knowledge',
      'Active Listening',
    ],
    finance: [
      'Financial Analysis',
      'Investment Strategy',
      'Risk Assessment',
      'Excel Modeling',
      'Valuation',
      'Portfolio Management',
      'Regulatory Compliance',
      'Forecasting',
    ],
    legal: [
      'Contract Law',
      'Legal Research',
      'Compliance',
      'OHADA Law',
      'Corporate Law',
      'Document Drafting',
      'Negotiation',
      'Litigation',
    ],
    healthcare: [
      'Patient Care',
      'Medical Documentation',
      'Health Regulations',
      'Clinical Skills',
      'Medical Terminology',
      'Healthcare IT',
      'Emergency Response',
      'Public Health',
    ],
    education: [
      'Curriculum Development',
      'Assessment',
      'Classroom Management',
      'Educational Technology',
      'Student Engagement',
      'Differentiated Learning',
      'French Language',
      'Pedagogy',
    ],
    operations: [
      'Process Optimization',
      'Supply Chain',
      'Quality Control',
      'Logistics',
      'Inventory Management',
      'Lean Six Sigma',
      'Vendor Management',
      'KPI Tracking',
    ],
    consulting: [
      'Business Strategy',
      'Data Analysis',
      'Client Communication',
      'Problem Solving',
      'Presentation',
      'Industry Research',
      'Stakeholder Management',
      'Change Management',
    ],
    other: [
      'Communication',
      'Problem Solving',
      'Time Management',
      'Teamwork',
      'Adaptability',
      'Critical Thinking',
      'Organization',
      'Leadership',
    ],
  };

  return skillsMap[field] || skillsMap.other;
};
