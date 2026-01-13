import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANGUAGE_KEY = 'preferred_language';
  private readonly SUPPORTED_LANGUAGES = ['fr'];
  private readonly DEFAULT_LANGUAGE = 'fr';

  constructor(private translate: TranslateService) {
    this.initLanguage();
  }

  private initLanguage(): void {
    // Force French only
    this.translate.addLangs(this.SUPPORTED_LANGUAGES);
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);
    this.translate.use(this.DEFAULT_LANGUAGE);
    localStorage.setItem(this.LANGUAGE_KEY, this.DEFAULT_LANGUAGE);
  }

  setLanguage(lang: string): void {
    // Only French is supported
    this.translate.use(this.DEFAULT_LANGUAGE);
    localStorage.setItem(this.LANGUAGE_KEY, this.DEFAULT_LANGUAGE);
  }

  getCurrentLanguage(): string {
    return this.DEFAULT_LANGUAGE;
  }

  getSupportedLanguages(): string[] {
    return this.SUPPORTED_LANGUAGES;
  }
}
