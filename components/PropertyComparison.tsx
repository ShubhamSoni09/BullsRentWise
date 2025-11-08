'use client';

import { useState } from 'react';

interface Property {
  address: string;
  riskScore: number;
  rent: number;
  complaints: number;
  crimes: number;
  roommateCount: number;
  perPersonCost: number;
}

interface PropertyComparisonProps {
  properties: Property[];
}

export default function PropertyComparison({ properties }: PropertyComparisonProps) {
  if (properties.length === 0) return null;

  const getBestValue = () => {
    // Best value = lowest risk score with reasonable rent
    return properties.reduce((best, current) => {
      const bestValue = best.riskScore / (best.perPersonCost || 1);
      const currentValue = current.riskScore / (current.perPersonCost || 1);
      return currentValue < bestValue ? current : best;
    });
  };

  const bestValue = getBestValue();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Property Comparison</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-900">Address</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-900">Risk</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-900">Rent</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-900">Per Person</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-900">Complaints</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-900">Crimes</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property, idx) => {
              const isBest = property.address === bestValue.address;
              const riskColor = property.riskScore < 30 ? 'text-green-600' : 
                               property.riskScore < 60 ? 'text-yellow-600' : 'text-red-600';
              
              return (
                <tr
                  key={idx}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    isBest ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="py-3 px-2">
                    <div className="font-medium text-gray-900">{property.address}</div>
                    {isBest && (
                      <span className="text-xs text-green-600 font-semibold">⭐ Best Value</span>
                    )}
                  </td>
                  <td className={`text-center py-3 px-2 font-semibold ${riskColor}`}>
                    {property.riskScore}/100
                  </td>
                  <td className="text-center py-3 px-2">${property.rent.toFixed(0)}</td>
                  <td className="text-center py-3 px-2 font-semibold">
                    ${property.perPersonCost.toFixed(0)}
                  </td>
                  <td className="text-center py-3 px-2">{property.complaints}</td>
                  <td className="text-center py-3 px-2">{property.crimes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

