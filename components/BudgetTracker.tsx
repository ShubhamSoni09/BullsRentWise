'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface BudgetTrackerProps {
  address: string;
  riskScore: number;
  onBudgetUpdate?: (budget: number) => void;
}

export default function BudgetTracker({ address, riskScore, onBudgetUpdate }: BudgetTrackerProps) {
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [estimatedRent, setEstimatedRent] = useState<number>(0);
  const [roommateCount, setRoommateCount] = useState<number>(0);
  const [utilities, setUtilities] = useState<number>(100);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved budget from localStorage
    const saved = localStorage.getItem(`budget_${address}`);
    if (saved) {
      const data = JSON.parse(saved);
      setMonthlyBudget(data.monthlyBudget || 0);
      setEstimatedRent(data.estimatedRent || 0);
      setRoommateCount(data.roommateCount || 0);
      setUtilities(data.utilities || 100);
      setSaved(true);
    }
  }, [address]);

  const handleSave = () => {
    const budgetData = {
      address,
      monthlyBudget,
      estimatedRent,
      roommateCount,
      utilities,
      riskScore,
      date: new Date().toISOString(),
    };
    localStorage.setItem(`budget_${address}`, JSON.stringify(budgetData));
    setSaved(true);
    toast.success('Budget saved!');
    if (onBudgetUpdate) onBudgetUpdate(monthlyBudget);
  };

  const totalMonthlyCost = estimatedRent + utilities;
  const perPersonCost = roommateCount > 0 ? totalMonthlyCost / (roommateCount + 1) : totalMonthlyCost;
  const isAffordable = monthlyBudget > 0 && perPersonCost <= monthlyBudget;
  const budgetRemaining = monthlyBudget - perPersonCost;
  const affordabilityPercentage = monthlyBudget > 0 ? (perPersonCost / monthlyBudget) * 100 : 0;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 lg:p-6 hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg lg:text-xl font-bold text-gray-900">Budget</h3>
        </div>
        {saved && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Budget (per person)
            </label>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all bg-white shadow-sm">
              <span className="text-gray-500 text-sm font-medium">$</span>
              <input
                type="number"
                value={monthlyBudget || ''}
                onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
                placeholder="500"
                className="flex-1 text-sm font-medium text-gray-900 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Monthly Rent
            </label>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all bg-white shadow-sm">
              <span className="text-gray-500 text-sm font-medium">$</span>
              <input
                type="number"
                value={estimatedRent || ''}
                onChange={(e) => setEstimatedRent(parseFloat(e.target.value) || 0)}
                placeholder="1200"
                className="flex-1 text-sm font-medium text-gray-900 outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Roommates
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={roommateCount || ''}
              onChange={(e) => setRoommateCount(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2.5 text-sm font-medium text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white outline-none shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Utilities
            </label>
            <div className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all bg-white shadow-sm">
              <span className="text-gray-500 text-sm font-medium">$</span>
              <input
                type="number"
                value={utilities || ''}
                onChange={(e) => setUtilities(parseFloat(e.target.value) || 0)}
                placeholder="100"
                className="flex-1 text-sm font-medium text-gray-900 outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Save Budget
        </button>

        {estimatedRent > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-300">
              <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Cost Breakdown
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent:</span>
                  <span className="font-semibold">${estimatedRent.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilities:</span>
                  <span className="font-semibold">${utilities.toFixed(0)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-gray-400">
                  <span className="text-gray-900 font-semibold">Total:</span>
                  <span className="font-bold">${totalMonthlyCost.toFixed(0)}</span>
                </div>
                {roommateCount > 0 && (
                  <div className="flex justify-between pt-1.5 border-t border-gray-400">
                    <span className="text-gray-900 font-semibold">Per Person:</span>
                    <span className="font-bold text-blue-600">
                      ${perPersonCost.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {monthlyBudget > 0 && (
              <div className={`rounded-xl p-4 border-2 ${
                isAffordable ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' : 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <svg className={`w-4 h-4 ${isAffordable ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Affordability
                  </h4>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    isAffordable ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {isAffordable ? '✓ Affordable' : '⚠️ Over Budget'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-semibold">${monthlyBudget.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost per person:</span>
                    <span className="font-semibold">${perPersonCost.toFixed(0)}</span>
                  </div>
                  {isAffordable ? (
                    <div className="flex justify-between pt-1.5 border-t border-green-300">
                      <span className="text-green-800 font-semibold">Remaining:</span>
                      <span className="font-bold text-green-800">${budgetRemaining.toFixed(0)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between pt-1.5 border-t border-red-300">
                      <span className="text-red-800 font-semibold">Over by:</span>
                      <span className="font-bold text-red-800">
                        ${Math.abs(budgetRemaining).toFixed(0)}
                      </span>
                    </div>
                  )}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Usage</span>
                      <span>{affordabilityPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          affordabilityPercentage <= 80 ? 'bg-green-500' :
                          affordabilityPercentage <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, affordabilityPercentage)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

