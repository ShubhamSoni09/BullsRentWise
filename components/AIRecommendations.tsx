'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import LazyList from '@/components/LazyList';

interface Recommendation {
  address: string;
  matchScore: number;
  reasons: string[];
  strengths: string[];
  concerns: string[];
  suitability: 'excellent' | 'good' | 'fair' | 'poor';
  riskScore: number;
  estimatedCost?: number;
  source?: string;
}

interface AIRecommendationsProps {
  savedAddresses: any[];
  discoveredProperties?: any[];
}

const DEFAULT_PREFERENCES = {
  maxMonthlyBudget: 1200,
  preferredRentRange: { min: 700, max: 2200 },
  riskTolerance: 'medium',
  preferredNeighborhoods: [],
  maxDistanceToUB: 5,
  publicTransportRequired: true,
  mustHaveFeatures: [],
  niceToHaveFeatures: [],
  preferredRoommateCount: 1,
  petFriendly: false,
  priorities: {
    budget: 5,
    safety: 4,
    location: 4,
    features: 3,
  },
};

export default function AIRecommendations({ savedAddresses, discoveredProperties = [] }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [savedRecommendations, setSavedRecommendations] = useState<Set<string>>(new Set());

  const fetchRecommendations = async () => {
    const preferencesData = localStorage.getItem('userPreferences');

    setLoading(true);
    try {
      const preferences = preferencesData
        ? { ...DEFAULT_PREFERENCES, ...JSON.parse(preferencesData) }
        : DEFAULT_PREFERENCES;
      
      // Search for properties online based on preferences
      toast.loading('Searching for properties online...', { id: 'searching' });
      
      const anchorAddress = savedAddresses.find((addr) => addr.lat && addr.lng)
        || discoveredProperties.find((addr) => addr.lat && addr.lng);
      const searchLocation = anchorAddress
        ? { lat: anchorAddress.lat, lng: anchorAddress.lng }
        : { lat: 39.8283, lng: -98.5795 };
      
      const searchRes = await fetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences,
          location: searchLocation,
        }),
      });

      let onlineProperties: any[] = [];
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        onlineProperties = searchData.properties || [];
        toast.success(`Found ${onlineProperties.length} properties online!`, { id: 'searching' });
      } else {
        toast.dismiss('searching');
        console.warn('Online property search failed, using saved/discovered properties only');
      }

      // Combine saved, discovered, and online properties
      const savedProps = savedAddresses.map(addr => {
        const budgetData = localStorage.getItem(`budget_${addr.address}`);
        const budget = budgetData ? JSON.parse(budgetData) : null;
        return {
          address: addr.address,
          riskScore: addr.riskScore,
          lat: addr.lat,
          lng: addr.lng,
          source: 'saved',
          estimatedRent: budget?.estimatedRent || 0,
          utilities: budget?.utilities || 0,
          roommateCount: budget?.roommateCount || 0,
        };
      });

      const discoveredProps = discoveredProperties
        .filter(p => p.status === 'analyzed')
        .map(addr => ({
          address: addr.address,
          riskScore: addr.riskScore || 0,
          lat: addr.lat,
          lng: addr.lng,
          source: 'discovered',
          estimatedRent: 0,
          utilities: 0,
          roommateCount: 0,
        }));

      // Combine all properties
      const allProperties = [...savedProps, ...discoveredProps, ...onlineProperties];

      if (allProperties.length === 0) {
        toast.error('No properties found. Try adjusting your preferences.');
        return;
      }

      // Prepare property data with all available information from ALL properties
      const properties = allProperties.map(addr => {
        const budgetData = localStorage.getItem(`budget_${addr.address}`);
        const budget = budgetData ? JSON.parse(budgetData) : null;

        return {
          address: addr.address,
          riskScore: addr.riskScore || 0,
          lat: addr.lat,
          lng: addr.lng,
          distance: addr.distance,
          budget: budget ? {
            estimatedRent: budget.estimatedRent || 0,
            utilities: budget.utilities || 0,
            roommateCount: budget.roommateCount || 0,
            monthlyBudget: budget.monthlyBudget || 0,
          } : (addr.estimatedRent ? {
            estimatedRent: addr.estimatedRent || 0,
            utilities: addr.utilities || 100,
            roommateCount: addr.roommateCount || 0,
            monthlyBudget: 0,
          } : undefined),
        };
      });

      const response = await fetch('/api/ai/recommend-housing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          properties,
          preferences,
          useAI: true, // Enable AI enhancement if API key is available
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setSummary(data.summary || null);
      toast.success(`Found ${data.recommendations?.length || 0} recommendations!`);
    } catch (error: any) {
      console.error('Recommendation error:', error);
      toast.error(error.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case 'excellent':
        return 'bg-green-500 text-white';
      case 'good':
        return 'bg-blue-500 text-white';
      case 'fair':
        return 'bg-yellow-500 text-white';
      case 'poor':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleDetails = (address: string) => {
    setShowDetails(prev => ({ ...prev, [address]: !prev[address] }));
  };

  useEffect(() => {
    // Check which recommendations are already saved
    const saved = localStorage.getItem('savedAddresses');
    if (saved) {
      const savedAddressesList = JSON.parse(saved) as any[];
      const savedSet = new Set<string>(savedAddressesList.map((addr: any) => addr.address as string));
      setSavedRecommendations(savedSet);
    }
  }, [recommendations]);

  const handleSaveRecommendation = async (rec: Recommendation) => {
    // Check if already saved
    if (savedRecommendations.has(rec.address)) {
      toast.error('Address already saved');
      return;
    }

    try {
      // Geocode address to get lat/lng
      toast.loading('Saving recommendation...', { id: 'saving' });
      const geocodeRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: rec.address }),
      });

      if (!geocodeRes.ok) {
        throw new Error('Failed to geocode address');
      }

      const { lat, lng } = await geocodeRes.json();

      // Save to localStorage
      const saved = localStorage.getItem('savedAddresses');
      const savedAddressesList = saved ? JSON.parse(saved) : [];

      const newAddress = {
        id: Date.now().toString(),
        address: rec.address,
        riskScore: rec.riskScore,
        lat,
        lng,
        date: new Date().toISOString(),
        source: 'ai_recommendation',
      };

      const updated = [...savedAddressesList, newAddress];
      localStorage.setItem('savedAddresses', JSON.stringify(updated));
      setSavedRecommendations(prev => new Set(prev).add(rec.address));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('addressSaved'));
      
      toast.success('Recommendation saved!', { id: 'saving' });
    } catch (error: any) {
      console.error('Error saving recommendation:', error);
      toast.error(error.message || 'Failed to save recommendation', { id: 'saving' });
    }
  };

  return (
    <div className="app-card overflow-hidden p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="icon-tile h-10 w-10 bg-slate-950">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v2a2 2 0 01-2-2v-.469c0-.621-.251-1.217-.688-1.653l-.548-.547z" />
            </svg>
        </div>
        <div className="min-w-0 flex-1">
            <p className="section-label">Market</p>
            <h2 className="truncate text-base font-black text-slate-950">Market Recommendations</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Compare matching rentals near your selected area.</p>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="btn-primary mt-4 h-11 w-full px-4 text-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Find Matches
              </>
            )}
          </button>
        </div>
      </div>

      {!loading && recommendations.length === 0 && !summary && (
        <div className="empty-state py-4">
          <p className="mb-1 text-sm font-bold text-slate-700">Market property search</p>
          <p className="text-xs text-slate-500">
            Click &quot;Find Matches&quot; to compare market-style rental options near your selected area.
          </p>
        </div>
      )}

        {summary && (
          <div className="mb-3 mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <h3 className="mb-2 text-xs font-black text-slate-950">Summary</h3>
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="text-gray-600">Total Properties</div>
              <div className="font-bold text-gray-900">{summary.totalProperties}</div>
              <div className="text-gray-500 text-xs mt-1">
                {summary.onlineCount > 0 && `${summary.onlineCount} online`}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Excellent Matches</div>
              <div className="font-bold text-green-600">{summary.excellentMatches}</div>
            </div>
            <div>
              <div className="text-gray-600">Good Matches</div>
              <div className="font-bold text-blue-600">{summary.goodMatches}</div>
            </div>
            <div>
              <div className="text-gray-600">Avg Match Score</div>
              <div className="font-bold text-gray-900">{summary.averageMatchScore}/100</div>
            </div>
          </div>
        </div>
      )}

        {recommendations.length > 0 && (
          <LazyList
            items={recommendations}
            renderItem={(rec, idx) => (
              <div
                key={rec.address}
                className={`mb-3 overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition hover:shadow-md animate-slideUp ${
                rec.suitability === 'excellent' ? 'border-green-300 hover:border-green-500 hover:ring-2 hover:ring-green-200' :
                rec.suitability === 'good' ? 'border-blue-300 hover:border-blue-500 hover:ring-2 hover:ring-blue-200' :
                rec.suitability === 'fair' ? 'border-yellow-300 hover:border-yellow-500 hover:ring-2 hover:ring-yellow-200' :
                'border-red-300 hover:border-red-500 hover:ring-2 hover:ring-red-200'
              }`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-start justify-between gap-2 lg:gap-4">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 lg:gap-3 mb-2 flex-wrap">
                    <span className="shrink-0 rounded-full bg-slate-950 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                      #{idx + 1}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm lg:text-base flex-1 min-w-0 truncate">{rec.address}</h3>
                    <button
                      onClick={() => handleSaveRecommendation(rec)}
                      className={`p-1.5 rounded-lg transition-all shrink-0 ${
                        savedRecommendations.has(rec.address)
                          ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                          : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                      title={savedRecommendations.has(rec.address) ? 'Saved' : 'Save to addresses'}
                    >
                      <svg className="w-5 h-5" fill={savedRecommendations.has(rec.address) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    {rec.estimatedCost && rec.estimatedCost <= 800 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold shrink-0">
                        💰 Great Value
                      </span>
                    )}
                    {rec.source === 'online' && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold shrink-0">
                        🌐 Online
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 lg:gap-3 mb-3 flex-wrap">
                    <div className={`px-3 py-1 rounded-lg font-bold text-sm ${getSuitabilityColor(rec.suitability)}`}>
                      {rec.suitability.charAt(0).toUpperCase() + rec.suitability.slice(1)} Match
                    </div>
                    <div className={`px-3 py-1 bg-gray-100 rounded-lg font-bold text-sm ${getMatchScoreColor(rec.matchScore)}`}>
                      {rec.matchScore}/100 Match Score
                    </div>
                    <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                      rec.riskScore < 30 ? 'bg-green-500 text-white' :
                      rec.riskScore < 60 ? 'bg-yellow-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                      Risk: {rec.riskScore}/100
                    </div>
                    {rec.estimatedCost && (
                      <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm">
                        ${rec.estimatedCost.toFixed(0)}/person
                      </div>
                    )}
                  </div>

                  {rec.strengths.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs font-semibold text-green-700">Strengths</span>
                      </div>
                      <ul className="text-xs text-gray-700 space-y-1 ml-5">
                        {rec.strengths.map((strength, i) => (
                          <li key={i} className="list-disc">{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.concerns.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-xs font-semibold text-yellow-700">Concerns</span>
                      </div>
                      <ul className="text-xs text-gray-700 space-y-1 ml-5">
                        {rec.concerns.map((concern, i) => (
                          <li key={i} className="list-disc">{concern}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rec.reasons.length > 0 && showDetails[rec.address] && (
                    <div className="mt-2 rounded-2xl bg-slate-50 p-3">
                      <div className="text-xs font-semibold text-slate-950 mb-1">Why This Matches:</div>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {rec.reasons.map((reason, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-teal-600 mt-0.5">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={() => toggleDetails(rec.address)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                      >
                        {showDetails[rec.address] ? 'Hide Details' : 'Show Details'}
                        <svg
                          className={`w-4 h-4 transition-transform ${showDetails[rec.address] ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(rec.address + ' for rent')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View Rental
                      </a>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <a
                        href={`https://www.zillow.com/homes/${encodeURIComponent(rec.address)}_rb/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                        Zillow
                      </a>
                      <a
                        href={`https://www.apartments.com/${encodeURIComponent(rec.address.replace(/,/g, '').replace(/\s+/g, '-').toLowerCase())}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Apartments
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Map
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          initialCount={2}
          increment={2}
          className="space-y-2"
        />
      )}

        {recommendations.length === 0 && !loading && (savedAddresses.length > 0 || discoveredProperties.length > 0) && (
          <div className="empty-state py-10 animate-fadeIn">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v2a2 2 0 01-2-2v-.469c0-.621-.251-1.217-.688-1.653l-.548-.547z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-700">Ready for AI recommendations</p>
            <p className="mt-1 text-xs text-slate-500">Click &quot;Get Recommendations&quot; to analyze all available properties</p>
          </div>
        )}
    </div>
  );
}

