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
  const [activeTab, setActiveTab] = useState<'overview' | 'pest-mold' | 'location' | 'photos' | 'ai'>('overview');
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

  const getRiskSummary = (score: number) => {
    if (score < 30) return 'This address looks comparatively safer based on the current signals.';
    if (score < 60) return 'This address has a few items worth checking before you tour or sign.';
    return 'This address has multiple red flags and deserves a careful walkthrough.';
  };

  const getRiskTextColor = (score: number) => {
    if (score < 30) return 'text-emerald-600';
    if (score < 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const renderRiskIcon = (score: number) => {
    if (score < 30) {
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M9 12.75 11.25 15 15.75 9M12 3.75 5.25 6.75v5.25c0 4.06 2.74 7.85 6.75 8.94 4.01-1.09 6.75-4.88 6.75-8.94V6.75L12 3.75Z" />
        </svg>
      );
    }

    if (score < 60) {
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 8v5m0 3.5h.01M4.5 19.5h15L12 4.5l-7.5 15Z" />
        </svg>
      );
    }

    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    );
  };

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'pest-mold', label: 'Mold & Pests' },
    { id: 'location', label: 'Location' },
    { id: 'photos', label: 'Photos' },
    { id: 'ai', label: 'AI Analysis' },
  ];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/10 animate-scaleIn">
      <div className="grid gap-4 border-b border-slate-100 p-3 sm:p-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:p-7">
        <div className="min-w-0">
          <div className="mb-3 flex items-start gap-3">
            <div className="icon-tile h-9 w-9 bg-gradient-to-br from-slate-950 via-blue-950 to-teal-800 sm:h-10 sm:w-10">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="section-label">Rental report</p>
              <h2 className="mt-1 break-words text-lg font-black tracking-tight text-slate-950 sm:text-2xl lg:text-3xl">{address}</h2>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">{getRiskSummary(riskScore)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="stat-pill">{complaints.length} complaints</span>
            <span className="stat-pill">{crime?.stats.total || 0} crime reports</span>
            <span className="stat-pill">{weather?.avgHumidity?.toFixed?.(0) || 0}% humidity</span>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Risk score</p>
              <div className="mt-1.5 flex items-end gap-2">
                <span className={`text-4xl font-black leading-none tracking-tight sm:text-5xl ${getRiskTextColor(riskScore)}`}>{riskScore}</span>
                <span className="pb-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">/100</span>
              </div>
            </div>
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm sm:h-14 sm:w-14 ${getRiskColor(riskScore)}`}>
              {renderRiskIcon(riskScore)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-black text-slate-950">{getRiskLabel(riskScore)}</span>
              <span className="text-xs font-semibold text-slate-500">{riskScore < 30 ? 'Low concern' : riskScore < 60 ? 'Review before touring' : 'Inspect carefully'}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${getRiskColor(riskScore)}`} style={{ width: `${riskScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 lg:px-7">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`btn-secondary w-full sm:w-auto ${
              isSaved
                ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                : ''
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
                Save
              </span>
            )}
          </button>
          <button
            onClick={handlePlayAudioSummary}
            disabled={audioLoading}
            className={`btn-secondary w-full sm:w-auto ${
              audioLoading
                ? 'cursor-wait bg-slate-100 text-slate-400'
                : isPlaying
                  ? 'border-teal-200 bg-teal-50 text-teal-700'
                  : ''
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
        <p className="text-xs font-medium text-slate-500">Explore the report below.</p>
      </div>

      <div className="border-b border-slate-100 px-2 py-3 sm:px-5 lg:px-6">
        <div className="flex justify-start gap-2 overflow-x-auto rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50 to-teal-50 p-1 sm:justify-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all sm:px-4 sm:py-2.5 sm:text-sm ${
                activeTab === tab.id
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:bg-white/70 hover:text-slate-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4 p-3 sm:space-y-5 sm:p-6 lg:p-7">
        {activeTab === 'overview' && (
          <>
            <RiskBreakdown complaints={complaints} weather={weather} crime={crime} riskScore={riskScore} />
            
            <div className="h-56 overflow-hidden rounded-3xl border border-slate-200 shadow-sm sm:h-64 lg:h-80">
              <Map lat={lat} lng={lng} address={address} complaints={complaints} crimes={crime?.crimes || []} />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      complaints.length === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {complaints.length === 0 ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="section-label">City signals</p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">311 Complaints</h3>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${
                    complaints.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {complaints.length}
                  </span>
                </div>
                <ul className="space-y-2 text-xs">
                  {complaints.length === 0 ? (
                    <li className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-950">No recent complaints found</div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">No matching 311 complaints were detected near this address in the current dataset.</p>
                        </div>
                      </div>
                    </li>
                  ) : (
                    complaints.slice(0, 3).map((complaint, idx) => (
                      <li key={idx} className="rounded-2xl border border-red-100 bg-red-50/40 p-3">
                        <strong className="text-slate-950">{complaint.type || 'Unknown complaint'}</strong>
                        <div className="mt-1 truncate text-slate-500">{complaint.description || 'No description'}</div>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="app-card-soft p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-xl bg-slate-700 p-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-black text-slate-950">Crime ({crime?.stats.total || 0})</h3>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3">
                    <span className="text-gray-700"><strong className="text-red-600">Violent:</strong></span>
                    <span className="font-semibold text-gray-900">{crime?.stats.violent || 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3">
                    <span className="text-gray-700"><strong className="text-orange-600">Property:</strong></span>
                    <span className="font-semibold text-gray-900">{crime?.stats.property || 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3">
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
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-teal-600 rounded-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm">Other Pests</h3>
                    </div>
                    <div className="text-2xl font-bold text-teal-700">{pestMoldData.stats?.pest || 0}</div>
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
                          <div key={idx} className="border-l-4 border-red-500 pl-3 py-2 bg-red-50/50 rounded text-xs">
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
                          <div key={idx} className="border-l-4 border-amber-500 pl-3 py-2 bg-amber-50/50 rounded text-xs">
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
                          <div key={idx} className="border-l-4 border-gray-500 pl-3 py-2 bg-gray-50/50 rounded text-xs">
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
                    <div className="bg-white rounded-xl p-4 border border-teal-100 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="text-teal-700">Other Pest Complaints</span>
                        <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">{pestMoldData.pest.length}</span>
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {pestMoldData.pest.slice(0, 10).map((item: any, idx: number) => (
                          <div key={idx} className="border-l-4 border-teal-600 pl-3 py-2 bg-teal-50/50 rounded text-xs">
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

