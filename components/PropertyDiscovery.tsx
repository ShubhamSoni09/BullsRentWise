'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import LazyList from '@/components/LazyList';

interface DiscoveredProperty {
  id: string;
  address: string;
  riskScore?: number;
  lat?: number;
  lng?: number;
  date: string;
  status: 'discovered' | 'analyzed' | 'saved';
}

interface PropertyDiscoveryProps {
  onPropertyAnalyzed?: (property: DiscoveredProperty) => void;
  onPropertiesChange?: (properties: DiscoveredProperty[]) => void;
}

export default function PropertyDiscovery({ onPropertyAnalyzed, onPropertiesChange }: PropertyDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveredProperties, setDiscoveredProperties] = useState<DiscoveredProperty[]>([]);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    // Load discovered properties from localStorage
    const loadProperties = () => {
      const saved = localStorage.getItem('discoveredProperties');
      if (saved) {
        const properties = JSON.parse(saved);
        setDiscoveredProperties(properties);
        if (onPropertiesChange) {
          onPropertiesChange(properties);
        }
      }
    };
    loadProperties();
  }, [onPropertiesChange]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter an address');
      return;
    }

    // Check if already discovered
    const existing = discoveredProperties.find(p => 
      p.address.toLowerCase() === searchQuery.toLowerCase()
    );

    if (existing) {
      toast.info('Property already discovered');
      return;
    }

    // Add to discovered properties
    const newProperty: DiscoveredProperty = {
      id: Date.now().toString(),
      address: searchQuery.trim(),
      date: new Date().toISOString(),
      status: 'discovered',
    };

    const updated = [...discoveredProperties, newProperty];
    setDiscoveredProperties(updated);
    localStorage.setItem('discoveredProperties', JSON.stringify(updated));
    
    if (onPropertiesChange) {
      onPropertiesChange(updated);
    }

    toast.success('Property added! Click "Analyze" to get risk data.');
    setSearchQuery('');
  };

  const handleAnalyze = async (property: DiscoveredProperty) => {
    setAnalyzing(property.id);
    
    try {
      // Geocode address
      const geocodeRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: property.address }),
      });

      if (!geocodeRes.ok) {
        throw new Error('Failed to geocode address');
      }

      const { lat, lng } = await geocodeRes.json();

      // Fetch risk data
      const [complaintsRes, weatherRes, crimeRes] = await Promise.all([
        fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, radius: 800 }),
        }),
        fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        }),
        fetch('/api/crime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, radius: 800 }),
        }),
      ]);

      const complaints = complaintsRes.ok ? await complaintsRes.json() : [];
      const weather = await weatherRes.json();
      const crimeData = crimeRes.ok ? await crimeRes.json() : { stats: { total: 0, violent: 0, property: 0, drug: 0, vandalism: 0, other: 0, avgSeverity: 0 } };

      // Calculate risk score
      let riskScore = 0;
      const heatComplaints = complaints.filter((c: any) => 
        c.type?.toLowerCase().includes('heat') || c.description?.toLowerCase().includes('heat')
      ).length;
      const leakComplaints = complaints.filter((c: any) => 
        c.type?.toLowerCase().includes('leak') || c.description?.toLowerCase().includes('leak')
      ).length;
      const pestComplaints = complaints.filter((c: any) => 
        c.type?.toLowerCase().includes('pest') || c.description?.toLowerCase().includes('pest')
      ).length;

      riskScore += heatComplaints * 15;
      riskScore += leakComplaints * 20;
      riskScore += pestComplaints * 15;

      if (weather.avgHumidity > 70) riskScore += 10;
      if (weather.avgHumidity > 80) riskScore += 10;
      if (weather.totalPrecip > 0.5) riskScore += 15;
      if (weather.totalPrecip > 1.0) riskScore += 10;

      if (crimeData.stats) {
        riskScore += crimeData.stats.violent * 25;
        riskScore += crimeData.stats.property * 10;
        riskScore += crimeData.stats.drug * 8;
        riskScore += crimeData.stats.vandalism * 5;
        riskScore += crimeData.stats.other * 3;
        if (crimeData.stats.total > 10) riskScore += 10;
        if (crimeData.stats.total > 20) riskScore += 10;
      }

      riskScore = Math.min(100, riskScore);

      // Update property with analysis data
      const updated = discoveredProperties.map(p => 
        p.id === property.id 
          ? { ...p, riskScore, lat, lng, status: 'analyzed' as const }
          : p
      );

      setDiscoveredProperties(updated);
      localStorage.setItem('discoveredProperties', JSON.stringify(updated));

      if (onPropertiesChange) {
        onPropertiesChange(updated);
      }

      if (onPropertyAnalyzed) {
        onPropertyAnalyzed({ ...property, riskScore, lat, lng, status: 'analyzed' });
      }

      toast.success(`Analysis complete! Risk Score: ${riskScore}/100`);
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze property');
    } finally {
      setAnalyzing(null);
    }
  };

  const handleRemove = (id: string) => {
    const updated = discoveredProperties.filter(p => p.id !== id);
    setDiscoveredProperties(updated);
    localStorage.setItem('discoveredProperties', JSON.stringify(updated));
    
    if (onPropertiesChange) {
      onPropertiesChange(updated);
    }
    
    toast.success('Property removed');
  };

  const displayedProperties = showAll ? discoveredProperties : discoveredProperties.slice(0, 5);
  const hasMore = discoveredProperties.length > 5;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-xl border border-emerald-100 p-4 overflow-hidden hover-lift">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900">Discover Properties</h2>
          {discoveredProperties.length > 0 && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
              {discoveredProperties.length}
            </span>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter Buffalo address to discover..."
            className="flex-1 min-w-0 px-4 py-2.5 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-sm bg-white"
          />
          <button
            onClick={handleSearch}
            className="px-3 lg:px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Discover properties to analyze and get AI recommendations
        </p>
      </div>

      {/* Properties List */}
        {discoveredProperties.length === 0 ? (
          <div className="text-center py-6 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-2">
              <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-xs font-medium">No properties yet</p>
            <p className="text-gray-400 text-xs mt-0.5">Search to discover</p>
        </div>
      ) : (
        <LazyList
          items={displayedProperties}
          renderItem={(property) => (
            <div
              key={property.id}
              className="bg-white/90 rounded-xl p-4 border-2 border-emerald-200 hover:border-emerald-500 transition-all shadow-sm hover:shadow-lg hover-lift"
            >
              <div className="flex items-start justify-between gap-2 lg:gap-3">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-sm truncate flex-1 min-w-0">{property.address}</h3>
                    {property.status === 'analyzed' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                        Analyzed
                      </span>
                    )}
                  </div>
                  
                  {property.riskScore !== undefined && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`px-2 py-1 rounded-lg text-white text-xs font-bold ${
                        property.riskScore < 30 ? 'bg-green-500' :
                        property.riskScore < 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}>
                        Risk: {property.riskScore}/100
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Discovered {new Date(property.date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {property.status !== 'analyzed' && (
                    <button
                      onClick={() => handleAnalyze(property)}
                      disabled={analyzing === property.id}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                    >
                      {analyzing === property.id ? (
                        <>
                          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Analyze
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(property.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove property"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
          initialCount={5}
          increment={5}
          className="space-y-3"
        />
      )}
    </div>
  );
}

