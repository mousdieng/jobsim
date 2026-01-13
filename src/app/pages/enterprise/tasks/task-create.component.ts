import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EnterpriseService } from '../../../services/enterprise.service';
import { EnterpriseTaskSpecification } from '../../../models/platform.model';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-enterprise-task-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-create.component.html',
  styleUrls: ['./task-create.component.css']
})
export class EnterpriseTaskCreateComponent {
  Math = Math; // Expose Math to template for progress calculation
  loading = false;
  currentStep = 1;
  totalSteps = 10;

  specification: EnterpriseTaskSpecification = {
    task_identity: {
      title: '',
      domain: '',
      sub_domain: '',
      difficulty_level: 'intermediate',
      estimated_completion_time: '',
      task_type: 'hands_on',
      created_by: 'Enterprise'
    },
    business_context: {
      company: '',
      business_problem: '',
      business_impact: '',
      stakeholders: ['']
    },
    task_objective: {
      goal: '',
      business_outcome: '',
      skills_evaluated: ['']
    },
    scope_and_constraints: {
      must_do: [''],
      must_not_do: [''],
      assumptions: {
        tools_available: '',
        data_access: '',
        environment: ''
      },
      constraints: {
        time_limit: '',
        resource_limit: ''
      }
    },
    deliverables: [{
      name: '',
      format: '',
      naming: '',
      requirements: ['']
    }],
    evaluation_criteria: {
      technical_correctness: {
        weight: '40%',
        indicators: ['']
      }
    },
    validation_rules: {
      minimum_requirements: [''],
      automatic_rejection: [''],
      compliance_checks: ['']
    },
    visibility_and_access: {
      eligible_domains: [''],
      student_level: 'Intermediate and above',
      enterprise_visibility: {
        submissions: 'Enterprise who created task + Admin',
        candidate_identity: 'Anonymized until evaluation complete'
      },
      support_visibility: 'Read-only access to task description only'
    },
    lifecycle_status: 'draft',
    optional_enhancements: {
      reference_documents: [''],
      sample_data: '',
      clarification_faq: {},
      bonus_challenges: ['']
    }
  };

  constructor(
    private enterpriseService: EnterpriseService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  addItem(array: string[]) {
    array.push('');
  }

  removeItem(array: string[], index: number) {
    array.splice(index, 1);
  }

  addDeliverable() {
    this.specification.deliverables.push({
      name: '',
      format: '',
      naming: '',
      requirements: ['']
    });
  }

  removeDeliverable(index: number) {
    this.specification.deliverables.splice(index, 1);
  }

  addCriterion() {
    const key = `criterion_${Object.keys(this.specification.evaluation_criteria).length + 1}`;
    this.specification.evaluation_criteria[key] = {
      weight: '',
      indicators: ['']
    };
  }

  getCriterionKeys(): string[] {
    return Object.keys(this.specification.evaluation_criteria);
  }

  removeCriterion(key: string) {
    delete this.specification.evaluation_criteria[key];
  }

  addFaqItem() {
    const key = `Q${Object.keys(this.specification.optional_enhancements?.clarification_faq || {}).length + 1}`;
    if (!this.specification.optional_enhancements) {
      this.specification.optional_enhancements = { clarification_faq: {} };
    }
    if (!this.specification.optional_enhancements.clarification_faq) {
      this.specification.optional_enhancements.clarification_faq = {};
    }
    this.specification.optional_enhancements.clarification_faq[key] = '';
  }

  getFaqKeys(): string[] {
    return Object.keys(this.specification.optional_enhancements?.clarification_faq || {});
  }

  removeFaqItem(key: string) {
    if (this.specification.optional_enhancements?.clarification_faq) {
      delete this.specification.optional_enhancements.clarification_faq[key];
    }
  }

  saveAsDraft() {
    this.specification.lifecycle_status = 'draft';
    this.submitTask();
  }

  publish() {
    this.specification.lifecycle_status = 'active';
    this.submitTask();
  }

  private submitTask() {
    this.loading = true;

    this.enterpriseService.createTask(this.specification).subscribe({
      next: (task) => {
        this.loading = false;
        this.notificationService.success(`Task "${task.title}" created successfully!`);
        this.router.navigate(['/enterprise/tasks']);
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.error('Failed to create task: ' + err.message);
        console.error('Task creation error:', err);
      }
    });
  }

  cancel() {
    if (confirm('Are you sure you want to cancel? All entered data will be lost.')) {
      this.router.navigate(['/enterprise/tasks']);
    }
  }
}
