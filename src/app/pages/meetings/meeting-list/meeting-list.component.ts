import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PlatformService } from '../../../services/platform.service';
import { Meeting } from '../../../models/platform.model';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './meeting-list.component.html',
  styleUrls: ['./meeting-list.component.css']
})
export class MeetingListComponent implements OnInit {
  meetings: Meeting[] = [];
  taskId: string | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private platformService: PlatformService
  ) {}

  ngOnInit(): void {
    this.taskId = this.route.snapshot.paramMap.get('taskId');
    if (this.taskId) {
      this.loadMeetings(this.taskId);
    }
  }

  async loadMeetings(taskId: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await this.platformService.getMeetings(taskId);
      if (response.error) {
        this.error = response.error;
      } else {
        this.meetings = response.data || [];
      }
    } catch (err: any) {
      this.error = err.message || 'Failed to load meetings';
    } finally {
      this.isLoading = false;
    }
  }

  getMeetingTypeIcon(type: string): string {
    switch (type) {
      case 'kickoff': return 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z';
      case 'standup': return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'review': return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2';
      case 'client_call': return 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
      default: return 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z';
    }
  }
}
