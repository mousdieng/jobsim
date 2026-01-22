import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../services/supabase.service';
import { NotificationService } from '../../../services/notification.service';

interface CandidateProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;

  // Stats from candidate_profiles
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
  is_open_to_opportunities?: boolean;
  preferred_categories?: string[];
}

@Component({
  selector: 'app-enterprise-candidate-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidate-list.component.html',
  styleUrls: ['./candidate-list.component.css']
})
export class EnterpriseCandidateListComponent implements OnInit {
  candidates: CandidateProfile[] = [];
  filteredCandidates: CandidateProfile[] = [];
  loading = true;
  error: string | null = null;

  // Filters
  searchTerm = '';
  skillFilter = '';
  categoryFilter = '';
  minTasksCompleted = 0;
  onlyOpenToOpportunities = false;

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadCandidates();
  }

  async loadCandidates(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      // Get all candidates with their profiles
      const { data: profiles, error } = await this.supabase.client
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          avatar_url,
          role,
          created_at
        `)
        .eq('role', 'candidate')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        this.candidates = [];
        this.filteredCandidates = [];
        this.loading = false;
        return;
      }

      // Get candidate stats for each candidate
      const candidateIds = profiles.map(p => p.id);
      const { data: candidateProfiles, error: profileError } = await this.supabase.client
        .from('candidate_profiles')
        .select('*')
        .in('id', candidateIds);

      if (profileError) {
        console.warn('Error loading candidate profiles:', profileError);
      }

      // Merge data
      this.candidates = profiles.map(profile => {
        const candidateProfile = candidateProfiles?.find(cp => cp.id === profile.id);
        return {
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
          is_open_to_opportunities: candidateProfile?.is_open_to_opportunities ?? false,
          preferred_categories: candidateProfile?.preferred_categories || []
        };
      });

      this.applyFilters();
      this.loading = false;
    } catch (err: any) {
      console.error('Error loading candidates:', err);
      this.error = err.message || 'Failed to load candidates';
      this.loading = false;
    }
  }

  applyFilters(): void {
    let filtered = [...this.candidates];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.full_name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.skills?.some(s => s.toLowerCase().includes(term))
      );
    }

    // Skill filter
    if (this.skillFilter) {
      filtered = filtered.filter(c =>
        c.skills?.some(s => s.toLowerCase().includes(this.skillFilter.toLowerCase()))
      );
    }

    // Category filter
    if (this.categoryFilter) {
      filtered = filtered.filter(c =>
        c.preferred_categories?.includes(this.categoryFilter)
      );
    }

    // Min tasks completed filter
    if (this.minTasksCompleted > 0) {
      filtered = filtered.filter(c => (c.tasks_completed || 0) >= this.minTasksCompleted);
    }

    // Only show candidates open to opportunities
    if (this.onlyOpenToOpportunities) {
      filtered = filtered.filter(c => c.is_open_to_opportunities === true);
    }

    this.filteredCandidates = filtered;
    this.totalPages = Math.ceil(this.filteredCandidates.length / this.pageSize);
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.skillFilter = '';
    this.categoryFilter = '';
    this.minTasksCompleted = 0;
    this.onlyOpenToOpportunities = false;
    this.applyFilters();
  }

  get paginatedCandidates(): CandidateProfile[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredCandidates.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  viewCandidate(candidateId: string): void {
    this.router.navigate(['/enterprise/candidates', candidateId]);
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
}
