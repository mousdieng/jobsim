import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="flex items-center space-x-2">
      <button
        *ngFor="let lang of languages"
        (click)="switchLanguage(lang.code)"
        [class.bg-white]="isActive(lang.code)"
        [class.text-indigo-700]="isActive(lang.code)"
        [class.text-indigo-100]="!isActive(lang.code)"
        [class.hover:bg-white/10]="!isActive(lang.code)"
        class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
        [attr.title]="'nav.language_switcher' | translate"
      >
        {{ lang.label }}
      </button>
    </div>
  `
})
export class LanguageSwitcherComponent {
  languages = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' }
  ];

  constructor(public languageService: LanguageService) {}

  switchLanguage(lang: string): void {
    this.languageService.setLanguage(lang);
  }

  isActive(lang: string): boolean {
    return this.languageService.getCurrentLanguage() === lang;
  }
}
