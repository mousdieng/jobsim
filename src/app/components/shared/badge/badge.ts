import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-badge',
  imports: [NgClass],
  templateUrl: './badge.html',
  styleUrl: './badge.css',
  standalone: true
})
export class Badge {
  @Input() level: string = '';

  getColorClass(): string {
    if (this.level === 'Task Master') return 'bg-blue-100 text-blue-800';
    if (this.level === 'Simulation Ace') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  }
}
