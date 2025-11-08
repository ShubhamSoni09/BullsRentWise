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
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  const animateScore = (targetScore: number) => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = targetScore / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(increment * step, targetScore);
      setAnimatedScore(Math.round(current));
      
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedScore(targetScore);
      }
    }, duration / steps);
  };

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
        
        // Animate the score
        const targetScore = data.predictedScore || data.next30Days || currentRiskScore;
        animateScore(targetScore);
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

  // Use the predicted score from API (or fallback to current score)
  const predictedScore = predictions.predictedScore || currentRiskScore;

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

  const colors = getRiskColor(predictedScore);
  const radius = 55; // Updated radius for larger circle
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

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
      
      <div className="flex flex-col items-center justify-center">
        {/* Circular Progress - Enhanced */}
        <div className="relative w-40 h-40 mb-6">
          <svg className="transform -rotate-90 w-40 h-40">
            {/* Background circle */}
            <circle
              cx="50%"
              cy="50%"
              r="55"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="50%"
              cy="50%"
              r="55"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${colors.text} transition-all duration-1000 ease-out`}
              style={{
                filter: 'drop-shadow(0 0 6px currentColor)',
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-extrabold ${colors.text} transition-all duration-300`}>
              {animatedScore}
            </div>
            <div className="text-sm text-gray-500 mt-1 font-medium">/100</div>
          </div>
        </div>

        {/* Risk Label */}
        <div className={`px-6 py-2 rounded-full ${colors.bg} text-white text-base font-bold mb-3 transition-all duration-300 shadow-lg`}>
          {getRiskLabel(predictedScore)}
        </div>

        {/* Trend indicator - Enhanced */}
        {predictions.trend && (
          <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${
            predictions.trend === 'improving' ? 'bg-green-100 text-green-700' :
            predictions.trend === 'worsening' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {predictions.trend === 'improving' && (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
            {predictions.trend === 'worsening' && (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            {predictions.trend === 'stable' && (
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              </svg>
            )}
            <span className="capitalize">Risk is {predictions.trend}</span>
          </div>
        )}
      </div>
    </div>
  );
}

