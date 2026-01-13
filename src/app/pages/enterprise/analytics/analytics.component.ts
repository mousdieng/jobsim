import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { EnterpriseService } from '../../../services/enterprise.service';

@Component({
  selector: 'app-enterprise-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class EnterpriseAnalyticsComponent implements OnInit, OnDestroy {
  stats: any = null;
  isLoading = true;
  error: string | null = null;

  // Time period filter
  selectedPeriod: string = 'all';

  private subscriptions: Subscription[] = [];

  constructor(private enterpriseService: EnterpriseService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.error = null;

    const sub = this.enterpriseService.getEnterpriseStats().subscribe({
      next: (stats: any) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.error = err.message || 'Failed to load analytics';
        this.isLoading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    // TODO: Implement period filtering when backend supports it
    this.loadAnalytics();
  }
}
