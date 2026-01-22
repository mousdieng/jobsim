import { Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import {
  CandidateProfile,
  Achievement,
  XPCalculation,
  LevelInfo,
  TaskDifficulty,
  ApiResponse
} from '../models/database.types';

/**
 * XP Service - Handles all XP, leveling, and achievement logic
 */
@Injectable({
  providedIn: 'root'
})
export class XPService {
  // Level thresholds
  private readonly LEVEL_THRESHOLDS = {
    1: 0,
    2: 500,
    3: 1500,
    4: 3000,
    5: 5000,
    6: 7500,
    7: 10000
  };

  // Attempt multipliers
  private readonly ATTEMPT_MULTIPLIERS = {
    1: 2.0,
    2: 1.5,
    3: 1.25,
    4: 1.0,
    5: 0.75
  };

  constructor(private supabase: SupabaseService) {}

  /**
   * Calculate XP for a submission
   */
  calculateSubmissionXP(
    baseXP: number,
    difficultyMultiplier: number,
    attemptNumber: number
  ): XPCalculation {
    const attemptMultiplier =
      attemptNumber <= 5
        ? this.ATTEMPT_MULTIPLIERS[attemptNumber as keyof typeof this.ATTEMPT_MULTIPLIERS]
        : 0.75;

    const totalXP = Math.round(baseXP * difficultyMultiplier * attemptMultiplier);

    return {
      base_xp: baseXP,
      difficulty_multiplier: difficultyMultiplier,
      attempt_multiplier: attemptMultiplier,
      total_xp: totalXP
    };
  }

  /**
   * Get level from XP amount
   */
  getLevelFromXP(xp: number): number {
    if (xp >= this.LEVEL_THRESHOLDS[7]) return 7;
    if (xp >= this.LEVEL_THRESHOLDS[6]) return 6;
    if (xp >= this.LEVEL_THRESHOLDS[5]) return 5;
    if (xp >= this.LEVEL_THRESHOLDS[4]) return 4;
    if (xp >= this.LEVEL_THRESHOLDS[3]) return 3;
    if (xp >= this.LEVEL_THRESHOLDS[2]) return 2;
    return 1;
  }

  /**
   * Get XP required for next level
   */
  getXPForNextLevel(currentLevel: number): number | null {
    if (currentLevel >= 7) return null; // Max level
    return this.LEVEL_THRESHOLDS[(currentLevel + 1) as keyof typeof this.LEVEL_THRESHOLDS];
  }

  /**
   * Get level info with progress
   */
  getLevelInfo(currentXP: number): LevelInfo {
    const currentLevel = this.getLevelFromXP(currentXP);
    const xpForNextLevel = this.getXPForNextLevel(currentLevel);

    if (xpForNextLevel === null) {
      // Max level reached
      return {
        current_level: currentLevel,
        current_xp: currentXP,
        xp_for_next_level: 0,
        xp_progress_percentage: 100
      };
    }

    const xpForCurrentLevel = this.LEVEL_THRESHOLDS[currentLevel as keyof typeof this.LEVEL_THRESHOLDS];
    const xpProgress = currentXP - xpForCurrentLevel;
    const xpRequired = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.round((xpProgress / xpRequired) * 100);

    return {
      current_level: currentLevel,
      current_xp: currentXP,
      xp_for_next_level: xpForNextLevel,
      xp_progress_percentage: progressPercentage
    };
  }

  /**
   * Get category level info
   */
  getCategoryLevelInfo(categoryXP: number): LevelInfo {
    const categoryThresholds = {
      1: 0,
      2: 500,
      3: 1500,
      4: 3000,
      5: 5000
    };

    let currentLevel = 1;
    if (categoryXP >= 5000) currentLevel = 5;
    else if (categoryXP >= 3000) currentLevel = 4;
    else if (categoryXP >= 1500) currentLevel = 3;
    else if (categoryXP >= 500) currentLevel = 2;

    const xpForNextLevel = currentLevel < 5 ? categoryThresholds[(currentLevel + 1) as 2 | 3 | 4 | 5] : null;

    if (xpForNextLevel === null) {
      return {
        current_level: currentLevel,
        current_xp: categoryXP,
        xp_for_next_level: 0,
        xp_progress_percentage: 100
      };
    }

    const xpForCurrentLevel = categoryThresholds[currentLevel as keyof typeof categoryThresholds];
    const xpProgress = categoryXP - xpForCurrentLevel;
    const xpRequired = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.round((xpProgress / xpRequired) * 100);

    return {
      current_level: currentLevel,
      current_xp: categoryXP,
      xp_for_next_level: xpForNextLevel,
      xp_progress_percentage: progressPercentage
    };
  }

  /**
   * Get all achievements
   */
  getAchievements(): Observable<ApiResponse<Achievement[]>> {
    return from(
      this.supabase.client
        .from('achievements')
        .select('*')
        .order('category, name')
    ).pipe(
      map(({ data, error }) => ({
        data: data as Achievement[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get candidate's unlocked achievements
   */
  getUnlockedAchievements(candidateId: string): Observable<ApiResponse<Achievement[]>> {
    return from(
      (async () => {
        // Get candidate's achievements
        const { data: profile, error: profileError } = await this.supabase.client
          .from('candidate_profiles')
          .select('achievements')
          .eq('id', candidateId)
          .single();

        if (profileError || !profile) {
          return { data: null, error: profileError };
        }

        const achievementIds = profile.achievements || [];

        if (achievementIds.length === 0) {
          return { data: [], error: null };
        }

        // Get achievement details
        const { data: achievements, error: achievementsError } = await this.supabase.client
          .from('achievements')
          .select('*')
          .in('id', achievementIds);

        return { data: achievements, error: achievementsError };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as Achievement[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get leaderboard (top candidates by overall XP)
   */
  getLeaderboard(limit: number = 10): Observable<ApiResponse<CandidateProfile[]>> {
    return from(
      this.supabase.client
        .from('candidate_profiles')
        .select('*, profiles!inner(full_name, avatar_url)')
        .order('overall_xp', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => ({
        data: data as any[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get category leaderboard
   */
  getCategoryLeaderboard(category: string, limit: number = 10): Observable<ApiResponse<any[]>> {
    return from(
      (async () => {
        const { data, error } = await this.supabase.client
          .from('candidate_profiles')
          .select('*, profiles!inner(full_name, avatar_url)');

        if (error || !data) {
          return { data: null, error };
        }

        // Filter and sort by category XP
        const filtered = data
          .map((profile: any) => ({
            ...profile,
            category_xp_value: profile.category_xp?.[category] || 0
          }))
          .filter((profile: any) => profile.category_xp_value > 0)
          .sort((a: any, b: any) => b.category_xp_value - a.category_xp_value)
          .slice(0, limit);

        return { data: filtered, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data: data as any[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get recommended tasks based on candidate's level and categories
   */
  getRecommendedTasks(candidateProfile: CandidateProfile): Observable<ApiResponse<any[]>> {
    const overallLevel = candidateProfile.overall_level;

    // Determine recommended difficulty
    let recommendedDifficulty: TaskDifficulty = 'beginner';
    if (overallLevel >= 6) recommendedDifficulty = 'expert';
    else if (overallLevel >= 4) recommendedDifficulty = 'advanced';
    else if (overallLevel >= 2) recommendedDifficulty = 'intermediate';

    return from(
      this.supabase.client
        .from('tasks')
        .select('*')
        .eq('status', 'active')
        .eq('difficulty', recommendedDifficulty)
        .limit(10)
    ).pipe(
      map(({ data, error }) => ({
        data: data as any[] | null,
        error: error?.message || null
      }))
    );
  }

  /**
   * Get XP statistics for a candidate
   */
  getXPStats(candidateId: string): Observable<ApiResponse<any>> {
    return from(
      (async () => {
        const { data: profile, error } = await this.supabase.client
          .from('candidate_profiles')
          .select('*')
          .eq('id', candidateId)
          .single();

        if (error || !profile) {
          return { data: null, error };
        }

        const overallLevelInfo = this.getLevelInfo(profile.overall_xp);

        // Calculate category stats
        const categoryStats = Object.entries(profile.category_xp || {}).map(
          ([category, xp]) => ({
            category,
            xp: xp as number,
            levelInfo: this.getCategoryLevelInfo(xp as number)
          })
        );

        const stats = {
          overall: {
            xp: profile.overall_xp,
            level: profile.overall_level,
            levelInfo: overallLevelInfo
          },
          categories: categoryStats,
          tasks_completed: profile.tasks_completed,
          tasks_attempted: profile.tasks_attempted,
          approval_rate: profile.approval_rate,
          achievements_unlocked: profile.achievements?.length || 0
        };

        return { data: stats, error: null };
      })()
    ).pipe(
      map(({ data, error }) => ({
        data,
        error: error?.message || null
      }))
    );
  }
}
