import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { NotificationService } from '../../../services/notification.service';

interface CandidateDetails {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
  overall_xp?: number;
  overall_level?: number;
  tasks_completed?: number;
  tasks_attempted?: number;
  approval_rate?: number;
  skills?: string[];
  bio?: string;
  location?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  resume_url?: string;
  is_open_to_opportunities?: boolean;
  preferred_categories?: string[];
  availability_hours?: number;
  category_xp?: Record<string, number>;
  category_levels?: Record<string, number>;
  achievements?: string[];
}

interface Submission {
  id: string;
  task_id: string;
  attempt_number: number;
  status: string;
  xp_earned: number;
  score: number | null;
  feedback: string | null;
  is_approved: boolean;
  submitted_at: string;
  task: {
    id: string;
    title: string;
    difficulty_level: string;
    job_field: string;
  };
}

@Component({
  selector: 'app-enterprise-candidate-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-detail.component.html',
  styleUrls: ['./candidate-detail.component.css']
})
export class EnterpriseCandidateDetailComponent implements OnInit {
  candidateId: string | null = null;
  candidate: CandidateDetails | null = null;
  submissions: Submission[] = [];
  loading = true;
  error: string | null = null;

  activeTab: 'overview' | 'submissions' | 'skills' = 'overview';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabase: SupabaseService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.candidateId = params['id'];
      if (this.candidateId) {
        this.loadCandidateData();
      }
    });
  }

  async loadCandidateData(): Promise<void> {
    if (!this.candidateId) return;

    this.loading = true;
    this.error = null;

    try {
      // Load candidate profile
      const { data: profile, error: profileError } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', this.candidateId)
        .eq('role', 'candidate')
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Candidate not found');

      // Load candidate stats
      const { data: candidateProfile, error: statsError } = await this.supabase.client
        .from('candidate_profiles')
        .select('*')
        .eq('id', this.candidateId)
        .maybeSingle();

      if (statsError) {
        console.warn('Error loading candidate stats:', statsError);
      }

      // Merge data
      this.candidate = {
        ...profile,
        overall_xp: candidateProfile?.overall_xp || 0,
        overall_level: candidateProfile?.overall_level || 1,
        tasks_completed: candidateProfile?.tasks_completed || 0,
        tasks_attempted: candidateProfile?.tasks_attempted || 0,
        approval_rate: candidateProfile?.approval_rate || 0,
        skills: candidateProfile?.skills || [],
        bio: candidateProfile?.bio,
        location: candidateProfile?.location,
        portfolio_url: candidateProfile?.portfolio_url,
        linkedin_url: candidateProfile?.linkedin_url,
        resume_url: candidateProfile?.resume_url,
        is_open_to_opportunities: candidateProfile?.is_open_to_opportunities ?? false,
        preferred_categories: candidateProfile?.preferred_categories || [],
        availability_hours: candidateProfile?.availability_hours,
        category_xp: candidateProfile?.category_xp || {},
        category_levels: candidateProfile?.category_levels || {},
        achievements: candidateProfile?.achievements || []
      };

      // Load submissions
      await this.loadSubmissions();

      this.loading = false;
    } catch (err: any) {
      console.error('Error loading candidate:', err);
      this.error = err.message || 'Failed to load candidate';
      this.loading = false;
    }
  }

  async loadSubmissions(): Promise<void> {
    if (!this.candidateId) return;

    try {
      const { data, error } = await this.supabase.client
        .from('submissions')
        .select(`
          *,
          task:tasks(id, title, difficulty_level, job_field)
        `)
        .eq('candidate_id', this.candidateId)
        .eq('is_approved', true)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      this.submissions = data || [];
    } catch (err: any) {
      console.error('Error loading submissions:', err);
    }
  }

  goBack(): void {
    this.router.navigate(['/enterprise/candidates']);
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getDifficultyClass(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getCategoryEntries(): Array<{category: string, xp: number, level: number}> {
    if (!this.candidate?.category_xp) return [];

    return Object.keys(this.candidate.category_xp).map(category => ({
      category,
      xp: this.candidate!.category_xp![category] || 0,
      level: this.candidate!.category_levels?.[category] || 1
    })).sort((a, b) => b.xp - a.xp);
  }

  contactCandidate(): void {
    if (!this.candidate?.email) return;

    // Open email client
    window.location.href = `mailto:${this.candidate.email}?subject=Opportunity from ${encodeURIComponent('Your Company')}`;
  }

  shortlistCandidate(): void {
    // TODO: Implement shortlist functionality
    this.notificationService.success('Candidate shortlisted');
  }
}
