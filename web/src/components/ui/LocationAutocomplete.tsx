'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Common Malaysian cities for restaurants
const COMMON_LOCATIONS = [
  'Kuala Lumpur, KL',
  'George Town, Penang',
  'Ipoh, Perak',
  'Shah Alam, Selangor',
  'Petaling Jaya, Selangor',
  'Klang, Selangor',
  'Johor Bahru, Johor',
  'Subang Jaya, Selangor',
  'Kuala Terengganu, Terengganu',
  'Kota Kinabalu, Sabah',
  'Seremban, Negeri Sembilan',
  'Kuantan, Pahang',
  'Kajang, Selangor',
  'Alor Setar, Kedah',
  'Tawau, Sabah',
  'Iskandar Puteri, Johor',
  'Kuching, Sarawak',
  'Ampang, Selangor',
  'Miri, Sarawak',
  'Sandakan, Sabah',
  'Kuala Langat, Selangor',
  'Sepang, Selangor',
  'Nilai, Negeri Sembilan',
  'Kulim, Kedah',
  'Batu Pahat, Johor',
  'Kluang, Johor',
  'Muar, Johor',
  'Pasir Gudang, Johor',
  'Segamat, Johor',
  'Butterworth, Penang',
  'Taiping, Perak',
  'Sibu, Sarawak',
  'Melaka, Melaka',
  'Bentong, Pahang',
  'Temerloh, Pahang',
  'Kota Bharu, Kelantan',
  'Kangar, Perlis',
  'Labuan, Labuan',
  'Putrajaya, Putrajaya',
  'Cyberjaya, Selangor',
  'Bangi, Selangor',
  'Cheras, KL',
  'Damansara, Selangor',
  'Mont Kiara, KL',
  'KLCC, KL',
  'Bangsar, KL',
  'Sri Hartamas, KL',
  'Bukit Bintang, KL',
  'Mid Valley, KL'
];

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "e.g., Kuala Lumpur, KL",
  className = "w-full border border-gray-300 rounded-md px-3 py-2"
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const filtered = COMMON_LOCATIONS.filter(location =>
        location.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations([]);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleLocationSelect = (location: string) => {
    onChange(location);
    setIsOpen(false);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // For now, just indicate user location was requested
          // In production, you'd reverse geocode these coordinates
          onChange(`Current Location (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPinIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`pl-10 pr-20 ${className}`}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
          title="Use current location"
        >
          Use GPS
        </button>
      </div>
      
      {isOpen && filteredLocations.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredLocations.map((location, index) => (
            <div
              key={index}
              onClick={() => handleLocationSelect(location)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
            >
              <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
              {location}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}