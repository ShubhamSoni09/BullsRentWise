'use client';

import { useState, useEffect } from 'react';
import LazyList from '@/components/LazyList';

interface SavedAddress {
  id: string;
  address: string;
  riskScore: number;
  lat?: number;
  lng?: number;
  date: string;
}

interface SavedAddressesProps {
  onAddressSaved?: () => void;
  onAddressesChange?: (addresses: SavedAddress[]) => void;
}

export default function SavedAddresses({ onAddressSaved, onAddressesChange }: SavedAddressesProps) {
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    // Load from localStorage
    const loadAddresses = () => {
      const saved = localStorage.getItem('savedAddresses');
      if (saved) {
        const addresses = JSON.parse(saved);
        setSavedAddresses(addresses);
        if (onAddressesChange) {
          onAddressesChange(addresses);
        }
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
  }, [onAddressSaved, onAddressesChange]);

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
    <div className="app-card overflow-hidden p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="icon-tile h-9 w-9 bg-amber-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="section-label">Shortlist</p>
          <h2 className="text-base font-black text-slate-950">Saved Addresses</h2>
        </div>
        {savedAddresses.length > 0 && (
          <span className="stat-pill">
            {savedAddresses.length}
          </span>
        )}
      </div>
        {savedAddresses.length === 0 ? (
          <div className="empty-state animate-fadeIn">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
              <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-700">No saved addresses</p>
            <p className="mt-1 text-xs text-slate-500">Save a report to compare rentals.</p>
          </div>
        ) : (
        <div className="max-h-64 overflow-y-auto scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
          <LazyList
            items={savedAddresses}
            renderItem={(addr) => {
            const getRiskColor = (score: number) => {
              if (score < 30) return 'bg-green-500';
              if (score < 60) return 'bg-yellow-500';
              return 'bg-red-500';
            };
            return (
            <li
              key={addr.id}
              className="flex cursor-pointer items-start justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-blue-200 hover:bg-white hover:shadow-sm"
            >
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="truncate text-sm font-bold text-slate-950">{addr.address}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${getRiskColor(addr.riskScore)}`}>
                    {addr.riskScore}/100
                  </div>
                  <span className="text-xs text-gray-500">{new Date(addr.date).toLocaleDateString()}</span>
                </div>
                {(() => {
                  const budgetData = localStorage.getItem(`budget_${addr.address}`);
                  if (budgetData) {
                    const budget = JSON.parse(budgetData);
                    if (budget.estimatedRent > 0) {
                      return (
                        <div className="mt-2 flex flex-wrap items-center gap-1 text-xs font-semibold text-blue-600">
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="truncate">${budget.estimatedRent.toFixed(0)}/mo</span>
                          {budget.roommateCount > 0 && (
                            <span className="text-gray-500 truncate">• ${(budget.estimatedRent / (budget.roommateCount + 1)).toFixed(0)}/person</span>
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
                className="ml-2 shrink-0 rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                title="Delete address"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
                </li>
              );
            }}
            initialCount={5}
            increment={5}
            className="space-y-3"
          />
        </div>
      )}
    </div>
  );
}

