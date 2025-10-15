'use client';

import { useState, useEffect, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface TabItem {
  id: string;
  name: string;
  content: React.ReactNode;
}

interface ResponsiveTabsProps {
  tabs: TabItem[];
  defaultTab?: number;
  onChange?: (index: number) => void;
  className?: string;
}

export default function ResponsiveTabs({
  tabs,
  defaultTab = 0,
  onChange,
  className = '',
}: ResponsiveTabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(defaultTab);
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 600);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleTabChange = (index: number) => {
    setSelectedIndex(index);
    setIsDropdownOpen(false);
    if (onChange) onChange(index);
  };

  // Mobile dropdown version
  const MobileTabSelector = () => (
    <div className="relative w-full mb-4">
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-haspopup="listbox"
        aria-expanded={isDropdownOpen}
      >
        <span className="block truncate font-medium">{tabs[selectedIndex].name}</span>
        <ChevronDownIcon
          className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          <ul role="listbox" className="py-1">
            {tabs.map((tab, index) => (
              <li
                key={tab.id}
                role="option"
                aria-selected={selectedIndex === index}
                className={`cursor-pointer px-4 py-3 hover:bg-gray-100 ${
                  selectedIndex === index ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-900'
                }`}
                onClick={() => handleTabChange(index)}
              >
                {tab.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // Scrollable horizontal tabs for tablets and larger mobile
  const ScrollableTabList = () => (
    <div className="overflow-x-auto scrollbar-hide">
      <Tab.List className="flex p-1 space-x-1 bg-gray-100 rounded-t-lg min-w-max">
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            className={({ selected }) =>
              `px-4 py-3 text-sm font-medium rounded-md min-w-[120px] transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                selected
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            {tab.name}
          </Tab>
        ))}
      </Tab.List>
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
        {isMobile ? <MobileTabSelector /> : <ScrollableTabList />}
        <Tab.Panels className="p-4 sm:p-6 bg-white rounded-b-lg border-t border-gray-200">
          {tabs.map((tab) => (
            <Tab.Panel key={tab.id}>{tab.content}</Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

// Add scrollbar hiding CSS
const ScrollbarHideStyle = () => (
  <style jsx global>{`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);
