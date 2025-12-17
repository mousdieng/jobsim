import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Simulation } from '../../../models';
import { DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetIcon } from '../../shared/asset-icon/asset-icon';

@Component({
  selector: 'app-simulation-detail',
  imports: [NgIf, NgFor, NgClass, FormsModule, AssetIcon, DatePipe],
  templateUrl: './simulation-detail.html',
  styleUrl: './simulation-detail.css',
  standalone: true
})
export class SimulationDetail {
  @Input() simulation: Simulation | null = null;
  @Output() goBack = new EventEmitter<void>();

  submissionText: string = '';
  currentDate = new Date();

  onGoBack(): void {
    this.goBack.emit();
  }

  getDifficultyColor(difficulty: string): string {
    if (difficulty === 'Beginner') return 'bg-green-100 text-green-700 border-green-300';
    if (difficulty === 'Intermediate') return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  }

  getUrgencyColor(urgency: string): string {
    if (urgency === 'High') return 'bg-red-500 text-white';
    if (urgency === 'Medium') return 'bg-yellow-400 text-gray-900';
    return 'bg-green-500 text-white';
  }

  handleSubmit(): void {
    if (!this.submissionText.trim() && this.simulation?.deliverables && this.simulation.deliverables.length > 0) {
      console.warn("Please provide some input or attach your files before submitting.");
      return;
    }

    if (this.simulation) {
      console.log(`Submitting task: ${this.simulation.title} with text: ${this.submissionText.substring(0, 50)}...`);
      console.log(`Submission successful! Your task for "${this.simulation.title}" is now awaiting review.`);
      this.onGoBack();
    }
  }
}
