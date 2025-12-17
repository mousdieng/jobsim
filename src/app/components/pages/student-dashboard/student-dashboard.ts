import { Component, Input } from '@angular/core';
import { Submission, User } from '../../../models';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Badge } from '../../shared/badge/badge';

@Component({
  selector: 'app-student-dashboard',
  imports: [NgIf, NgFor, DatePipe, Badge],
  templateUrl: './student-dashboard.html',
  styleUrl: './student-dashboard.css',
  standalone: true
})
export class StudentDashboard {
  @Input() submissions: Submission[] = [];
  @Input() user: User | null = null;

  showFeedback(submission: Submission): void {
    if (submission.feedback) {
      alert(`Feedback for ${submission.title}:\n${submission.feedback}`);
    }
  }

  promoteProfile(): void {
    alert("This button simulates promoting your profile to a pool of interested employers!");
  }
}
