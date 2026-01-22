import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LevelInfo } from '../../core/models/database.types';

/**
 * XP Progress Widget Component
 * Displays user's current level, XP, and progress to next level
 */
@Component({
  selector: 'app-xp-progress',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './xp-progress.component.html',
  styleUrls: ['./xp-progress.component.css']
})
export class XpProgressComponent {
  @Input() level!: number;
  @Input() currentXP!: number;
  @Input() levelInfo!: LevelInfo;
  @Input() compact: boolean = false;

  get progressPercentage(): number {
    return this.levelInfo?.xp_progress_percentage || 0;
  }

  get xpToNextLevel(): number {
    if (!this.levelInfo) return 0;
    return this.levelInfo.xp_for_next_level - this.currentXP;
  }
}
