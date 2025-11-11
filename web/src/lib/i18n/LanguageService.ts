import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import i18n from './index';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false },
];

export class LanguageService {
  /**
   * Get the current language
   */
  static getCurrentLanguage(): Language {
    const currentLang = i18n.language || 'en';
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLang) || SUPPORTED_LANGUAGES[0];
  }

  /**
   * Change the application language
   */
  static async changeLanguage(languageCode: string): Promise<void> {
    try {
      await i18n.changeLanguage(languageCode);
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('i18nextLng', languageCode);
        
        // Update document direction for RTL languages
        const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
        if (language) {
          document.documentElement.dir = language.rtl ? 'rtl' : 'ltr';
          document.documentElement.lang = languageCode;
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  }

  /**
   * Detect user's preferred language from browser settings
   */
  static detectBrowserLanguage(): string {
    if (typeof window === 'undefined') return 'en';

    // Check stored preference first
    const stored = localStorage.getItem('i18nextLng');
    if (stored && SUPPORTED_LANGUAGES.some(lang => lang.code === stored)) {
      return stored;
    }

    // Check browser languages
    const browserLanguages = navigator.languages || [navigator.language];
    
    for (const browserLang of browserLanguages) {
      // Check exact match first
      const exactMatch = SUPPORTED_LANGUAGES.find(lang => 
        lang.code === browserLang.toLowerCase()
      );
      if (exactMatch) return exactMatch.code;

      // Check language prefix (e.g., 'en-US' -> 'en')
      const langPrefix = browserLang.split('-')[0].toLowerCase();
      const prefixMatch = SUPPORTED_LANGUAGES.find(lang => 
        lang.code === langPrefix
      );
      if (prefixMatch) return prefixMatch.code;
    }

    return 'en'; // Default fallback
  }

  /**
   * Get language by country/region
   */
  static getLanguageByRegion(countryCode: string): string {
    const regionLanguageMap: Record<string, string> = {
      'US': 'en', 'CA': 'en', 'GB': 'en', 'AU': 'en', 'NZ': 'en',
      'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'PE': 'es',
      'FR': 'fr', 'BE': 'fr', 'CH': 'fr',
      'SA': 'ar', 'AE': 'ar', 'EG': 'ar', 'MA': 'ar',
      'CN': 'zh', 'TW': 'zh', 'HK': 'zh',
      'JP': 'ja',
      'KR': 'ko',
      'DE': 'de', 'AT': 'de',
      'IT': 'it',
      'BR': 'pt', 'PT': 'pt',
    };

    return regionLanguageMap[countryCode.toUpperCase()] || 'en';
  }

  /**
   * Format number based on current locale
   */
  static formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.getCurrentLanguage().code;
    return new Intl.NumberFormat(locale, options).format(number);
  }

  /**
   * Format currency based on current locale
   */
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    const locale = this.getCurrentLanguage().code;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format date based on current locale
   */
  static formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    const locale = this.getCurrentLanguage().code;
    return new Intl.DateTimeFormat(locale, options).format(date);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(date: Date): string {
    const locale = this.getCurrentLanguage().code;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    const now = new Date();
    const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
    
    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(diffInSeconds, 'second');
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute');
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour');
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (Math.abs(diffInDays) < 30) {
      return rtf.format(diffInDays, 'day');
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (Math.abs(diffInMonths) < 12) {
      return rtf.format(diffInMonths, 'month');
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return rtf.format(diffInYears, 'year');
  }

  /**
   * Get localized error messages
   */
  static getErrorMessage(errorKey: string, params?: Record<string, any>): string {
    return i18n.t(`errors.${errorKey}`, params);
  }

  /**
   * Get localized success messages
   */
  static getSuccessMessage(successKey: string, params?: Record<string, any>): string {
    return i18n.t(`success.${successKey}`, params);
  }

  /**
   * Check if current language is RTL
   */
  static isRTL(): boolean {
    return this.getCurrentLanguage().rtl;
  }

  /**
   * Get direction for CSS
   */
  static getDirection(): 'ltr' | 'rtl' {
    return this.isRTL() ? 'rtl' : 'ltr';
  }

  /**
   * Initialize language on app start
   */
  static async initialize(): Promise<void> {
    try {
      // Detect preferred language
      const preferredLang = this.detectBrowserLanguage();
      
      // Change to preferred language if different from current
      if (i18n.language !== preferredLang) {
        await this.changeLanguage(preferredLang);
      }

      // Set document direction
      const language = this.getCurrentLanguage();
      if (typeof document !== 'undefined') {
        document.documentElement.dir = language.rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = language.code;
      }
    } catch (error) {
      console.error('Error initializing language service:', error);
    }
  }
}

/**
 * Custom hook for language management
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const router = useRouter();

  const currentLanguage = LanguageService.getCurrentLanguage();
  
  const changeLanguage = async (languageCode: string) => {
    try {
      await LanguageService.changeLanguage(languageCode);
      
      // Update Next.js router locale if available
      if (router.locale !== languageCode) {
        await router.push(router.asPath, router.asPath, { locale: languageCode });
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return {
    currentLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    isRTL: LanguageService.isRTL(),
    direction: LanguageService.getDirection(),
    formatNumber: LanguageService.formatNumber,
    formatCurrency: LanguageService.formatCurrency,
    formatDate: LanguageService.formatDate,
    formatRelativeTime: LanguageService.formatRelativeTime,
  };
}

export default LanguageService;