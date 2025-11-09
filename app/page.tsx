'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import AddressInput from '@/components/AddressInput';
import SkeletonLoader from '@/components/SkeletonLoader';

// Lazy load heavy components
const RiskResults = dynamic(() => import('@/components/RiskResults'), {
  loading: () => <SkeletonLoader />,
  ssr: false,
});

const UserPreferences = dynamic(() => import('@/components/UserPreferences'), {
  ssr: false,
});

const WelcomeSection = dynamic(() => import('@/components/WelcomeSection'), {
  ssr: false,
});

const SavedAddresses = dynamic(() => import('@/components/SavedAddresses'), {
  ssr: false,
});

const AIRecommendations = dynamic(() => import('@/components/AIRecommendations'), {
  ssr: false,
});

const RoommatesManager = dynamic(() => import('@/components/RoommatesManager'), {
  ssr: false,
});

export default function Home() {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  const handleAddressSubmit = async (address: string) => {
    setLoading(true);
    setRiskData(null);
    
    try {
      // Geocode address
      setLoadingStep('Geocoding address...');
      const geocodeRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!geocodeRes.ok) {
        const error = await geocodeRes.json();
        throw new Error(error.error || 'Failed to geocode address');
      }

      const { lat, lng } = await geocodeRes.json();

      // Fetch 311 complaints, weather data, and crime data in parallel
      setLoadingStep('Fetching 311 complaints, weather, and crime data...');
      const [complaintsRes, weatherRes, crimeRes] = await Promise.all([
        fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, radius: 400 }),
        }),
        fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng }),
        }),
        fetch('/api/crime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, radius: 400 }),
        }),
      ]);

      if (!weatherRes.ok) {
        const error = await weatherRes.json();
        throw new Error(error.error || 'Failed to fetch weather data');
      }

      const complaints = complaintsRes.ok ? await complaintsRes.json() : [];
      const weather = await weatherRes.json();
      const crimeData = crimeRes.ok ? await crimeRes.json() : { crimes: [], stats: { total: 0, violent: 0, property: 0, drug: 0, vandalism: 0, other: 0, avgSeverity: 0 } };

      // Calculate risk score
      const riskScore = calculateRiskScore(complaints, weather, crimeData.stats);

      setRiskData({
        address,
        lat,
        lng,
        complaints,
        weather,
        crime: crimeData,
        riskScore,
      });

      // Update saved address with location if it exists
      const saved = localStorage.getItem('savedAddresses');
      if (saved) {
        const savedAddresses = JSON.parse(saved);
        const addressIndex = savedAddresses.findIndex((addr: any) => addr.address === address);
        if (addressIndex !== -1) {
          savedAddresses[addressIndex].lat = lat;
          savedAddresses[addressIndex].lng = lng;
          localStorage.setItem('savedAddresses', JSON.stringify(savedAddresses));
        }
      }

      toast.success('Risk analysis complete!');
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Error fetching data. Please try again.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const calculateRiskScore = (complaints: any[], weather: any, crimeStats: any): number => {
    let score = 0;
    
    // 311 complaints contribute to risk
    const heatComplaints = complaints.filter(c => 
      c.type?.toLowerCase().includes('heat') || 
      c.description?.toLowerCase().includes('heat')
    ).length;
    const leakComplaints = complaints.filter(c => 
      c.type?.toLowerCase().includes('leak') || 
      c.description?.toLowerCase().includes('leak')
    ).length;
    const pestComplaints = complaints.filter(c => 
      c.type?.toLowerCase().includes('pest') || 
      c.description?.toLowerCase().includes('pest')
    ).length;

    score += heatComplaints * 15;
    score += leakComplaints * 20;
    score += pestComplaints * 15;

    // Weather risk (humidity + precipitation)
    if (weather.avgHumidity > 70) score += 10;
    if (weather.avgHumidity > 80) score += 10;
    if (weather.totalPrecip > 0.5) score += 15;
    if (weather.totalPrecip > 1.0) score += 10;

    // Crime risk (weighted by severity)
    if (crimeStats) {
      // Violent crimes are highest risk
      score += crimeStats.violent * 25;
      // Property crimes
      score += crimeStats.property * 10;
      // Drug-related
      score += crimeStats.drug * 8;
      // Vandalism
      score += crimeStats.vandalism * 5;
      // Other crimes
      score += crimeStats.other * 3;
      
      // Additional penalty for high crime density
      if (crimeStats.total > 10) score += 10;
      if (crimeStats.total > 20) score += 10;
    }

    return Math.min(100, score);
  };

  return (
    <main className={`relative ${riskData ? 'min-h-screen' : 'h-screen overflow-hidden'}`}>
        {/* Gradient overlay */}
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" />
        
        {/* Decorative background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className={`relative z-10 max-w-[98%] mx-auto p-2 sm:p-3 lg:p-4 overflow-x-hidden ${riskData ? '' : 'h-full flex flex-col'}`}>
        {/* Enhanced Header */}
        <div className={`text-center ${riskData ? 'mb-4 sm:mb-6 lg:mb-8' : 'mb-3 sm:mb-4 lg:mb-6 shrink-0'} animate-fadeIn`}>
          <div className="inline-block mb-2 sm:mb-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-1 sm:mb-2">
              <span className="inline-block transform hover:scale-105 transition-transform duration-300">
                🐂
              </span>{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                BullsRentWise
              </span>
            </h1>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-700 font-medium max-w-2xl mx-auto px-2">
            UB Student Rental Assistant
          </p>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2 max-w-5xl mx-auto px-2 sm:whitespace-nowrap">
            Analyze Buffalo rentals: risk scores, commute times, nearby amenities, and AI-powered recommendations
          </p>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-0 ${riskData ? '' : 'flex-1 min-h-0 overflow-hidden'}`}>
          {/* Left Sidebar - Saved Addresses & Roommates */}
          <div className={`lg:col-span-3 border-r-0 lg:border-r border-gray-300 pr-0 lg:pr-4 xl:pr-6 ${riskData ? '' : 'flex flex-col min-h-0'}`}>
            <div className={`lg:sticky lg:top-4 space-y-2 max-h-[calc(100vh-2rem)] overflow-y-auto scroll-smooth px-2 lg:px-0`} style={{ scrollBehavior: 'smooth' }}>
              <div className="animate-slideIn" style={{ animationDelay: '0.2s' }}>
                <SavedAddresses 
                  onAddressSaved={() => {}} 
                  onAddressesChange={(addresses) => setSavedAddresses(addresses)}
                />
              </div>
              <div className="animate-slideIn" style={{ animationDelay: '0.25s' }}>
                <RoommatesManager />
              </div>
            </div>
          </div>

          {/* Main Content - Scrollable */}
          <div className={`lg:col-span-6 space-y-4 lg:space-y-6 border-x-0 lg:border-x border-gray-300 px-2 sm:px-4 lg:px-6 ${riskData ? '' : 'flex flex-col min-h-0 overflow-hidden'}`}>
            <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <AddressInput onSubmit={handleAddressSubmit} loading={loading} loadingStep={loadingStep} />
            </div>
            {!riskData && !loading && (
              <div className="animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                <WelcomeSection />
              </div>
            )}
            {loading && (
              <div className="animate-fadeIn">
                <SkeletonLoader />
              </div>
            )}
            {riskData && !loading && (
              <div className="animate-fadeIn">
                <RiskResults data={riskData} onSave={() => {}} />
              </div>
            )}
          </div>
          
          {/* Right Sidebar - Preferences & AI Recommendations */}
          <div className={`lg:col-span-3 border-l-0 lg:border-l border-gray-300 pl-0 lg:pl-4 xl:pl-6 ${riskData ? '' : 'flex flex-col min-h-0'}`}>
            <div className={`lg:sticky lg:top-4 space-y-2 max-h-[calc(100vh-2rem)] overflow-y-auto scroll-smooth px-2 lg:px-0`} style={{ scrollBehavior: 'smooth' }}>
              <div className="animate-slideIn" style={{ animationDelay: '0.3s' }}>
                <UserPreferences />
              </div>
              <div className="animate-slideIn" style={{ animationDelay: '0.35s' }}>
                <AIRecommendations 
                  savedAddresses={savedAddresses} 
                  discoveredProperties={[]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

