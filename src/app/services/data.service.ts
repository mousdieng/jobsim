import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Simulation, Submission, Job } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private mockSubmissions: Submission[] = [
    {
      id: 'sub1',
      title: 'Strategic Launch Memo',
      category: 'Marketing',
      score: 85,
      feedback: 'Strong analysis, but financial projections were weak.',
      submitted_at: new Date(2025, 8, 1)
    },
    {
      id: 'sub2',
      title: 'Client Onboarding Email Sequence',
      category: 'Sales',
      score: 95,
      feedback: 'Excellent tone and clear next steps.',
      submitted_at: new Date(2025, 8, 5)
    },
    {
      id: 'sub3',
      title: 'Variance Analysis & Risk Report',
      category: 'Accounting',
      score: null,
      feedback: null,
      submitted_at: new Date(2025, 8, 10)
    },
  ];

  private mockSimulations: Simulation[] = [
    {
      id: 'sim1',
      title: 'Strategic Launch Memo',
      companyName: 'DakarTech Innovations',
      companyDescription: 'Pioneering sustainable fintech solutions across West Africa.',
      workEnvironment: 'Dynamic, agile, remote-friendly.',
      applicantsCount: 125,
      difficulty: 'Intermediate',
      progress: 'Completed',
      timeEstimate: '4 hours',
      datePosted: '2025-10-22',
      category: 'Marketing',
      mentor: 'Fatou, Head of Marketing',
      urgency: 'High',
      brief: "Subject: URGENT: Q4 Launch Strategy for Saba Spices - Need by EOD Friday\n\nHi [Your Name],\n\nWe are in a tight spot. Our new B2C product line, *Saba Spices*, needs a Q4 launch strategy finalized for the VP of Sales meeting. I need you to draft a **Strategic Launch Memo** immediately. Focus on:\n\n1. Target Personas (3 max).\n2. Primary digital channel allocation (e.g., Instagram, TikTok, SMS).\n3. Initial budget assumptions (no more than 5M XOF).\n\nThis needs to be sharp and actionable. Check the **attached supporting documents** for market research and budget templates.\n\nBest,\nFatou",
      deliverables: ["Strategic Launch Memo (3 pages, PDF)", "Q4 Budget Breakdown (Excel format placeholder)"],
      supportAssets: [
        { name: 'Q4 Market Research Summary', type: 'pdf', url: 'https://placeholder.com/reports/market_summary_q4.pdf' },
        { name: 'Channel Budget Template', type: 'excel', url: 'https://placeholder.com/data/channel_budget_template.xlsx' },
      ]
    },
    {
      id: 'sim2',
      title: 'Variance Analysis & Risk Report',
      companyName: 'Senegal Global Logistics',
      companyDescription: 'A major player in regional transportation and cross-border delivery.',
      workEnvironment: 'Fast-paced, high-pressure, structured office.',
      applicantsCount: 45,
      difficulty: 'Advanced',
      progress: 'Incomplete',
      timeEstimate: '6 hours',
      datePosted: '2025-09-01',
      category: 'Accounting',
      mentor: 'Mr. Ndiaye, Senior Auditor',
      urgency: 'Medium',
      brief: "Internal Task: SGL Q3 OpEx Variance Investigation\n\nTeam,\n\nOur client, Senegal Global Logistics (SGL), has flagged a significant, unexplained variance in their Q3 Operating Expenses, specifically within fuel costs and temporary labor. I need you to perform a quick-turn **Variance Analysis**. Review the **Q3 raw data sheet** before proceeding.\n\nYour report must:\n\n1. Clearly identify and quantify two major unexplained spending risks based on the Q3 data provided.\n2. Prepare a 1-page **Mitigation Recommendation** for our next internal review meeting on Tuesday.\n\nPriority is high due to end-of-quarter closing. Ensure all documentation is audit-ready.",
      deliverables: ["Variance Analysis Report (Internal Memo format)", "Risk Mitigation Recommendation (1-page summary)"],
      supportAssets: [
        { name: 'Q3 OpEx Raw Data', type: 'excel', url: 'https://placeholder.com/data/q3_opex_raw.xlsx' },
        { name: 'Internal Audit Protocol', type: 'pdf', url: 'https://placeholder.com/documents/audit_protocol.pdf' },
      ]
    },
    {
      id: 'sim3',
      title: 'Client Onboarding Email Sequence',
      companyName: 'Casamance Crafts Co.',
      companyDescription: 'E-commerce platform promoting artisanal goods from the Casamance region.',
      workEnvironment: 'Creative, collaborative, small team.',
      applicantsCount: 230,
      difficulty: 'Beginner',
      progress: 'Completed',
      timeEstimate: '2 hours',
      datePosted: '2025-10-24',
      category: 'Sales',
      mentor: 'Mr. Diallo, Sales Lead',
      urgency: 'Low',
      brief: "Team Task: New Client Success - Welcoming 'Bissap Blooms'\n\nHi team,\n\nA new major artisan group, 'Bissap Blooms,' just signed up for our E-commerce platform. Successful onboarding is critical to their long-term value.\n\nYour task is to draft an effective, human-centered email sequence for their first week (Day 1, Day 3, and Day 7). Use the **GitHub link** for the existing email templates and brand guidelines.\n\nPlease send me the drafts in a single document for approval by end of day.",
      deliverables: ["Email 1 Draft: Welcome & Setup", "Email 2 Draft: Feature Highlight", "Email 3 Draft: Personalized Check-in"],
      supportAssets: [
        { name: 'Client Onboarding Email Templates', type: 'github', url: 'https://github.com/mock-repo/email-templates' },
        { name: 'Brand Voice and Tone Guide', type: 'pdf', url: 'https://placeholder.com/reports/brand_voice_guide.pdf' },
      ]
    },
    {
      id: 'sim4',
      title: 'Inventory Process Improvement',
      companyName: 'Wastewater Solutions S.A.',
      companyDescription: 'Providing critical infrastructure and water purification services.',
      workEnvironment: 'Technical, process-driven, essential services.',
      applicantsCount: 88,
      difficulty: 'Intermediate',
      progress: 'Incomplete',
      timeEstimate: '5 hours',
      datePosted: '2025-10-10',
      category: 'Accounting',
      mentor: 'Ms. Ndiaye, Operations Manager',
      urgency: 'Medium',
      brief: "Project: Mbour Fishing Co-op Inventory Optimization\n\n[Your Name],\n\nWe are consulting for the Mbour Fishing Cooperative to stabilize their inventory. Their current manual tracking leads to 15-20% losses monthly. I need you to audit the provided **(mock) process flow documentation** and identify two major, quantifiable inefficiencies.\n\nCrucially, propose a simple, low-cost solution (e.g., using a basic mobile app or spreadsheet modification) that can be implemented next week. Your final report should be client-facing.",
      deliverables: ["Client-Facing Audit Summary Report (3 pages)", "Proposed Low-Cost Solution Diagram"],
      supportAssets: [
        { name: 'Current Inventory Process Flow', type: 'pdf', url: 'https://placeholder.com/documents/current_process.pdf' },
        { name: 'Daily Inventory Log Data', type: 'excel', url: 'https://placeholder.com/data/inventory_log_data.xlsx' },
      ]
    },
  ];

  private mockJobListings: Job[] = [
    {
      id: 'job1',
      title: 'Data Entry & Analysis Intern',
      company: 'DakarTech Innovations',
      description: 'Requires knowledge of basic financial auditing processes and data entry skills.',
      relatedSimulations: ['Strategic Launch Memo', 'Variance Analysis & Risk Report'],
      link: '#',
      contact: 'hr@dakartechi.sn'
    },
    {
      id: 'job2',
      title: 'Digital Marketing Assistant',
      company: 'Casamance Crafts Co.',
      description: 'Looking for someone who can craft compelling email marketing sequences and assist with content strategy.',
      relatedSimulations: ['Strategic Launch Memo', 'Client Onboarding Email Sequence'],
      link: '#',
      contact: 'careers@casacrafts.sn'
    },
    {
      id: 'job3',
      title: 'Junior Accountant',
      company: 'Senegal Global Logistics',
      description: 'Seeking candidates with deep experience in Q3 financial reporting and risk assessment.',
      relatedSimulations: ['Variance Analysis & Risk Report', 'Inventory Process Improvement'],
      link: '#',
      contact: 'recruitment@sgl.sn'
    },
    {
      id: 'job4',
      title: 'E-commerce Sales Support',
      company: 'Casamance Crafts Co.',
      description: 'Role focused on supporting customer success and client onboarding via email.',
      relatedSimulations: ['Client Onboarding Email Sequence'],
      link: '#',
      contact: 'careers@casacrafts.sn'
    },
  ];

  private submissionsSubject = new BehaviorSubject<Submission[]>(this.mockSubmissions);
  public submissions$ = this.submissionsSubject.asObservable();

  constructor() { }

  getSimulations(): Simulation[] {
    return this.mockSimulations;
  }

  getSimulationById(id: string): Simulation | undefined {
    return this.mockSimulations.find(sim => sim.id === id);
  }

  getSubmissions(): Observable<Submission[]> {
    return this.submissions$;
  }

  getJobs(): Job[] {
    return this.mockJobListings;
  }

  addSubmission(submission: Submission): void {
    const currentSubmissions = this.submissionsSubject.value;
    this.submissionsSubject.next([...currentSubmissions, submission]);
  }
}
