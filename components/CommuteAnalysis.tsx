'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface CommuteAnalysisProps {
  lat: number;
  lng: number;
  address: string;
}

interface CommuteData {
  campuses: {
    north: { distance: string; distanceMiles: number };
    south: { distance: string; distanceMiles: number };
    closest: string;
    closestDistance: string;
  };
  walkability: {
    score: number;
    label: string;
  };
  bikeFriendliness: {
    score: number;
    label: string;
  };
  commuteTimes: {
    walk: number;
    bike: number;
    drive: number;
    transit: number;
  };
  transitRoutes: Array<{
    name: string;
    type: string;
    distance: string;
    frequency: string;
    toCampus: string;
  }>;
  distanceToTransit: string;
}

export default function CommuteAnalysis({ lat, lng, address }: CommuteAnalysisProps) {
  const [data, setData] = useState<CommuteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommuteData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/commute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch commute data');
        }

        const commuteData = await response.json();
        setData(commuteData);
      } catch (error: any) {
        console.error('Error fetching commute data:', error);
        toast.error('Failed to load commute analysis');
      } finally {
        setLoading(false);
      }
    };

    if (lat && lng) {
      fetchCommuteData();
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

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 50) return 'text-blue-600 bg-blue-50';
    if (score >= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-blue-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 hover-lift">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-gray-900">Commute & Transportation</h3>
      </div>

      <div className="space-y-4">
        {/* UB Campus Distances */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
          <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Distance to UB Campuses
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-2 border border-blue-100">
              <div className="text-xs text-gray-600 mb-1">North Campus</div>
              <div className="font-bold text-blue-700">{data.campuses.north.distance} mi</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-blue-100">
              <div className="text-xs text-gray-600 mb-1">South Campus</div>
              <div className="font-bold text-blue-700">{data.campuses.south.distance} mi</div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Closest Campus:</span>
              <span className="font-semibold text-blue-700">{data.campuses.closest} ({data.campuses.closestDistance} mi)</span>
            </div>
          </div>
        </div>

        {/* Walkability & Bike-Friendliness */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-xs">Walkability</h4>
              <div className={`px-2 py-1 rounded-lg text-white text-xs font-bold ${getScoreBadgeColor(data.walkability.score)}`}>
                {data.walkability.score}
              </div>
            </div>
            <div className={`text-xs font-medium ${getScoreColor(data.walkability.score)} px-2 py-1 rounded`}>
              {data.walkability.label}
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    data.walkability.score >= 70 ? 'bg-green-500' :
                    data.walkability.score >= 50 ? 'bg-blue-500' :
                    data.walkability.score >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.walkability.score}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-xs">Bike-Friendly</h4>
              <div className={`px-2 py-1 rounded-lg text-white text-xs font-bold ${getScoreBadgeColor(data.bikeFriendliness.score)}`}>
                {data.bikeFriendliness.score}
              </div>
            </div>
            <div className={`text-xs font-medium ${getScoreColor(data.bikeFriendliness.score)} px-2 py-1 rounded`}>
              {data.bikeFriendliness.label}
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    data.bikeFriendliness.score >= 70 ? 'bg-green-500' :
                    data.bikeFriendliness.score >= 50 ? 'bg-blue-500' :
                    data.bikeFriendliness.score >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.bikeFriendliness.score}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Commute Times */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Estimated Commute Time
            </h4>
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-lg">
              to UB {data.campuses.closest} Campus
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs text-gray-600">Walk</span>
              </div>
              <div className="font-bold text-gray-900">{Math.round(data.commuteTimes.walk)} min</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs text-gray-600">Bike</span>
              </div>
              <div className="font-bold text-gray-900">{Math.round(data.commuteTimes.bike)} min</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs text-gray-600">Drive</span>
              </div>
              <div className="font-bold text-gray-900">{Math.round(data.commuteTimes.drive)} min</div>
            </div>
            <div className="bg-white rounded-lg p-2 border border-gray-200">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs text-gray-600">Transit</span>
              </div>
              <div className="font-bold text-gray-900">{Math.round(data.commuteTimes.transit)} min</div>
            </div>
          </div>
        </div>

        {/* Transit Routes */}
        {data.transitRoutes.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-3 border border-orange-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Available Transit Routes
              </h4>
              <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-lg">
                to UB Campuses
              </span>
            </div>
            <div className="space-y-2">
              {data.transitRoutes.map((route, idx) => (
                <div key={idx} className="bg-white rounded-lg p-2 border border-orange-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900 text-xs">{route.name}</span>
                    <span className="text-xs text-gray-500">{route.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-600">{route.distance} mi to stop</span>
                    <span className="text-gray-600">{route.frequency}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-1 rounded">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Destination: UB {route.toCampus} Campus</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.transitRoutes.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
            <p className="text-xs text-gray-500">No transit routes found nearby</p>
          </div>
        )}
      </div>
    </div>
  );
}

