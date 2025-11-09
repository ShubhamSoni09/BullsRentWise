'use client';

import { useState, useEffect } from 'react';

interface AIRiskPredictionProps {
  currentRiskScore: number;
  complaints: any[];
  crimeStats: any;
  weather: any;
}

export default function AIRiskPrediction({
  currentRiskScore,
  complaints,
  crimeStats,
  weather,
}: AIRiskPredictionProps) {
  const [predictions, setPredictions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await fetch('/api/ai/predict-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentRiskScore,
            complaints,
            crimeStats,
            weather,
          }),
        });

        const data = await response.json();
        setPredictions(data);
      } catch (error) {
        console.error('Prediction error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [currentRiskScore, complaints, crimeStats, weather]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-xl border border-purple-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v2a2 2 0 01-2-2v-.469c0-.621-.251-1.217-.688-1.653l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">AI Risk Prediction</h3>
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-sm">Analyzing...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!predictions) return null;

  const getRiskColor = (score: number) => {
    if (score < 30) return { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-200' };
    if (score < 60) return { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-200' };
    return { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-200' };
  };

  const getRiskLabel = (score: number) => {
    if (score < 30) return 'Low Risk';
    if (score < 60) return 'Medium Risk';
    return 'High Risk';
  };

  // Use the predicted score from API (or fallback to current score)
  const predictedScore = predictions.predictedScore || currentRiskScore;
  const currentColors = getRiskColor(currentRiskScore);
  const predictedColors = getRiskColor(predictedScore);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-xl border border-purple-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v2a2 2 0 01-2-2v-.469c0-.621-.251-1.217-.688-1.653l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">AI Risk Prediction</h3>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
          title="What is AI Risk Prediction?"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {showInfo && (
        <div className="mb-4 p-4 bg-white/80 rounded-lg border border-purple-200 animate-fadeIn">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">What is AI Risk Prediction?</h4>
          <p className="text-xs text-gray-700 leading-relaxed">
            Our AI analyzes historical patterns from 311 complaints, crime data, and weather trends to predict 
            future risk scores. It uses machine learning to identify patterns and forecast potential issues 
            (like heating problems in winter, mold risk from humidity, or crime trends) that might affect 
            your rental experience over the next 30-90 days.
          </p>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Current Risk */}
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Current Risk</div>
          <div className={`text-2xl font-bold ${currentColors.text} mb-4`}>
            {getRiskLabel(currentRiskScore)}
          </div>
        </div>

        {/* Future Prediction */}
        <div className="text-center border-t border-gray-200 pt-4">
          <div className="text-xs text-gray-500 mb-1">Predicted Future Risk</div>
          <div className={`text-2xl font-bold ${predictedColors.text} mb-2`}>
            {getRiskLabel(predictedScore)}
          </div>
          {predictedScore !== currentRiskScore && (
            <div className={`text-sm font-medium mt-2 ${
              predictedScore > currentRiskScore ? 'text-red-600' : 'text-green-600'
            }`}>
              {predictedScore > currentRiskScore ? '↑ Risk increasing' : '↓ Risk decreasing'}
            </div>
          )}
          {predictedScore === currentRiskScore && (
            <div className="text-sm font-medium mt-2 text-gray-600">
              Risk expected to stay similar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

