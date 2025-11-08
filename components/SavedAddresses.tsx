'use client';

import { useState, useEffect } from 'react';

interface SavedAddress {
  id: string;
  address: string;
  riskScore: number;
  date: string;
}

interface SavedAddressesProps {
  onAddressSaved?: () => void;
}

export default function SavedAddresses({ onAddressSaved }: SavedAddressesProps) {
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    // Load from localStorage
    const loadAddresses = () => {
      const saved = localStorage.getItem('savedAddresses');
      if (saved) {
        setSavedAddresses(JSON.parse(saved));
      }
    };
    loadAddresses();

    // Listen for storage changes (when address is saved from RiskResults)
    const handleStorageChange = () => {
      loadAddresses();
      if (onAddressSaved) onAddressSaved();
    };

    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event for same-tab updates
    window.addEventListener('addressSaved', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('addressSaved', handleStorageChange);
    };
  }, [onAddressSaved]);

  // Poll for changes (for same-tab updates)
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('savedAddresses');
      if (saved) {
        const addresses = JSON.parse(saved);
        if (addresses.length !== savedAddresses.length) {
          setSavedAddresses(addresses);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [savedAddresses.length]);

  const handleDelete = (id: string) => {
    const updated = savedAddresses.filter(addr => addr.id !== id);
    setSavedAddresses(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
    // Dispatch event to notify other components
    window.dispatchEvent(new Event('addressSaved'));
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h2 className="text-lg lg:text-xl font-bold text-gray-900">Saved Addresses</h2>
        {savedAddresses.length > 0 && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            {savedAddresses.length}
          </span>
        )}
      </div>
      {savedAddresses.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p className="text-gray-500 text-sm">No saved addresses yet</p>
          <p className="text-gray-400 text-xs mt-1">Save addresses to compare later</p>
        </div>
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {savedAddresses.map((addr) => {
            const getRiskColor = (score: number) => {
              if (score < 30) return 'bg-green-500';
              if (score < 60) return 'bg-yellow-500';
              return 'bg-red-500';
            };
            return (
              <li
                key={addr.id}
                className="flex justify-between items-start p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{addr.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`px-2 py-0.5 rounded-lg text-white text-xs font-bold ${getRiskColor(addr.riskScore)}`}>
                    {addr.riskScore}/100
                  </div>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">{new Date(addr.date).toLocaleDateString()}</span>
                </div>
                {(() => {
                  const budgetData = localStorage.getItem(`budget_${addr.address}`);
                  if (budgetData) {
                    const budget = JSON.parse(budgetData);
                    if (budget.estimatedRent > 0) {
                      return (
                        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>${budget.estimatedRent.toFixed(0)}/mo</span>
                          {budget.roommateCount > 0 && (
                            <span className="text-gray-500">• ${(budget.estimatedRent / (budget.roommateCount + 1)).toFixed(0)}/person</span>
                          )}
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
              <button
                onClick={() => handleDelete(addr.id)}
                className="ml-3 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Delete address"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          );
          })}
        </ul>
      )}
    </div>
  );
}

