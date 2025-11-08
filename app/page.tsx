'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import AddressInput from '@/components/AddressInput';
import RiskResults from '@/components/RiskResults';
import SavedAddresses from '@/components/SavedAddresses';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function Home() {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

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

      if (!complaintsRes.ok) {
        console.warn('Failed to fetch complaints');
      }
      if (!weatherRes.ok) {
        const error = await weatherRes.json();
        throw new Error(error.error || 'Failed to fetch weather data');
      }
      if (!crimeRes.ok) {
        console.warn('Failed to fetch crime data');
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto p-4 lg:p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-6 lg:mb-8 animate-fadeIn">
          <div className="inline-block mb-3">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-2">
              <span className="inline-block transform hover:scale-105 transition-transform duration-300">
                🐂
              </span>{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                BullsRentWise
              </span>
            </h1>
          </div>
          <p className="text-base lg:text-lg text-gray-700 font-medium max-w-2xl mx-auto">
            UB Student Rental Risk Checker
          </p>
          <p className="text-sm lg:text-base text-gray-600 mt-2 max-w-xl mx-auto">
            Scan Buffalo addresses for 311 complaints, weather risks, and crime data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Main Content - Scrollable */}
          <div className="lg:col-span-8 space-y-4 lg:space-y-6">
            <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <AddressInput onSubmit={handleAddressSubmit} loading={loading} loadingStep={loadingStep} />
            </div>
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
          
          {/* Sidebar - Fixed Height, Scrollable */}
          <div className="lg:col-span-4">
            <div className="sticky top-4 space-y-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
              <div className="animate-slideIn" style={{ animationDelay: '0.2s' }}>
                <SavedAddresses onAddressSaved={() => {}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

