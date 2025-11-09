'use client';

export default function WelcomeSection() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-xl border border-blue-100 p-4 hover-lift">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-base font-bold text-gray-900">Get Started</h2>
      </div>
      
      <div className="space-y-3">
        <div className="bg-white/80 rounded-lg p-3 border border-blue-100">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Enter a Buffalo Address</h3>
              <p className="text-xs text-gray-600">
                Search for any rental address in Buffalo, NY to get instant risk analysis
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 rounded-lg p-3 border border-indigo-100">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Review Risk Analysis</h3>
              <p className="text-xs text-gray-600">
                Get comprehensive data on 311 complaints, crime, weather risks, and more
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 rounded-lg p-3 border border-purple-100">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">Save & Compare</h3>
              <p className="text-xs text-gray-600">
                Save addresses, track budgets, and get AI-powered recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-blue-200">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Perfect for UB students looking for safe, affordable rentals</span>
        </div>
      </div>
    </div>
  );
}

