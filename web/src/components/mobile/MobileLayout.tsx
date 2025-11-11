'use client';

import React, { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function MobileLayout({
  children,
  showBottomNav = true,
  title,
  showBackButton = false,
  onBack,
  rightAction,
}: MobileLayoutProps) {
  const { isOnline, installationStatus } = usePWA();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Show install prompt if app can be installed
    if (installationStatus.canInstall && !installationStatus.isInstalled) {
      const hasSeenPrompt = localStorage.getItem('pwa-install-prompt-seen');
      if (!hasSeenPrompt) {
        setShowInstallPrompt(true);
      }
    }
  }, [installationStatus]);

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-seen', 'true');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Status Bar */}
      <StatusBar isOnline={isOnline} />

      {/* Top Navigation */}
      {(title || showBackButton || rightAction) && (
        <TopNavigation
          title={title}
          showBackButton={showBackButton}
          onBack={onBack}
          rightAction={rightAction}
        />
      )}

      {/* Install Prompt */}
      {showInstallPrompt && (
        <InstallPrompt
          onInstall={() => {
            installationStatus.canInstall && window.location.reload();
            dismissInstallPrompt();
          }}
          onDismiss={dismissInstallPrompt}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 ${showBottomNav ? 'pb-16' : ''}`}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}

function StatusBar({ isOnline }: { isOnline: boolean }) {
  return (
    <div className={`h-1 transition-colors duration-300 ${
      isOnline ? 'bg-green-400' : 'bg-red-400'
    }`} />
  );
}

function TopNavigation({
  title,
  showBackButton,
  onBack,
  rightAction,
}: {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        {showBackButton && (
          <button
            onClick={onBack || (() => window.history.back())}
            className="mr-3 p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
        )}
      </div>
      {rightAction && (
        <div className="flex items-center">
          {rightAction}
        </div>
      )}
    </header>
  );
}

function InstallPrompt({
  onInstall,
  onDismiss,
}: {
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <div className="font-medium">Install App</div>
          <div className="text-sm text-blue-100">Add to home screen for quick access</div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onInstall}
          className="bg-white text-blue-500 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          className="text-blue-100 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function BottomNavigation() {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Set active tab based on current path
    const path = window.location.pathname;
    if (path.includes('/jobs')) setActiveTab('jobs');
    else if (path.includes('/messages')) setActiveTab('messages');
    else if (path.includes('/profile')) setActiveTab('profile');
    else setActiveTab('dashboard');
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'jobs',
      label: 'Jobs',
      href: '/jobs',
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
        </svg>
      ),
    },
    {
      id: 'messages',
      label: 'Messages',
      href: '/messages',
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <a
              key={item.id}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 px-1 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon(isActive)}
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

// Touch-optimized button component
export function TouchButton({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  className?: string;
  [key: string]: any;
}) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-300',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
  };

  const sizeClasses = {
    small: 'px-3 py-2 text-sm min-h-[40px]',
    medium: 'px-4 py-3 text-base min-h-[48px]',
    large: 'px-6 py-4 text-lg min-h-[56px]',
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// Mobile-optimized card component
export function MobileCard({
  children,
  padding = 'medium',
  className = '',
  onClick,
  hover = false,
}: {
  children: React.ReactNode;
  padding?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: (e?: React.MouseEvent) => void;
  hover?: boolean;
}) {
  const baseClasses = 'bg-white rounded-lg border border-gray-200 transition-all duration-200';
  
  const paddingClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  const interactiveClasses = onClick ? 'cursor-pointer active:scale-[0.98]' : '';
  const hoverClasses = hover ? 'hover:shadow-md' : '';

  return (
    <div
      className={`${baseClasses} ${paddingClasses[padding]} ${interactiveClasses} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Pull-to-refresh component
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0 && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY);
      setPullDistance(Math.min(distance * 0.5, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 50 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setStartY(0);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none',
      }}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div className="flex justify-center py-2">
          <div className={`transition-all duration-200 ${
            pullDistance > 50 ? 'text-blue-600' : 'text-gray-400'
          }`}>
            {isRefreshing ? (
              <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </div>
        </div>
      )}
      
      {children}
    </div>
  );
}