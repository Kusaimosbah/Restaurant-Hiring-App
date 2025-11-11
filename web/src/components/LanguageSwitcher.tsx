'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage, SUPPORTED_LANGUAGES, Language } from '@/lib/i18n/LanguageService';
import {
  ChevronDownIcon,
  GlobeAltIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'compact' | 'menu';
  showFlag?: boolean;
  showNativeName?: boolean;
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  showFlag = true,
  showNativeName = true,
  className = '',
}) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`h-10 w-32 bg-gray-200 animate-pulse rounded-md ${className}`} />
    );
  }

  const handleLanguageChange = async (language: Language) => {
    try {
      await changeLanguage(language.code);
      setIsOpen(false);
      
      // Show success notification
      // You can integrate with your notification system here
    } catch (error) {
      console.error('Failed to change language:', error);
      // Show error notification
    }
  };

  const getLanguageFlag = (languageCode: string): string => {
    const flagMap: Record<string, string> = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'ar': '🇸🇦',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'de': '🇩🇪',
      'it': '🇮🇹',
      'pt': '🇵🇹',
    };
    return flagMap[languageCode] || '🌐';
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('common.selectLanguage')}
        >
          {showFlag && (
            <span className="text-lg">{getLanguageFlag(currentLanguage.code)}</span>
          )}
          <span className="text-sm font-medium text-gray-700">
            {currentLanguage.code.toUpperCase()}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 py-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language)}
                  className={`${
                    currentLanguage.code === language.code
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  } flex items-center justify-between w-full px-4 py-2 text-sm text-left`}
                >
                  <div className="flex items-center space-x-3">
                    {showFlag && (
                      <span className="text-lg">{getLanguageFlag(language.code)}</span>
                    )}
                    <div>
                      <div className="font-medium">{language.name}</div>
                      {showNativeName && language.nativeName !== language.name && (
                        <div className="text-xs text-gray-500">{language.nativeName}</div>
                      )}
                    </div>
                  </div>
                  {currentLanguage.code === language.code && (
                    <CheckIcon className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  if (variant === 'menu') {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {t('common.language')}
        </div>
        {SUPPORTED_LANGUAGES.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language)}
            className={`${
              currentLanguage.code === language.code
                ? 'bg-blue-50 text-blue-900 border-blue-200'
                : 'text-gray-700 hover:bg-gray-100 border-transparent'
            } flex items-center justify-between w-full px-3 py-2 text-sm text-left border rounded-md transition-colors`}
          >
            <div className="flex items-center space-x-3">
              {showFlag && (
                <span className="text-lg">{getLanguageFlag(language.code)}</span>
              )}
              <div>
                <div className="font-medium">{language.name}</div>
                {showNativeName && language.nativeName !== language.name && (
                  <div className="text-xs text-gray-500">{language.nativeName}</div>
                )}
              </div>
            </div>
            {currentLanguage.code === language.code && (
              <CheckIcon className="w-4 h-4 text-blue-600" />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label={t('common.selectLanguage')}
      >
        <GlobeAltIcon className="w-5 h-5 text-gray-500" />
        <div className="flex items-center space-x-2">
          {showFlag && (
            <span className="text-lg">{getLanguageFlag(currentLanguage.code)}</span>
          )}
          <span className="text-sm font-medium text-gray-700">
            {showNativeName ? currentLanguage.nativeName : currentLanguage.name}
          </span>
        </div>
        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 py-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              {t('common.selectLanguage')}
            </div>
            {SUPPORTED_LANGUAGES.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={`${
                  currentLanguage.code === language.code
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                } flex items-center justify-between w-full px-4 py-3 text-sm text-left transition-colors`}
              >
                <div className="flex items-center space-x-3">
                  {showFlag && (
                    <span className="text-lg">{getLanguageFlag(language.code)}</span>
                  )}
                  <div>
                    <div className="font-medium">{language.name}</div>
                    {showNativeName && language.nativeName !== language.name && (
                      <div className="text-xs text-gray-500">{language.nativeName}</div>
                    )}
                  </div>
                </div>
                {currentLanguage.code === language.code && (
                  <CheckIcon className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;