import { AIProvider, AIMessage, AICompletionOptions, AICompletionResponse } from '../ai-provider.interface';

/**
 * Mock AI Provider for testing without spending money
 * Returns realistic test data based on prompts
 */
export class MockProvider implements AIProvider {
  readonly name = 'mock';

  async complete(prompt: string, options?: AICompletionOptions): Promise<AICompletionResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: AIMessage[], options?: AICompletionOptions): Promise<AICompletionResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';

    let responseContent: string;

    // Detect what type of request this is and return appropriate mock data
    if (this.isTaskGeneration(userMessage, systemMessage)) {
      responseContent = this.generateMockTasks(userMessage);
    } else if (this.isMeetingGeneration(userMessage, systemMessage)) {
      responseContent = this.generateMockMeeting(userMessage);
    } else if (this.isEvaluation(userMessage, systemMessage)) {
      responseContent = this.generateMockEvaluation(userMessage);
    } else if (this.isQuickScore(userMessage)) {
      responseContent = this.generateMockQuickScore();
    } else {
      // Generic response
      responseContent = JSON.stringify({
        response: "Mock AI response",
        note: "This is test data from the mock provider"
      });
    }

    return {
      content: responseContent,
      usage: {
        prompt_tokens: userMessage.length / 4,
        completion_tokens: responseContent.length / 4,
        total_tokens: (userMessage.length + responseContent.length) / 4,
      },
      model: 'mock-v1',
      finish_reason: 'stop',
    };
  }

  parseJSON<T = any>(response: string): T {
    try {
      return JSON.parse(response) as T;
    } catch (error) {
      console.error('[Mock Provider] Failed to parse JSON:', response);
      throw new Error('Invalid JSON response from Mock Provider');
    }
  }

  isConfigured(): boolean {
    return true;
  }

  // Detection helpers
  private isTaskGeneration(userMessage: string, systemMessage: string): boolean {
    return userMessage.toLowerCase().includes('generate') &&
           (userMessage.toLowerCase().includes('task') || systemMessage.toLowerCase().includes('task'));
  }

  private isMeetingGeneration(userMessage: string, systemMessage: string): boolean {
    return userMessage.toLowerCase().includes('meeting') ||
           systemMessage.toLowerCase().includes('meeting');
  }

  private isEvaluation(userMessage: string, systemMessage: string): boolean {
    return (userMessage.toLowerCase().includes('evaluate') ||
            systemMessage.toLowerCase().includes('evaluat')) &&
           !userMessage.toLowerCase().includes('quick');
  }

  private isQuickScore(userMessage: string): boolean {
    return userMessage.toLowerCase().includes('quick') &&
           userMessage.toLowerCase().includes('score');
  }

  // Mock data generators
  private generateMockTasks(prompt: string): string {
    // Extract job field and difficulty from prompt
    const jobFieldMatch = prompt.match(/Job Field:\s*(\w+)/i) || prompt.match(/job_field['":\s]+(\w+)/i);
    const difficultyMatch = prompt.match(/Difficulty Level:\s*(\w+)/i) || prompt.match(/difficulty_level['":\s]+(\w+)/i);
    const countMatch = prompt.match(/Generate\s+(\d+)/i);

    const jobField = jobFieldMatch ? jobFieldMatch[1] : 'software_engineering';
    const difficulty = difficultyMatch ? difficultyMatch[1] : 'intermediate';
    const count = countMatch ? parseInt(countMatch[1]) : 1;

    const tasks = [];
    for (let i = 0; i < count; i++) {
      tasks.push({
        title: `${this.getJobFieldName(jobField)} Task ${i + 1}`,
        description: `This is a comprehensive ${difficulty}-level task designed to simulate real-world ${jobField} work. The task requires you to demonstrate practical skills and professional competencies.\n\nIn this task, you will work on a realistic project that mirrors the challenges faced by professionals in the field. You'll need to apply industry best practices, communicate effectively, and deliver high-quality results within the specified timeline.`,
        instructions: `1. Review the task requirements carefully and identify key deliverables\n2. Plan your approach and timeline for completion\n3. Execute the work following industry best practices\n4. Document your process and decisions\n5. Review and test your work before submission\n6. Submit all required deliverables with clear explanations`,
        job_field: jobField,
        difficulty_level: difficulty,
        estimated_duration: this.getEstimatedDuration(difficulty),
        skills_required: this.getSkillsForField(jobField),
        deliverables: [
          {
            id: "1",
            title: "Main Deliverable",
            description: `Complete ${jobField} project with documentation`,
            type: "document",
            required: true
          },
          {
            id: "2",
            title: "Process Documentation",
            description: "Detailed explanation of your approach and decisions",
            type: "document",
            required: true
          }
        ],
        resources: [
          {
            id: "1",
            title: "Industry Best Practices Guide",
            url: "https://example.com/guide",
            type: "link",
            description: "Comprehensive guide to professional standards"
          },
          {
            id: "2",
            title: "Reference Materials",
            url: "https://example.com/reference",
            type: "pdf",
            description: "Additional reading and examples"
          }
        ],
        tags: [jobField, difficulty, "professional", "simulation"]
      });
    }

    return JSON.stringify({ tasks });
  }

  private generateMockMeeting(prompt: string): string {
    const meetingTypeMatch = prompt.match(/meeting_type['":\s]+(\w+)/i) || prompt.match(/(\w+)\s+meeting/i);
    const meetingType = meetingTypeMatch ? meetingTypeMatch[1].toLowerCase() : 'kickoff';

    const meeting = {
      meeting_title: `${this.capitalize(meetingType)} Meeting - Project Discussion`,
      meeting_type: meetingType,
      participants: [
        {
          id: "1",
          name: "Sarah Johnson",
          role: "Project Manager",
          is_ai: true,
          avatar_url: null
        },
        {
          id: "2",
          name: "Amadou Diallo",
          role: "Technical Lead",
          is_ai: true,
          avatar_url: null
        },
        {
          id: "3",
          name: "Marie Ndiaye",
          role: "Product Owner",
          is_ai: true,
          avatar_url: null
        }
      ],
      agenda: [
        {
          id: "1",
          title: "Opening and Introductions",
          duration_minutes: 5,
          presenter: "Sarah Johnson"
        },
        {
          id: "2",
          title: "Main Discussion",
          duration_minutes: 20,
          presenter: "Amadou Diallo"
        },
        {
          id: "3",
          title: "Action Items and Next Steps",
          duration_minutes: 5,
          presenter: "Marie Ndiaye"
        }
      ],
      duration_minutes: 30,
      transcript: `Sarah: Good morning everyone, thank you for joining. Let's get started.\n\nAmadou: Thanks Sarah. I've reviewed the requirements and have some thoughts to share.\n\nMarie: Great, I'm interested to hear your perspective.\n\n[Detailed discussion continues...]\n\nSarah: Excellent discussion. Let's summarize the action items.\n\nAmadou: Sounds good. I'll take ownership of the technical implementation.\n\nMarie: And I'll coordinate with stakeholders. Thanks everyone!`,
      summary: `This ${meetingType} meeting covered key project aspects and aligned the team on objectives. All participants contributed valuable insights and committed to their respective action items.`,
      action_items: [
        {
          id: "1",
          description: "Complete technical implementation",
          assignee: "Amadou Diallo",
          due_date: null,
          completed: false
        },
        {
          id: "2",
          description: "Coordinate with stakeholders",
          assignee: "Marie Ndiaye",
          due_date: null,
          completed: false
        }
      ]
    };

    return JSON.stringify(meeting);
  }

  private generateMockEvaluation(prompt: string): string {
    const evaluation = {
      overall_score: 82,
      letter_grade: "B+",
      criteria_breakdown: [
        {
          criterion: "Completeness",
          weight: 0.25,
          score: 22,
          max_score: 25,
          feedback: "The submission addresses most required elements with good detail. Some minor aspects could be expanded."
        },
        {
          criterion: "Quality",
          weight: 0.30,
          score: 25,
          max_score: 30,
          feedback: "Work demonstrates solid understanding and professional execution. Quality is consistently good throughout."
        },
        {
          criterion: "Accuracy",
          weight: 0.20,
          score: 16,
          max_score: 20,
          feedback: "Information is generally accurate with good attention to detail. Minor corrections needed in a few areas."
        },
        {
          criterion: "Communication",
          weight: 0.15,
          score: 12,
          max_score: 15,
          feedback: "Clear and professional communication. Documentation is well-structured and easy to follow."
        },
        {
          criterion: "Professionalism",
          weight: 0.10,
          score: 7,
          max_score: 10,
          feedback: "Demonstrates professional approach and industry awareness. Follows best practices appropriately."
        }
      ],
      strengths: [
        "Clear and well-organized presentation of work",
        "Good understanding of core concepts and requirements",
        "Professional documentation and communication style",
        "Attention to important details"
      ],
      areas_for_improvement: [
        "Could provide more detailed explanations in complex sections",
        "Some opportunities to demonstrate deeper technical knowledge",
        "Consider adding more real-world examples or case studies"
      ],
      detailed_feedback: "This submission demonstrates a solid understanding of the task requirements and professional execution. The work is well-organized and clearly presented, making it easy to follow the thought process and approach.\n\nThe quality of work is consistently good, showing attention to detail and proper application of relevant concepts. The documentation is professional and comprehensive, though some sections could benefit from additional depth.\n\nOverall, this is good work that meets the standards expected at this level. With some refinement in the identified areas, this could easily reach excellent status.",
      recommendations: [
        "Review the areas marked for improvement and add more detail where suggested",
        "Consider studying advanced examples to deepen understanding",
        "Practice explaining complex concepts in simpler terms",
        "Continue building on the strong foundation demonstrated here"
      ]
    };

    return JSON.stringify(evaluation);
  }

  private generateMockQuickScore(): string {
    const score = 70 + Math.floor(Math.random() * 25); // Random score between 70-95
    return JSON.stringify({ score });
  }

  // Helper methods
  private getJobFieldName(field: string): string {
    const names: Record<string, string> = {
      software_engineering: 'Software Engineering',
      marketing: 'Marketing',
      data_science: 'Data Science',
      accounting: 'Accounting',
      sales: 'Sales',
      human_resources: 'Human Resources',
      project_management: 'Project Management',
      graphic_design: 'Graphic Design',
      customer_service: 'Customer Service',
      finance: 'Finance',
      legal: 'Legal',
      healthcare: 'Healthcare',
      education: 'Education',
      operations: 'Operations',
      consulting: 'Consulting'
    };
    return names[field] || 'Professional';
  }

  private getEstimatedDuration(difficulty: string): string {
    const durations: Record<string, string> = {
      beginner: '2-4 hours',
      intermediate: '4-8 hours',
      advanced: '1-2 days',
      expert: '2-4 days'
    };
    return durations[difficulty] || '4-8 hours';
  }

  private getSkillsForField(field: string): string[] {
    const skills: Record<string, string[]> = {
      software_engineering: ['JavaScript', 'TypeScript', 'Problem Solving', 'Debugging', 'Testing'],
      marketing: ['Content Creation', 'Analytics', 'SEO', 'Social Media', 'Strategy'],
      data_science: ['Python', 'Statistics', 'Data Analysis', 'Visualization', 'Machine Learning'],
      accounting: ['Financial Analysis', 'Excel', 'Bookkeeping', 'Reporting', 'Compliance'],
      sales: ['Communication', 'Negotiation', 'CRM', 'Presentation', 'Relationship Building'],
      human_resources: ['Recruitment', 'Employee Relations', 'Communication', 'Organization', 'Policy Knowledge'],
      project_management: ['Planning', 'Organization', 'Communication', 'Risk Management', 'Agile/Scrum'],
      graphic_design: ['Adobe Creative Suite', 'Typography', 'Color Theory', 'Layout', 'Creativity'],
      customer_service: ['Communication', 'Problem Solving', 'Empathy', 'Product Knowledge', 'Patience'],
      finance: ['Financial Modeling', 'Excel', 'Analysis', 'Reporting', 'Forecasting'],
      legal: ['Research', 'Writing', 'Analysis', 'Attention to Detail', 'Communication']
    };
    return skills[field] || ['Communication', 'Problem Solving', 'Organization', 'Analysis'];
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
