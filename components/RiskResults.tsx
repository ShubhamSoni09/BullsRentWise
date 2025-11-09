'use client';

import { useState, useEffect, useRef } from 'react';
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

const CommuteAnalysis = dynamic(() => import('@/components/CommuteAnalysis'), {
  ssr: false,
});

const NearbyAmenities = dynamic(() => import('@/components/NearbyAmenities'), {
  ssr: false,
});

const PropertyPhotos = dynamic(() => import('@/components/PropertyPhotos'), {
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

function buildAudioSummary(data: RiskResultsProps['data']): string {
  const { address, riskScore, complaints, weather, crime } = data;

  const riskLevel = riskScore < 30 ? 'low risk' : riskScore < 60 ? 'moderate risk' : 'higher risk';
  const complaintCount = complaints.length;
  const topComplaint = complaints[0]?.type || complaints[0]?.description;
  const weatherWarnings: string[] = [];
  if (weather?.avgHumidity > 80) weatherWarnings.push('very humid conditions');
  else if (weather?.avgHumidity > 70) weatherWarnings.push('elevated humidity');
  if (weather?.totalPrecip > 1) weatherWarnings.push('recent heavy precipitation');
  else if (weather?.totalPrecip > 0.5) weatherWarnings.push('notable precipitation');

  const crimeStats = crime?.stats;
  const totalCrimes = crimeStats?.total ?? 0;
  const violent = crimeStats?.violent ?? 0;
  const property = crimeStats?.property ?? 0;

  const lines: string[] = [];
  lines.push(`Here is your BullsRentWise briefing for ${address}.`);
  lines.push(`Overall risk score is ${riskScore} out of one hundred, indicating ${riskLevel}.`);

  if (complaintCount > 0) {
    const mention = topComplaint ? `The most recent complaint mentions ${topComplaint}.` : '';
    lines.push(`We found ${complaintCount} recent city service complaints within eight hundred meters. ${mention}`.trim());
  } else {
    lines.push('No recent 3-1-1 complaints were found near this address.');
  }

  if (totalCrimes > 0) {
    const crimeHighlights: string[] = [];
    if (violent > 0) crimeHighlights.push(`${violent} violent incidents`);
    if (property > 0) crimeHighlights.push(`${property} property crimes`);
    const crimeSummary = crimeHighlights.length ? crimeHighlights.join(' and ') : `${totalCrimes} incidents overall`;
    lines.push(`Police data shows ${crimeSummary} in the last ninety days.`);
  } else {
    lines.push('No major crime incidents were detected in the recent dataset.');
  }

  if (weatherWarnings.length) {
    lines.push(`Watch out for ${weatherWarnings.join(' and ')} which can increase mold or leak risks.`);
  }

  lines.push('That is your thirty second rental safety check from BullsRentWise.');

  return lines.join(' ');
}

export default function RiskResults({ data, onSave }: RiskResultsProps) {
  const { address, lat, lng, complaints, weather, crime, riskScore } = data;
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pest-mold' | 'location' | 'photos' | 'ai' | 'budget'>('overview');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pestMoldData, setPestMoldData] = useState<any>(null);
  const [loadingPestMold, setLoadingPestMold] = useState(false);

  useEffect(() => {
    // Check if address is already saved
    const saved = localStorage.getItem('savedAddresses');
    if (saved) {
      const savedAddresses = JSON.parse(saved);
      setIsSaved(savedAddresses.some((addr: any) => addr.address === address));
    }
  }, [address]);

  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    element.addEventListener('ended', handleEnded);
    element.addEventListener('pause', handlePause);
    element.addEventListener('play', handlePlay);

    return () => {
      element.removeEventListener('ended', handleEnded);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('play', handlePlay);
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        toast.error('Unable to play audio.');
        setIsPlaying(false);
      });
    }
  }, [audioUrl]);

  useEffect(() => {
    // Fetch pest/mold data when tab is active
    if (activeTab === 'pest-mold' && !pestMoldData && !loadingPestMold) {
      setLoadingPestMold(true);
      fetch('/api/pest-mold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, radius: 400 }),
      })
        .then(res => res.json())
        .then(data => {
          setPestMoldData(data);
          setLoadingPestMold(false);
        })
        .catch(err => {
          console.error('Error fetching pest/mold data:', err);
          setPestMoldData({ mold: [], cockroach: [], rodent: [], pest: [], stats: { total: 0, mold: 0, cockroach: 0, rodent: 0, pest: 0 } });
          setLoadingPestMold(false);
        });
    }
  }, [activeTab, lat, lng, pestMoldData, loadingPestMold]);

  const handlePlayAudioSummary = async () => {
    if (audioLoading) return;

    if (audioUrl && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(() => {
          toast.error('Unable to play audio.');
        });
      } else {
        audioRef.current.pause();
      }
      return;
    }

    setAudioLoading(true);
    try {
      const summaryText = buildAudioSummary(data);
      const response = await fetch('/api/ai/audio-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: summaryText }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate audio summary.' }));
        throw new Error(error.error || 'Failed to generate audio summary.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error: any) {
      console.error('Audio summary error:', error);
      toast.error(error.message || 'Could not generate audio summary.');
    } finally {
      setAudioLoading(false);
    }
  };

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
        <div className="flex flex-col items-end gap-2">
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
          <button
            onClick={handlePlayAudioSummary}
            disabled={audioLoading}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 ${
              audioLoading
                ? 'bg-gray-200 text-gray-500 cursor-wait'
                : isPlaying
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600'
            }`}
            title="Listen to a 30-second risk summary"
          >
            {audioLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Preparing…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V5l12 7-12 7z" />
                </svg>
                {isPlaying ? 'Pause Audio' : audioUrl ? 'Replay Summary' : 'Play Summary'}
              </>
            )}
          </button>
          <audio ref={audioRef} src={audioUrl ?? undefined} preload="auto" className="hidden" />
        </div>
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
            onClick={() => setActiveTab('pest-mold')}
            className={`px-3 py-3 text-sm font-semibold border-b-3 transition-all duration-200 rounded-t-lg ${
              activeTab === 'pest-mold'
                ? 'border-orange-600 text-orange-600 bg-orange-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-1 whitespace-nowrap">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Molds/Pests
            </span>
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`px-5 py-3 text-sm font-semibold border-b-3 transition-all duration-200 rounded-t-lg ${
              activeTab === 'location'
                ? 'border-cyan-600 text-cyan-600 bg-cyan-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location
            </span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`px-5 py-3 text-sm font-semibold border-b-3 transition-all duration-200 rounded-t-lg ${
              activeTab === 'photos'
                ? 'border-pink-600 text-pink-600 bg-pink-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Photos
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-3 text-sm font-semibold border-b-3 transition-all duration-200 rounded-t-lg ${
              activeTab === 'ai'
                ? 'border-purple-600 text-purple-600 bg-purple-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center gap-1 whitespace-nowrap">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v2a2 2 0 01-2-2v-.469c0-.621-.251-1.217-.688-1.653l-.548-.547z" />
              </svg>
              AI Analysis
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {activeTab === 'pest-mold' && (
          <div className="space-y-4">
            {loadingPestMold ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
              </div>
            ) : pestMoldData ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Mold Card */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-red-500 rounded-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Mold</h3>
                    </div>
                    <div className="text-2xl font-bold text-red-600">{pestMoldData.stats?.mold || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">complaints</div>
                  </div>

                  {/* Cockroach Card */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-amber-500 rounded-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Cockroach</h3>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{pestMoldData.stats?.cockroach || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">complaints</div>
                  </div>

                  {/* Rodent Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-gray-500 rounded-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Rodent</h3>
                    </div>
                    <div className="text-2xl font-bold text-gray-600">{pestMoldData.stats?.rodent || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">complaints</div>
                  </div>

                  {/* Other Pest Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-purple-500 rounded-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Other Pests</h3>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{pestMoldData.stats?.pest || 0}</div>
                    <div className="text-xs text-gray-600 mt-1">complaints</div>
                  </div>
                </div>

                {/* Detailed Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mold Complaints */}
                  {pestMoldData.mold && pestMoldData.mold.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-red-600">Mold Complaints</span>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">{pestMoldData.mold.length}</span>
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pestMoldData.mold.slice(0, 10).map((item: any, idx: number) => (
                          <div key={idx} className="border-l-3 border-red-500 pl-3 py-2 bg-red-50/50 rounded text-xs">
                            <div className="font-semibold text-gray-900">{item.type || 'Mold Issue'}</div>
                            <div className="text-gray-600 mt-1">{item.description || 'No description'}</div>
                            {item.address && <div className="text-gray-500 mt-1 text-xs">{item.address}</div>}
                            {item.date && <div className="text-gray-400 mt-1 text-xs">{new Date(item.date).toLocaleDateString()}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cockroach Complaints */}
                  {pestMoldData.cockroach && pestMoldData.cockroach.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-amber-600">Cockroach Complaints</span>
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-full">{pestMoldData.cockroach.length}</span>
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pestMoldData.cockroach.slice(0, 10).map((item: any, idx: number) => (
                          <div key={idx} className="border-l-3 border-amber-500 pl-3 py-2 bg-amber-50/50 rounded text-xs">
                            <div className="font-semibold text-gray-900">{item.type || 'Cockroach Issue'}</div>
                            <div className="text-gray-600 mt-1">{item.description || 'No description'}</div>
                            {item.address && <div className="text-gray-500 mt-1 text-xs">{item.address}</div>}
                            {item.date && <div className="text-gray-400 mt-1 text-xs">{new Date(item.date).toLocaleDateString()}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rodent Complaints */}
                  {pestMoldData.rodent && pestMoldData.rodent.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-gray-600">Rodent Complaints</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{pestMoldData.rodent.length}</span>
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pestMoldData.rodent.slice(0, 10).map((item: any, idx: number) => (
                          <div key={idx} className="border-l-3 border-gray-500 pl-3 py-2 bg-gray-50/50 rounded text-xs">
                            <div className="font-semibold text-gray-900">{item.type || 'Rodent Issue'}</div>
                            <div className="text-gray-600 mt-1">{item.description || 'No description'}</div>
                            {item.address && <div className="text-gray-500 mt-1 text-xs">{item.address}</div>}
                            {item.date && <div className="text-gray-400 mt-1 text-xs">{new Date(item.date).toLocaleDateString()}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Pest Complaints */}
                  {pestMoldData.pest && pestMoldData.pest.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-purple-600">Other Pest Complaints</span>
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">{pestMoldData.pest.length}</span>
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pestMoldData.pest.slice(0, 10).map((item: any, idx: number) => (
                          <div key={idx} className="border-l-3 border-purple-500 pl-3 py-2 bg-purple-50/50 rounded text-xs">
                            <div className="font-semibold text-gray-900">{item.type || 'Pest Issue'}</div>
                            <div className="text-gray-600 mt-1">{item.description || 'No description'}</div>
                            {item.address && <div className="text-gray-500 mt-1 text-xs">{item.address}</div>}
                            {item.date && <div className="text-gray-400 mt-1 text-xs">{new Date(item.date).toLocaleDateString()}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {(!pestMoldData.stats || pestMoldData.stats.total === 0) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <div className="text-green-600 text-4xl mb-2">✓</div>
                    <div className="text-green-800 font-semibold">No mold or pest complaints found</div>
                    <div className="text-green-600 text-sm mt-1">This area appears to be free of mold and pest issues</div>
                  </div>
                )}
              </>
            ) : null}
          </div>
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

        {activeTab === 'location' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LazyLoad fallback={<div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}>
              <CommuteAnalysis lat={lat} lng={lng} address={address} />
            </LazyLoad>
            <LazyLoad fallback={<div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}>
              <NearbyAmenities lat={lat} lng={lng} address={address} />
            </LazyLoad>
          </div>
        )}

        {activeTab === 'photos' && (
          <LazyLoad fallback={<div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}>
            <PropertyPhotos address={address} lat={lat} lng={lng} />
          </LazyLoad>
        )}
      </div>
    </div>
  );
}

