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

      const { lat, lng, city, state, displayName } = await geocodeRes.json();

      if (!city || !state) {
        throw new Error('Please enter a full US address with city and state.');
      }

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
        city,
        state,
        displayName,
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
    <main className="relative isolate min-h-screen overflow-x-hidden bg-[#f8fafc]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/premium-rental-background.png')" }}
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(90deg,_rgba(2,6,23,0.88)_0%,_rgba(15,23,42,0.68)_52%,_rgba(15,23,42,0.28)_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,_rgba(2,6,23,0.04)_0%,_rgba(248,250,252,0.40)_62%,_rgba(248,250,252,0.92)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <nav className="mb-4 flex items-center justify-between text-white sm:mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-teal-800 text-2xl shadow-lg shadow-slate-950/20">
              🐂
            </div>
            <div>
              <div className="text-base font-black tracking-tight sm:text-lg">BullsRentWise</div>
              <div className="text-xs font-medium text-white/70">US rental confidence tool</div>
            </div>
          </div>
          <div className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur sm:block">
            United States
          </div>
        </nav>

        <header className="mb-4 text-white sm:mb-5">
          <div className="px-1 py-2 sm:p-4 lg:p-6">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                US rental intelligence
              </div>
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Find a rental that feels right before move-in day.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/78 sm:mt-4 sm:text-base">
                Scan US rental addresses for local data where available, safety signals, mold and weather risk, nearby amenities, photos, budget fit, and roommate collaboration.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                <span className="stat-pill border-white/20 bg-white/[0.12] text-white backdrop-blur">311 complaints</span>
                <span className="stat-pill border-white/20 bg-white/[0.12] text-white backdrop-blur">Commute + amenities</span>
                <span className="stat-pill border-amber-300/30 bg-amber-300/[0.12] text-amber-100 backdrop-blur">AI summaries</span>
              </div>
            </div>

          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section className="min-w-0 space-y-4 sm:space-y-5">
            <AddressInput onSubmit={handleAddressSubmit} loading={loading} loadingStep={loadingStep} />
            {!riskData && !loading && <WelcomeSection />}
            {loading && <SkeletonLoader />}
            {riskData && !loading && <RiskResults data={riskData} onSave={() => {}} />}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-3 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50 to-teal-50 p-3 sm:mb-4 sm:p-4">
                <p className="section-label">Workspace</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">Plan and compare</h2>
                <p className="mt-1 text-sm text-slate-500">Save options, coordinate roommates, and tune recommendations.</p>
              </div>
              <div className="space-y-4 rounded-2xl lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto lg:pr-1 scroll-smooth">
                <SavedAddresses
                  onAddressSaved={() => {}}
                  onAddressesChange={(addresses) => setSavedAddresses(addresses)}
                />
                <RoommatesManager />
                <UserPreferences />
                <AIRecommendations
                  savedAddresses={savedAddresses}
                  discoveredProperties={[]}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

