import { Component, Input } from '@angular/core';
import { Job, Submission } from '../../../models';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-job-listings',
  imports: [NgFor, NgIf],
  templateUrl: './job-listings.html',
  styleUrl: './job-listings.css',
  standalone: true
})
export class JobListings {
  @Input() jobListings: Job[] = [];
  @Input() submissions: Submission[] = [];

  getCompletedTitles(): string[] {
    return this.submissions
      .filter(sub => sub.score !== null)
      .map(sub => sub.title);
  }

  getMatchingSimulations(job: Job): string[] {
    const completedTitles = this.getCompletedTitles();
    return job.relatedSimulations.filter(simTitle =>
      completedTitles.includes(simTitle)
    );
  }

  hasMatches(job: Job): boolean {
    return this.getMatchingSimulations(job).length > 0;
  }
}
