'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import RiskBreakdown from '@/components/RiskBreakdown';
import CollapsibleSection from '@/components/CollapsibleSection';
import LazyLoad from '@/components/LazyLoad';

// Lazy load heavy components
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-gray-400">Loading map...</div>
    </div>
  ),
});

const AIRiskPrediction = dynamic(() => import('@/components/AIRiskPrediction'), {
  ssr: false,
});

const AIComplaintAnalysis = dynamic(() => import('@/components/AIComplaintAnalysis'), {
  ssr: false,
});

const AIChatbot = dynamic(() => import('@/components/AIChatbot'), {
  ssr: false,
});

const BudgetTracker = dynamic(() => import('@/components/BudgetTracker'), {
  ssr: false,
});

const RoommateConnector = dynamic(() => import('@/components/RoommateConnector'), {
  ssr: false,
});

interface RiskResultsProps {
  data: {
    address: string;
    lat: number;
    lng: number;
    complaints: any[];
    weather: any;
    crime?: {
      crimes: any[];
      stats: {
        total: number;
        violent: number;
        property: number;
        drug: number;
        vandalism: number;
        other: number;
        avgSeverity: number;
      };
    };
    riskScore: number;
  };
  onSave?: () => void;
}

export default function RiskResults({ data, onSave }: RiskResultsProps) {
  const { address, lat, lng, complaints, weather, crime, riskScore } = data;
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'budget'>('overview');

  useEffect(() => {
    // Check if address is already saved
    const saved = localStorage.getItem('savedAddresses');
    if (saved) {
      const savedAddresses = JSON.parse(saved);
      setIsSaved(savedAddresses.some((addr: any) => addr.address === address));
    }
  }, [address]);

  const handleSave = () => {
    const saved = localStorage.getItem('savedAddresses');
    const savedAddresses = saved ? JSON.parse(saved) : [];
    
    if (isSaved) {
      toast.error('Address already saved');
      return;
    }

    const newAddress = {
      id: Date.now().toString(),
      address,
      riskScore,
      lat,
      lng,
      date: new Date().toISOString(),
    };

    const updated = [...savedAddresses, newAddress];
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
    setIsSaved(true);
    toast.success('Address saved!');
    // Dispatch event to notify SavedAddresses component
    window.dispatchEvent(new Event('addressSaved'));
    if (onSave) onSave();
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'bg-green-500';
    if (score < 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 lg:p-8 space-y-6 hover-lift animate-scaleIn">
      {/* Header - Enhanced */}
      <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 truncate">{address}</h2>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className={`px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg ${getRiskColor(riskScore)}`}>
              {riskScore}/100 - {getRiskLabel(riskScore)}
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaved}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0 shadow-lg ${
            isSaved
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:scale-105'
          }`}
        >
          {isSaved ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>⭐</span>
              Save
            </span>
          )}
        </button>
      </div>

      {/* Enhanced Tabs */}
      <div className="border-b-2 border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-sm font-semibold border-b-3 transition-all duration-200 rounded-t-lg ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Overview
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-5 py-3 text-sm font-semibold border-b-3 transition-all duration-200 rounded-t-lg ${
              activeTab === 'ai'
                ? 'border-purple-600 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v2a2 2 0 01-2-2v-.469c0-.621-.251-1.217-.688-1.653l-.548-.547z" />
              </svg>
              AI Analysis
            </span>
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-5 py-3 text-sm font-semibold border-b-3 transition-all duration-200 rounded-t-lg ${
              activeTab === 'budget'
                ? 'border-green-600 text-green-600 bg-green-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Budget & Roommates
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <>
            <RiskBreakdown complaints={complaints} weather={weather} crime={crime} riskScore={riskScore} />
            
            <div className="h-64 lg:h-80 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Map lat={lat} lng={lng} address={address} complaints={complaints} crimes={crime?.crimes || []} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100 shadow-sm hover:shadow-lg hover-lift transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-red-500 rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">311 Complaints ({complaints.length})</h3>
                </div>
                <ul className="space-y-2 text-xs">
                  {complaints.length === 0 ? (
                    <li className="text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      None found
                    </li>
                  ) : (
                    complaints.slice(0, 3).map((complaint, idx) => (
                      <li key={idx} className="border-l-3 border-red-500 pl-3 py-1 bg-white/50 rounded">
                        <strong className="text-gray-900">{complaint.type || 'Unknown'}</strong>
                        <div className="text-gray-600 truncate mt-0.5">{complaint.description || 'No description'}</div>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-lg hover-lift transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-500 rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Weather</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-white/50 rounded p-2">
                    <span className="text-gray-700"><strong>Humidity:</strong></span>
                    <span className={`font-semibold ${weather.avgHumidity > 70 ? 'text-red-600' : 'text-gray-900'}`}>
                      {weather.avgHumidity?.toFixed(1)}%
                      {weather.avgHumidity > 70 && <span className="ml-1">⚠️</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/50 rounded p-2">
                    <span className="text-gray-700"><strong>Precip:</strong></span>
                    <span className={`font-semibold ${weather.totalPrecip > 0.5 ? 'text-red-600' : 'text-gray-900'}`}>
                      {weather.totalPrecip?.toFixed(2)}"
                      {weather.totalPrecip > 0.5 && <span className="ml-1">⚠️</span>}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-lg hover-lift transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-purple-500 rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">Crime ({crime?.stats.total || 0})</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-white/50 rounded p-2">
                    <span className="text-gray-700"><strong className="text-red-600">Violent:</strong></span>
                    <span className="font-semibold text-gray-900">{crime?.stats.violent || 0}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/50 rounded p-2">
                    <span className="text-gray-700"><strong className="text-orange-600">Property:</strong></span>
                    <span className="font-semibold text-gray-900">{crime?.stats.property || 0}</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/50 rounded p-2">
                    <span className="text-gray-700"><strong className="text-yellow-600">Drug:</strong></span>
                    <span className="font-semibold text-gray-900">{crime?.stats.drug || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <LazyLoad fallback={<div className="h-32 bg-gray-100 rounded-xl animate-pulse" />}>
              <AIRiskPrediction
                currentRiskScore={riskScore}
                complaints={complaints}
                crimeStats={crime?.stats}
                weather={weather}
              />
            </LazyLoad>
            
            {complaints.length > 0 && (
              <CollapsibleSection title="AI Complaint Analysis" icon="🤖" defaultOpen={false}>
                <LazyLoad fallback={<div className="h-24 bg-gray-100 rounded-lg animate-pulse" />}>
                  <AIComplaintAnalysis complaints={complaints} />
                </LazyLoad>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="AI Chatbot Assistant" icon="💬" defaultOpen={false}>
              <LazyLoad fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse" />}>
                <AIChatbot
                  context={{
                    address,
                    riskScore,
                    complaints,
                    crime,
                    weather,
                  }}
                />
              </LazyLoad>
            </CollapsibleSection>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LazyLoad fallback={<div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}>
              <BudgetTracker
                address={address}
                riskScore={riskScore}
              />
            </LazyLoad>
            <LazyLoad fallback={<div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}>
              <RoommateConnector
                address={address}
                riskScore={riskScore}
              />
            </LazyLoad>
          </div>
        )}
      </div>
    </div>
  );
}

