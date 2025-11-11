const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'fr', 'ar', 'zh', 'ja', 'ko', 'de', 'it', 'pt'],
    localePath: path.resolve('./public/locales'),
    localeDetection: true,
    fallbackLng: 'en',
    domains: [
      {
        domain: 'restaurant-hiring.com',
        defaultLocale: 'en',
      },
      {
        domain: 'es.restaurant-hiring.com',
        defaultLocale: 'es',
      },
      {
        domain: 'fr.restaurant-hiring.com',
        defaultLocale: 'fr',
      },
      {
        domain: 'ar.restaurant-hiring.com',
        defaultLocale: 'ar',
      },
    ],
  },
  fallbackLng: 'en',
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  detection: {
    order: ['cookie', 'header', 'querystring', 'path', 'subdomain'],
    caches: ['cookie'],
    cookieName: 'i18next',
    cookieOptions: { 
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  keySeparator: '.',
  nsSeparator: ':',
  pluralSeparator: '_',
  contextSeparator: '_',
  
  // Features for restaurant hiring platform
  supportedLanguages: [
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
  ],
};