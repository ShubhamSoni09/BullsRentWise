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
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">💰 Budget</h3>
        {saved && (
          <span className="text-xs text-green-600 font-medium">✓ Saved</span>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Budget (per person)
            </label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={monthlyBudget || ''}
                onChange={(e) => setMonthlyBudget(parseFloat(e.target.value) || 0)}
                placeholder="500"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Monthly Rent
            </label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={estimatedRent || ''}
                onChange={(e) => setEstimatedRent(parseFloat(e.target.value) || 0)}
                placeholder="1200"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Roommates
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={roommateCount || ''}
              onChange={(e) => setRoommateCount(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Utilities
            </label>
            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-sm">$</span>
              <input
                type="number"
                value={utilities || ''}
                onChange={(e) => setUtilities(parseFloat(e.target.value) || 0)}
                placeholder="100"
                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium transition-colors"
        >
          Save Budget
        </button>

        {estimatedRent > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 text-sm mb-2">Cost Breakdown</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent:</span>
                  <span className="font-semibold">${estimatedRent.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Utilities:</span>
                  <span className="font-semibold">${utilities.toFixed(0)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-gray-300">
                  <span className="text-gray-900 font-semibold">Total:</span>
                  <span className="font-bold">${totalMonthlyCost.toFixed(0)}</span>
                </div>
                {roommateCount > 0 && (
                  <div className="flex justify-between pt-1.5 border-t border-gray-300">
                    <span className="text-gray-900 font-semibold">Per Person:</span>
                    <span className="font-bold text-blue-600">
                      ${perPersonCost.toFixed(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {monthlyBudget > 0 && (
              <div className={`rounded-lg p-3 ${
                isAffordable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">Affordability</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isAffordable ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {isAffordable ? '✓ OK' : '⚠️ Over'}
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

