'use client';

import { useState } from 'react';

interface Complaint {
  type: string;
  description: string;
  date: string;
}

interface AIComplaintAnalysisProps {
  complaints: Complaint[];
}

export default function AIComplaintAnalysis({ complaints }: AIComplaintAnalysisProps) {
  const [analyzedComplaints, setAnalyzedComplaints] = useState<Map<number, any>>(new Map());
  const [analyzing, setAnalyzing] = useState<Set<number>>(new Set());

  const analyzeComplaint = async (complaint: Complaint, index: number) => {
    if (analyzedComplaints.has(index) || analyzing.has(index)) return;

    setAnalyzing((prev) => new Set(prev).add(index));
    
    try {
      const response = await fetch('/api/ai/analyze-complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintText: complaint.description,
          complaintType: complaint.type,
        }),
      });

      const analysis = await response.json();
      setAnalyzedComplaints((prev) => {
        const newMap = new Map(prev);
        newMap.set(index, analysis);
        return newMap;
      });
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'frustrated':
        return '😤';
      case 'negative':
        return '😟';
      case 'neutral':
        return '😐';
      default:
        return '😊';
    }
  };

  if (complaints.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h3 className="font-bold text-gray-900">AI-Powered Complaint Analysis</h3>
      </div>

      <div className="space-y-4">
        {complaints.slice(0, 5).map((complaint, idx) => {
          const analysis = analyzedComplaints.get(idx);
          const isAnalyzing = analyzing.has(idx);

          return (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-900">{complaint.type || 'Complaint'}</h4>
                  <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
                </div>
                <button
                  onClick={() => analyzeComplaint(complaint, idx)}
                  disabled={isAnalyzing || !!analysis}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : analysis ? 'Analyzed' : '🤖 Analyze'}
                </button>
              </div>

              {analysis && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(analysis.severity)}`}>
                      {analysis.severity?.toUpperCase() || 'MEDIUM'}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-200 text-gray-700">
                      {analysis.urgency?.toUpperCase() || 'MEDIUM'} URGENCY
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-200 text-gray-700">
                      {getSentimentEmoji(analysis.sentiment)} {analysis.sentiment?.toUpperCase() || 'NEUTRAL'}
                    </span>
                  </div>

                  {analysis.summary && (
                    <p className="text-sm text-gray-700">
                      <strong>Summary:</strong> {analysis.summary}
                    </p>
                  )}

                  {analysis.keyIssues && analysis.keyIssues.length > 0 && (
                    <div>
                      <strong className="text-sm text-gray-700">Key Issues:</strong>
                      <ul className="text-sm text-gray-600 mt-1 space-y-1">
                        {analysis.keyIssues.map((issue: string, i: number) => (
                          <li key={i}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.estimatedImpact && (
                    <p className="text-xs text-gray-500">
                      Estimated Impact: <strong>{analysis.estimatedImpact}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {complaints.length > 5 && (
        <p className="text-sm text-gray-500 mt-4 text-center">
          Showing 5 of {complaints.length} complaints. Analyze individual complaints for AI insights.
        </p>
      )}
    </div>
  );
}

