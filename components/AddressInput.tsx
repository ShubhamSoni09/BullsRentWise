'use client';

import { useRef, useState } from 'react';

interface AddressInputProps {
  onSubmit: (address: string) => void;
  loading: boolean;
  loadingStep?: string;
}

export default function AddressInput({ onSubmit, loading, loadingStep }: AddressInputProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sampleAddresses = [
    '350 5th Ave, New York, NY',
    '1 Market St, San Francisco, CA',
    '401 Congress Ave, Austin, TX',
  ];

  const hasCityAndState = (value: string) => {
    const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
    const statePart = parts[parts.length - 1] || '';
    return parts.length >= 3 && /\b[A-Z]{2}\b/i.test(statePart);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setError('Enter an address first, or pick one of the examples below.');
      inputRef.current?.focus();
      return;
    }

    if (!hasCityAndState(trimmedAddress)) {
      setError('Enter a full address with city and state, like "350 5th Ave, New York, NY".');
      inputRef.current?.focus();
      return;
    }

    setError('');
    onSubmit(trimmedAddress);
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10 sm:p-5 lg:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="icon-tile h-9 w-9 bg-gradient-to-br from-slate-950 via-blue-950 to-teal-800 shadow-slate-950/20 sm:h-10 sm:w-10">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            </div>
            <div>
              <label htmlFor="address" className="text-base font-black text-slate-950 sm:text-lg">
                Start with an address
              </label>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Get a risk score, map, local signals, weather context, photos, and budget tools.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              id="address"
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., 123 Main St, Austin, TX"
              aria-describedby={error ? 'address-error' : undefined}
              className={`input-field text-sm sm:text-base ${error ? 'border-red-300 ring-4 ring-red-100' : ''}`}
              disabled={loading}
            />
            {error && (
              <p id="address-error" className="mt-2 text-xs font-semibold leading-5 text-red-600 sm:text-sm">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-[3.25rem] w-full shrink-0 px-6 sm:w-40"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Checking...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Check</span>
              </>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Try</span>
          {sampleAddresses.map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                setAddress(sample);
                setError('');
                inputRef.current?.focus();
              }}
              disabled={loading}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sample}
            </button>
          ))}
        </div>
        {loading && loadingStep && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <svg className="h-4 w-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-semibold">{loadingStep}</span>
          </div>
        )}
      </form>
    </div>
  );
}

