interface RiskBreakdownProps {
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
}

export default function RiskBreakdown({ complaints, weather, crime, riskScore }: RiskBreakdownProps) {
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

  const heatScore = heatComplaints * 15;
  const leakScore = leakComplaints * 20;
  const pestScore = pestComplaints * 15;
  
  let humidityScore = 0;
  if (weather.avgHumidity > 70) humidityScore += 10;
  if (weather.avgHumidity > 80) humidityScore += 10;
  
  let precipScore = 0;
  if (weather.totalPrecip > 0.5) precipScore += 15;
  if (weather.totalPrecip > 1.0) precipScore += 10;

  // Calculate crime scores
  const violentCrimeScore = crime ? crime.stats.violent * 25 : 0;
  const propertyCrimeScore = crime ? crime.stats.property * 10 : 0;
  const drugCrimeScore = crime ? crime.stats.drug * 8 : 0;
  const vandalismScore = crime ? crime.stats.vandalism * 5 : 0;
  const otherCrimeScore = crime ? crime.stats.other * 3 : 0;
  const crimeDensityScore = crime && crime.stats.total > 10 ? (crime.stats.total > 20 ? 20 : 10) : 0;

  const factors = [
    { name: 'Heat Complaints', score: heatScore, count: heatComplaints, color: 'bg-orange-500' },
    { name: 'Leak Complaints', score: leakScore, count: leakComplaints, color: 'bg-blue-500' },
    { name: 'Pest Complaints', score: pestScore, count: pestComplaints, color: 'bg-purple-500' },
    { name: 'High Humidity', score: humidityScore, value: weather.avgHumidity?.toFixed(1) + '%', color: 'bg-yellow-500' },
    { name: 'Precipitation', score: precipScore, value: weather.totalPrecip?.toFixed(2) + '"', color: 'bg-cyan-500' },
    { name: 'Violent Crimes', score: violentCrimeScore, count: crime?.stats.violent, color: 'bg-red-600' },
    { name: 'Property Crimes', score: propertyCrimeScore, count: crime?.stats.property, color: 'bg-orange-600' },
    { name: 'Drug Crimes', score: drugCrimeScore, count: crime?.stats.drug, color: 'bg-yellow-600' },
    { name: 'Vandalism', score: vandalismScore, count: crime?.stats.vandalism, color: 'bg-blue-600' },
    { name: 'Other Crimes', score: otherCrimeScore, count: crime?.stats.other, color: 'bg-gray-600' },
    { name: 'High Crime Density', score: crimeDensityScore, value: crime && crime.stats.total > 10 ? `${crime.stats.total} total` : undefined, color: 'bg-red-800' },
  ].filter(f => f.score > 0);

  if (factors.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 text-sm font-medium">
          ✅ No significant risk factors detected
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 border border-gray-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="font-bold text-gray-900 text-base">Risk Breakdown</h3>
      </div>
      <div className="space-y-3">
        {factors.map((factor, idx) => {
          const percentage = (factor.score / riskScore) * 100;
          return (
            <div key={idx} className="bg-white/70 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-800 font-medium">
                  {factor.name}
                  {factor.count !== undefined && factor.count > 0 && (
                    <span className="text-gray-500 ml-1 font-normal">({factor.count})</span>
                  )}
                  {factor.value && (
                    <span className="text-gray-500 ml-1 font-normal">({factor.value})</span>
                  )}
                </span>
                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">+{factor.score}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`${factor.color} h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

