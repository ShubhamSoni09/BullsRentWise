'use client';

import { useState, useEffect } from 'react';

interface UserPreferences {
  // Budget
  maxMonthlyBudget: number;
  preferredRentRange: { min: number; max: number };
  
  // Risk Tolerance
  riskTolerance: 'low' | 'medium' | 'high'; // low = only low risk, high = can accept higher risk
  
  // Location
  preferredNeighborhoods: string[];
  maxDistanceToUB: number; // legacy key: max distance to work, school, or transit in miles
  publicTransportRequired: boolean;
  
  // Features
  mustHaveFeatures: string[]; // parking, laundry, pet-friendly, etc.
  niceToHaveFeatures: string[];
  
  // Living Situation
  preferredRoommateCount: number;
  petFriendly: boolean;
  
  // Lease
  preferredLeaseLength: number; // months
  
  // Priorities (weighted)
  priorities: {
    budget: number; // 1-5
    safety: number; // 1-5
    location: number; // 1-5
    features: number; // 1-5
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  maxMonthlyBudget: 800,
  preferredRentRange: { min: 500, max: 1200 },
  riskTolerance: 'medium',
  preferredNeighborhoods: [],
  maxDistanceToUB: 5,
  publicTransportRequired: true,
  mustHaveFeatures: [],
  niceToHaveFeatures: [],
  preferredRoommateCount: 1,
  petFriendly: false,
  preferredLeaseLength: 12,
  priorities: {
    budget: 5,
    safety: 4,
    location: 4,
    features: 3,
  },
};

interface UserPreferencesProps {
  onPreferencesChange?: (preferences: UserPreferences) => void;
}

export default function UserPreferences({ onPreferencesChange }: UserPreferencesProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isOpen, setIsOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        setSaved(true);
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    setSaved(true);
    if (onPreferencesChange) {
      onPreferencesChange(preferences);
    }
    setIsOpen(false);
  };

  const featureOptions = [
    'Parking',
    'Laundry',
    'Pet Friendly',
    'Furnished',
    'Dishwasher',
    'AC/Heating',
    'Gym Access',
    'Near Grocery',
  ];

  const neighborhoodOptions = [
    'Downtown',
    'Midtown',
    'Uptown',
    'West Side',
    'East Side',
    'Waterfront',
    'Near Transit',
  ];

  return (
    <div className="app-card max-w-full overflow-hidden p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="icon-tile h-10 w-10 bg-slate-950">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="section-label">Personalize</p>
              <h2 className="text-base font-black text-slate-950">My Preferences</h2>
            </div>
            {saved && (
              <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mb-4 flex justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-11 w-full max-w-[13rem] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-slate-950"
        >
          {isOpen ? 'Close Preferences' : 'Edit Preferences'}
        </button>
      </div>

      {!isOpen && saved && (
        <div className="space-y-2 text-xs">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex w-full items-center justify-between rounded-xl p-2 text-left text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            <span className="font-medium">View Preferences</span>
            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {!isCollapsed && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Budget:</span>
            </div>
            <span className="font-bold text-slate-950">${preferences.maxMonthlyBudget}/mo</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-gray-700">Risk Tolerance:</span>
            </div>
            <span className={`font-bold capitalize px-2 py-1 rounded-lg ${
              preferences.riskTolerance === 'low' ? 'bg-green-100 text-green-700' :
              preferences.riskTolerance === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {preferences.riskTolerance}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-700">Max Distance:</span>
            </div>
            <span className="font-bold text-blue-700">{preferences.maxDistanceToUB} miles</span>
          </div>
          {preferences.mustHaveFeatures.length > 0 && (
            <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 font-medium">Must Have:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {preferences.mustHaveFeatures.map((feature, idx) => (
                  <span key={idx} className="px-2 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div className="space-y-4 animate-fadeIn">
          {/* Budget Section */}
          <div className="app-card-soft overflow-hidden p-3">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Budget
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Monthly Budget</label>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    value={preferences.maxMonthlyBudget || ''}
                    onChange={(e) => setPreferences({ ...preferences, maxMonthlyBudget: parseFloat(e.target.value) || 0 })}
                    className="flex-1 min-w-0 rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-teal-500"
                    style={{ 
                      WebkitTextFillColor: '#111827',
                      color: '#111827',
                      opacity: 1
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Rent Range</label>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={preferences.preferredRentRange.min || ''}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      preferredRentRange: { ...preferences.preferredRentRange, min: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="Min"
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                    style={{ 
                      WebkitTextFillColor: '#111827',
                      color: '#111827',
                      opacity: 1,
                      width: '65px', 
                      minWidth: '65px', 
                      maxWidth: '65px' 
                    }}
                  />
                  <span className="text-gray-500 text-xs whitespace-nowrap px-0.5">to</span>
                  <span className="text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={preferences.preferredRentRange.max || ''}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      preferredRentRange: { ...preferences.preferredRentRange, max: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="Max"
                    className="rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
                    style={{ 
                      WebkitTextFillColor: '#111827',
                      color: '#111827',
                      opacity: 1,
                      width: '65px', 
                      minWidth: '65px', 
                      maxWidth: '65px' 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Risk Tolerance */}
          <div className="app-card-soft p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Risk Tolerance
            </h3>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setPreferences({ ...preferences, riskTolerance: level })}
                  className={`flex-1 rounded-2xl px-3 py-2 text-sm font-medium transition-all ${
                    preferences.riskTolerance === level
                      ? level === 'low' ? 'bg-green-500 text-white' :
                        level === 'medium' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {preferences.riskTolerance === 'low' && 'Only consider properties with low risk scores (<30)'}
              {preferences.riskTolerance === 'medium' && 'Accept properties with medium risk scores (<60)'}
              {preferences.riskTolerance === 'high' && 'Consider all properties, prioritize other factors'}
            </p>
          </div>

          {/* Location */}
          <div className="app-card-soft p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max distance to work, school, or transit (miles)</label>
                <input
                  type="number"
                  value={preferences.maxDistanceToUB || ''}
                  onChange={(e) => setPreferences({ ...preferences, maxDistanceToUB: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500"
                  style={{ WebkitTextFillColor: '#111827' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Preferred Neighborhoods</label>
                <div className="flex flex-wrap gap-2 overflow-x-hidden">
                  {neighborhoodOptions.map((neighborhood) => (
                    <button
                      key={neighborhood}
                      onClick={() => {
                        const isSelected = preferences.preferredNeighborhoods.includes(neighborhood);
                        setPreferences({
                          ...preferences,
                          preferredNeighborhoods: isSelected
                            ? preferences.preferredNeighborhoods.filter(n => n !== neighborhood)
                            : [...preferences.preferredNeighborhoods, neighborhood]
                        });
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        preferences.preferredNeighborhoods.includes(neighborhood)
                          ? 'bg-slate-950 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {neighborhood}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preferences.publicTransportRequired}
                  onChange={(e) => setPreferences({ ...preferences, publicTransportRequired: e.target.checked })}
                  className="rounded-lg border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">Public transport required</span>
              </label>
            </div>
          </div>

          {/* Features */}
          <div className="app-card-soft p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Features
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Must Have</label>
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => {
                        const isSelected = preferences.mustHaveFeatures.includes(feature);
                        setPreferences({
                          ...preferences,
                          mustHaveFeatures: isSelected
                            ? preferences.mustHaveFeatures.filter(f => f !== feature)
                            : [...preferences.mustHaveFeatures, feature]
                        });
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        preferences.mustHaveFeatures.includes(feature)
                          ? 'bg-red-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Nice to Have</label>
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map((feature) => (
                    <button
                      key={feature}
                      onClick={() => {
                        const isSelected = preferences.niceToHaveFeatures.includes(feature);
                        setPreferences({
                          ...preferences,
                          niceToHaveFeatures: isSelected
                            ? preferences.niceToHaveFeatures.filter(f => f !== feature)
                            : [...preferences.niceToHaveFeatures, feature]
                        });
                      }}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        preferences.niceToHaveFeatures.includes(feature)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Priorities */}
          <div className="app-card-soft p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Priorities (1-5, where 5 is most important)</h3>
            <div className="space-y-2">
              {(['budget', 'safety', 'location', 'features'] as const).map((priority) => (
                <div key={priority} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">{priority}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => setPreferences({
                          ...preferences,
                          priorities: { ...preferences.priorities, [priority]: value }
                        })}
                        className={`h-8 w-8 rounded-full text-xs font-semibold transition-all ${
                          preferences.priorities[priority] === value
                            ? 'bg-slate-950 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="btn-primary w-full"
          >
            Save Preferences
          </button>
        </div>
      )}
    </div>
  );
}

