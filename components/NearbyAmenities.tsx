'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface NearbyAmenitiesProps {
  lat: number;
  lng: number;
  address: string;
}

interface Amenity {
  name: string;
  lat: number;
  lng: number;
  distance: number;
}

interface AmenitiesData {
  amenities: {
    grocery: Amenity[];
    restaurants: Amenity[];
    cafes: Amenity[];
    gyms: Amenity[];
    parks: Amenity[];
    libraries: Amenity[];
    transit: Amenity[];
  };
  summary: {
    total: number;
    closest: {
      name: string;
      distance: string;
      category: string;
    } | null;
    byCategory: {
      grocery: number;
      restaurants: number;
      cafes: number;
      gyms: number;
      parks: number;
      libraries: number;
      transit: number;
    };
  };
}

const categoryIcons: { [key: string]: string } = {
  grocery: '🛒',
  restaurants: '🍽️',
  cafes: '☕',
  gyms: '💪',
  parks: '🌳',
  libraries: '📚',
  transit: '🚌',
};

const categoryColors: { [key: string]: string } = {
  grocery: 'from-green-50 to-emerald-50 border-green-200',
  restaurants: 'from-red-50 to-orange-50 border-red-200',
  cafes: 'from-amber-50 to-yellow-50 border-amber-200',
  gyms: 'from-purple-50 to-pink-50 border-purple-200',
  parks: 'from-green-50 to-teal-50 border-green-200',
  libraries: 'from-blue-50 to-indigo-50 border-blue-200',
  transit: 'from-blue-50 to-cyan-50 border-blue-200',
};

export default function NearbyAmenities({ lat, lng, address }: NearbyAmenitiesProps) {
  const [data, setData] = useState<AmenitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchAmenities = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/amenities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, radius: 5 }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch amenities');
        }

        const amenitiesData = await response.json();
        setData(amenitiesData);
      } catch (error: any) {
        console.error('Error fetching amenities:', error);
        toast.error('Failed to load nearby amenities');
      } finally {
        setLoading(false);
      }
    };

    if (lat && lng) {
      fetchAmenities();
    }
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const renderAmenityList = (amenities: Amenity[], category: string) => {
    if (amenities.length === 0) {
      return (
        <div className="text-center py-4 text-xs text-gray-500">
          No {category} found within 5 miles
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {amenities.map((amenity, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-xs truncate">{amenity.name}</div>
            </div>
            <div className="ml-2 shrink-0">
              <span className="text-xs font-semibold text-gray-600">{amenity.distance.toFixed(2)} mi</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(amenity.name + ' Buffalo NY')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors shrink-0"
              title="View on map"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">Nearby Amenities</h3>
        </div>
        {data.summary.total > 0 && (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
            {data.summary.total} found
          </span>
        )}
      </div>

      {/* Summary */}
      {data.summary.closest && (
        <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-xs text-gray-600 mb-1">Closest Amenity</div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {categoryIcons[data.summary.closest.category] || '📍'} {data.summary.closest.name}
            </span>
            <span className="text-xs font-bold text-blue-700">{data.summary.closest.distance} mi</span>
          </div>
        </div>
      )}

      {/* Category Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {Object.entries(data.summary.byCategory).map(([category, count]) => (
          <div
            key={category}
            className={`bg-gradient-to-br ${categoryColors[category]} rounded-lg p-2 border cursor-pointer hover:shadow-md transition-all`}
            onClick={() => toggleCategory(category)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{categoryIcons[category]}</span>
                <span className="text-xs font-semibold text-gray-900 capitalize">{category}</span>
              </div>
              <span className="px-2 py-0.5 bg-white rounded-lg text-xs font-bold text-gray-700">
                {count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Category Lists */}
      {expandedCategory && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <span>{categoryIcons[expandedCategory]}</span>
              <span className="capitalize">{expandedCategory}</span>
            </h4>
            <button
              onClick={() => setExpandedCategory(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          {renderAmenityList(data.amenities[expandedCategory as keyof typeof data.amenities], expandedCategory)}
        </div>
      )}

      {data.summary.total === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📍</div>
          <p className="text-xs text-gray-500">No amenities found within 5 miles</p>
        </div>
      )}
    </div>
  );
}

