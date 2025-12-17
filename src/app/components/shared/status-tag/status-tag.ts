import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-tag',
  imports: [NgClass],
  templateUrl: './status-tag.html',
  styleUrl: './status-tag.css',
  standalone: true
})
export class StatusTag {
  @Input() progress: 'Completed' | 'Awaiting Review' | 'Incomplete' = 'Incomplete';

  getColorClass(): string {
    if (this.progress === 'Completed') return 'bg-green-100 text-green-700 font-semibold';
    if (this.progress === 'Awaiting Review') return 'bg-yellow-100 text-yellow-700 font-semibold';
    if (this.progress === 'Incomplete') return 'bg-blue-100 text-blue-700 font-semibold';
    return 'bg-gray-100 text-gray-800';
  }
}
