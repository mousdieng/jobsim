import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XPService } from '../../core/services/xp.service';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
  unlocked: boolean;
}

/**
 * Achievement List Component
 * Displays user achievements with locked/unlocked states
 */
@Component({
  selector: 'app-achievement-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './achievement-list.component.html',
  styleUrls: ['./achievement-list.component.css']
})
export class AchievementListComponent implements OnInit {
  @Input() unlockedAchievementIds: string[] = [];
  @Input() compact: boolean = false;

  allAchievements: Achievement[] = [];
  achievements: Achievement[] = [];
  isLoading = true;

  constructor(private xpService: XPService) {}

  ngOnInit(): void {
    this.loadAchievements();
  }

  loadAchievements(): void {
    this.xpService.getAchievements().subscribe(result => {
      if (result.data) {
        this.allAchievements = result.data.map(ach => ({
          id: ach.id,
          title: ach.name,
          description: ach.description,
          icon: ach.icon || '🏆',
          condition: ach.criteria_description,
          unlocked: this.unlockedAchievementIds.includes(ach.id)
        }));

        // Sort: unlocked first, then by title
        this.achievements = [...this.allAchievements].sort((a, b) => {
          if (a.unlocked === b.unlocked) {
            return a.title.localeCompare(b.title);
          }
          return a.unlocked ? -1 : 1;
        });
      }
      this.isLoading = false;
    });
  }

  get unlockedCount(): number {
    return this.achievements.filter(a => a.unlocked).length;
  }

  get totalCount(): number {
    return this.achievements.length;
  }

  get progressPercentage(): number {
    if (this.totalCount === 0) return 0;
    return Math.round((this.unlockedCount / this.totalCount) * 100);
  }
}
