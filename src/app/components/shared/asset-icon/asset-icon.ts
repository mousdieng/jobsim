import { Component, Input } from '@angular/core';
import { NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';

@Component({
  selector: 'app-asset-icon',
  imports: [NgSwitch, NgSwitchCase, NgSwitchDefault],
  templateUrl: './asset-icon.html',
  styleUrl: './asset-icon.css',
  standalone: true
})
export class AssetIcon {
  @Input() type: 'pdf' | 'excel' | 'github' = 'pdf';

  getColorClass(): string {
    if (this.type === 'excel') return 'text-green-600';
    if (this.type === 'pdf') return 'text-red-600';
    if (this.type === 'github') return 'text-gray-900';
    return 'text-gray-500';
  }
}
