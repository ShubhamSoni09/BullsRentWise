'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UserPreferences {
  // Budget
  maxMonthlyBudget: number;
  preferredRentRange: { min: number; max: number };
  
  // Risk Tolerance
  riskTolerance: 'low' | 'medium' | 'high'; // low = only low risk, high = can accept higher risk
  
  // Location
  preferredNeighborhoods: string[];
  maxDistanceToUB: number; // in miles
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
    toast.success('Preferences saved!');
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
    'North Campus Area',
    'South Campus Area',
    'Downtown',
    'Elmwood Village',
    'Allentown',
    'Hertel Avenue',
    'University Heights',
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-4 overflow-hidden hover-lift">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900">My Preferences</h2>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            {isOpen ? 'Close' : 'Edit'}
          </button>
        </div>
      </div>

      {!isOpen && saved && (
        <div className="space-y-2 text-xs">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full text-left flex items-center justify-between text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50"
          >
            <span className="font-medium">View Preferences</span>
            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {!isCollapsed && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between p-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-700">Budget:</span>
            </div>
            <span className="font-bold text-indigo-700">${preferences.maxMonthlyBudget}/mo</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
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
          <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-700">Max Distance to UB:</span>
            </div>
            <span className="font-bold text-blue-700">{preferences.maxDistanceToUB} miles</span>
          </div>
          {preferences.mustHaveFeatures.length > 0 && (
            <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700 font-medium">Must Have:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {preferences.mustHaveFeatures.map((feature, idx) => (
                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
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
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Budget
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Monthly Budget</label>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    value={preferences.maxMonthlyBudget || ''}
                    onChange={(e) => setPreferences({ ...preferences, maxMonthlyBudget: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Rent Range</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={preferences.preferredRentRange.min || ''}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      preferredRentRange: { ...preferences.preferredRentRange, min: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="Min"
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    value={preferences.preferredRentRange.max || ''}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      preferredRentRange: { ...preferences.preferredRentRange, max: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="Max"
                    className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Risk Tolerance */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Distance to UB (miles)</label>
                <input
                  type="number"
                  value={preferences.maxDistanceToUB || ''}
                  onChange={(e) => setPreferences({ ...preferences, maxDistanceToUB: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Preferred Neighborhoods</label>
                <div className="flex flex-wrap gap-2">
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
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        preferences.preferredNeighborhoods.includes(neighborhood)
                          ? 'bg-indigo-600 text-white'
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
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Public transport required</span>
              </label>
            </div>
          </div>

          {/* Features */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
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
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
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
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
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
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                          preferences.priorities[priority] === value
                            ? 'bg-indigo-600 text-white'
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
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Save Preferences
          </button>
        </div>
      )}
    </div>
  );
}

