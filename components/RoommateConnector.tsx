'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import SharedPropertyList from '@/components/SharedPropertyList';

interface Roommate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  budget: number;
  preferences?: string;
  joinedAt: string;
}

interface RoommateConnectorProps {
  address: string;
  riskScore: number;
  onRoommateUpdate?: (count: number) => void;
}

export default function RoommateConnector({ address, riskScore, onRoommateUpdate }: RoommateConnectorProps) {
  const [roommates, setRoommates] = useState<Roommate[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoommate, setNewRoommate] = useState({
    name: '',
    email: '',
    phone: '',
    budget: 0,
    preferences: '',
  });
  const [shareCode, setShareCode] = useState<string>('');
  const [joiningCode, setJoiningCode] = useState<string>('');

  useEffect(() => {
    // Load roommates from localStorage
    const saved = localStorage.getItem(`roommates_${address}`);
    if (saved) {
      const data = JSON.parse(saved);
      setRoommates(data.roommates || []);
      setShareCode(data.shareCode || generateShareCode());
    } else {
      setShareCode(generateShareCode());
    }
  }, [address]);

  const generateShareCode = () => {
    return `BRW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleAddRoommate = () => {
    if (!newRoommate.name || !newRoommate.email) {
      toast.error('Name and email are required');
      return;
    }

    const roommate: Roommate = {
      id: Date.now().toString(),
      name: newRoommate.name,
      email: newRoommate.email,
      phone: newRoommate.phone,
      budget: newRoommate.budget,
      preferences: newRoommate.preferences,
      joinedAt: new Date().toISOString(),
    };

    const updated = [...roommates, roommate];
    setRoommates(updated);
    saveRoommates(updated);
    setNewRoommate({ name: '', email: '', phone: '', budget: 0, preferences: '' });
    setShowAddForm(false);
    toast.success('Roommate added!');
    if (onRoommateUpdate) onRoommateUpdate(updated.length);
  };

  const handleJoinWithCode = () => {
    if (!joiningCode) {
      toast.error('Please enter a share code');
      return;
    }

    // In a real app, this would connect to a backend
    // For now, we'll simulate joining
    toast.success(`Joining group with code: ${joiningCode}`);
    // You could implement actual sharing logic here
  };

  const handleRemoveRoommate = (id: string) => {
    const updated = roommates.filter(r => r.id !== id);
    setRoommates(updated);
    saveRoommates(updated);
    toast.success('Roommate removed');
    if (onRoommateUpdate) onRoommateUpdate(updated.length);
  };

  const saveRoommates = (roommateList: Roommate[]) => {
    const data = {
      roommates: roommateList,
      shareCode,
      address,
      riskScore,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`roommates_${address}`, JSON.stringify(data));
  };

  const handleShare = async () => {
    const shareText = `Join me in evaluating this property on BullsRentWise!\n\nAddress: ${address}\nShare Code: ${shareCode}\n\nUse this code to connect and collaborate!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BullsRentWise - Property Evaluation',
          text: shareText,
        });
        toast.success('Shared!');
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      toast.success('Share code copied to clipboard!');
    }
  };

  const totalBudget = roommates.reduce((sum, r) => sum + r.budget, 0);
  const avgBudget = roommates.length > 0 ? totalBudget / roommates.length : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900">👥 Roommates</h3>
        <span className="text-xs text-gray-600">
          {roommates.length} {roommates.length !== 1 ? 'people' : 'person'}
        </span>
      </div>

      <div className="space-y-3">
        {/* Share Code Section */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">Share Code</h4>
            <button
              onClick={handleShare}
              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
            >
              Share
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 px-2 py-1.5 bg-white border border-blue-200 rounded text-xs font-mono">
              {shareCode}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareCode);
                toast.success('Code copied!');
              }}
              className="px-2 py-1.5 bg-white border border-blue-200 rounded text-xs hover:bg-blue-50"
            >
              📋
            </button>
          </div>
        </div>

        {/* Join with Code */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">Join Group</h4>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={joiningCode}
              onChange={(e) => setJoiningCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleJoinWithCode}
              className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              Join
            </button>
          </div>
        </div>

        {/* Roommates List */}
        {roommates.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <h4 className="font-semibold text-gray-900 text-sm">Connected ({roommates.length})</h4>
            {roommates.map((roommate) => (
              <div
                key={roommate.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{roommate.name}</div>
                  <div className="text-xs text-gray-600 truncate">{roommate.email}</div>
                  {roommate.budget > 0 && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      ${roommate.budget.toFixed(0)}/mo
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveRoommate(roommate.id)}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm shrink-0"
                >
                  ×
                </button>
              </div>
            ))}
            {avgBudget > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg:</span>
                  <span className="font-semibold">${avgBudget.toFixed(0)}/person</span>
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">${totalBudget.toFixed(0)}/mo</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Roommate Form */}
        {showAddForm ? (
          <div className="border border-gray-200 rounded-lg p-3 space-y-2">
            <h4 className="font-semibold text-gray-900 text-sm">Add Roommate</h4>
            <input
              type="text"
              value={newRoommate.name}
              onChange={(e) => setNewRoommate({ ...newRoommate, name: e.target.value })}
              placeholder="Name"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="email"
              value={newRoommate.email}
              onChange={(e) => setNewRoommate({ ...newRoommate, email: e.target.value })}
              placeholder="Email"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={newRoommate.phone}
                onChange={(e) => setNewRoommate({ ...newRoommate, phone: e.target.value })}
                placeholder="Phone"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                value={newRoommate.budget || ''}
                onChange={(e) => setNewRoommate({ ...newRoommate, budget: parseFloat(e.target.value) || 0 })}
                placeholder="Budget $"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleAddRoommate}
                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewRoommate({ name: '', email: '', phone: '', budget: 0, preferences: '' });
                }}
                className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium transition-colors"
          >
            + Add Roommate
          </button>
        )}
      </div>

      {shareCode && roommates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <SharedPropertyList
            shareCode={shareCode}
            currentUserId="You" // In real app, this would be actual user ID
          />
        </div>
      )}
    </div>
  );
}

