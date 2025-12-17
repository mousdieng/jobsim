import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import { Simulation } from '../../../models';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { StatusTag } from '../../shared/status-tag/status-tag';

@Component({
  selector: 'app-simulations-list',
  imports: [NgFor, NgIf, NgClass, StatusTag],
  templateUrl: './simulations-list.html',
  styleUrl: './simulations-list.css',
  standalone: true
})
export class SimulationsList implements OnInit {
  @Input() simulations: Simulation[] = [];
  @Output() selectSimulation = new EventEmitter<Simulation>();

  readonly SIM_CUTOFF_DATE = new Date('2025-10-18');

  categories: string[] = [];
  filter = signal<string>('All');

  filteredSimulations = computed(() => {
    if (this.filter() === 'All') return this.simulations;
    return this.simulations.filter(sim => sim.category === this.filter());
  });

  ngOnInit(): void {
    const categorySet = new Set(this.simulations.map(sim => sim.category));
    this.categories = ['All', ...Array.from(categorySet)];
  }

  setFilter(category: string): void {
    this.filter.set(category);
  }

  onSelectSimulation(sim: Simulation): void {
    this.selectSimulation.emit(sim);
  }

  getDifficultyColor(difficulty: string): string {
    if (difficulty === 'Beginner') return 'text-green-600 font-bold';
    if (difficulty === 'Intermediate') return 'text-yellow-600 font-bold';
    return 'text-red-600 font-bold';
  }

  isNew(dateString: string): boolean {
    const postedDate = new Date(dateString);
    return postedDate > this.SIM_CUTOFF_DATE;
  }
}
