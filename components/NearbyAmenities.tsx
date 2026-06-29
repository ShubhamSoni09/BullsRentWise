'use client';

import { useState, useEffect } from 'react';

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
  grocery: 'bg-green-50 border-green-200',
  restaurants: 'bg-red-50 border-red-200',
  cafes: 'bg-amber-50 border-amber-200',
  gyms: 'bg-slate-50 border-slate-200',
  parks: 'bg-emerald-50 border-emerald-200',
  libraries: 'bg-blue-50 border-blue-200',
  transit: 'bg-cyan-50 border-cyan-200',
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
      <div className="app-card p-4 animate-pulse">
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
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:shadow-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-xs truncate">{amenity.name}</div>
            </div>
            <div className="ml-2 shrink-0">
              <span className="text-xs font-semibold text-gray-600">{amenity.distance.toFixed(2)} mi</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${amenity.name} near ${address}`)}`}
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
    <div className="app-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="icon-tile h-9 w-9 bg-emerald-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-base font-black text-slate-950">Nearby Amenities</h3>
        </div>
        {data.summary.total > 0 && (
          <span className="stat-pill">
            {data.summary.total} found
          </span>
        )}
      </div>

      {/* Summary */}
      {data.summary.closest && (
        <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-3">
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
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(data.summary.byCategory).map(([category, count]) => (
          <div
            key={category}
            className={`cursor-pointer rounded-2xl border p-3 transition-all hover:shadow-sm ${categoryColors[category]}`}
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
        <div className="mt-4 border-t border-slate-200 pt-4">
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
        <div className="empty-state py-8">
          <div className="text-4xl mb-2">📍</div>
          <p className="text-xs text-gray-500">No amenities found within 5 miles</p>
        </div>
      )}
    </div>
  );
}

