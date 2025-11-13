'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Roommate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  budget: number;
  preferences?: string;
  joinedAt: string;
}

export default function RoommatesManager() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [showEmailForm, setShowEmailForm] = useState(true);
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
  const [currentUserGroup, setCurrentUserGroup] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const roommatesRef = useRef<Roommate[]>([]);

  const loadGroupData = useCallback(async (code: string, showToast = false) => {
    if (!code) return;

    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/roommates?shareCode=${encodeURIComponent(code)}`);
      if (response.ok) {
        const groupData = await response.json();
        const newRoommates = groupData.roommates || [];
        const previousCount = roommatesRef.current.length;

        setRoommates(newRoommates);
        roommatesRef.current = newRoommates;

        // Show notification if new members joined
        if (showToast && newRoommates.length > previousCount) {
          const newCount = newRoommates.length - previousCount;
          toast.success(`${newCount} new roommate${newCount > 1 ? 's' : ''} joined!`);
        }
      }
    } catch (error) {
      console.error('Failed to load group:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Load user email from localStorage
    const savedUser = localStorage.getItem('roommate_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUserEmail(userData.email || '');
      setUserName(userData.name || '');
      setShowEmailForm(false);

      // Load user's current group
      if (userData.currentGroup) {
        setCurrentUserGroup(userData.currentGroup);
        setShareCode(userData.currentGroup);
        loadGroupData(userData.currentGroup);
      } else {
        // Create new group for user
        const newCode = generateShareCode();
        setShareCode(newCode);
        setCurrentUserGroup(newCode);
        createNewGroup(newCode, userData.email, userData.name);
      }
    }
  }, [loadGroupData]);

  // Auto-refresh group data every 3 seconds when user has a group
  useEffect(() => {
    if (!currentUserGroup || !userEmail) return;

    const refreshInterval = setInterval(() => {
      loadGroupData(currentUserGroup);
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(refreshInterval);
  }, [currentUserGroup, userEmail, loadGroupData]);

  const handleRefresh = () => {
    if (currentUserGroup) {
      loadGroupData(currentUserGroup, true);
    }
  };

  const createNewGroup = async (code: string, email: string, name: string) => {
    const currentUser: Roommate = {
      id: `user_${Date.now()}`,
      name: name || 'You',
      email: email,
      joinedAt: new Date().toISOString(),
      budget: 0,
    };

    const initialGroup = {
      shareCode: code,
      roommates: [currentUser],
      updatedAt: new Date().toISOString(),
    };

        setRoommates([currentUser]);
        roommatesRef.current = [currentUser];
        
        try {
          await fetch('/api/roommates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(initialGroup),
          });
        } catch (error) {
          console.error('Failed to create group:', error);
        }
  };

  const handleEmailSubmit = () => {
    if (!userEmail.trim()) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Save user info
    const userData = {
      email: userEmail.trim(),
      name: userName.trim() || 'You',
      currentGroup: null,
    };
    localStorage.setItem('roommate_user', JSON.stringify(userData));

    // Create new group for user
    const newCode = generateShareCode();
    setShareCode(newCode);
    setCurrentUserGroup(newCode);
    setShowEmailForm(false);
    
    createNewGroup(newCode, userEmail.trim(), userName.trim() || 'You');
    toast.success('Welcome! Your roommate group is ready.');
  };

  const generateShareCode = () => {
    return `BRW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleAddRoommate = async () => {
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
    roommatesRef.current = updated;
    
    // Save to API if shareCode exists
    if (shareCode) {
      try {
        await fetch('/api/roommates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shareCode, roommate }),
        });
      } catch (error) {
        console.error('Failed to save to API:', error);
      }
    }
    
    saveRoommates(updated);
    setNewRoommate({ name: '', email: '', phone: '', budget: 0, preferences: '' });
    setShowAddForm(false);
    toast.success('Roommate added!');
  };

  const handleJoinWithCode = async () => {
    if (!joiningCode) {
      toast.error('Please enter a share code');
      return;
    }

    if (!userEmail) {
      toast.error('Please add your email first');
      setShowEmailForm(true);
      return;
    }

    // Normalize the code (remove spaces, convert to uppercase)
    const normalizedCode = joiningCode.trim().toUpperCase().replace(/\s+/g, '');
    
    if (!normalizedCode.startsWith('BRW-')) {
      toast.error('Invalid code format. Codes should start with "BRW-"');
      return;
    }

    // Don't join if it's the same group
    if (normalizedCode === currentUserGroup) {
      toast('You are already in this group', { icon: 'ℹ️' });
      return;
    }

    try {
      // Remove user from previous group if they were in one
      if (currentUserGroup) {
        try {
          const prevGroupResponse = await fetch(`/api/roommates?shareCode=${encodeURIComponent(currentUserGroup)}`);
          if (prevGroupResponse.ok) {
            const prevGroupData = await prevGroupResponse.json();
            const currentUserInPrev = prevGroupData.roommates?.find((r: Roommate) => r.email === userEmail);
            if (currentUserInPrev) {
              await fetch(`/api/roommates?shareCode=${encodeURIComponent(currentUserGroup)}&roommateId=${encodeURIComponent(currentUserInPrev.id)}`, {
                method: 'DELETE',
              });
            }
          }
        } catch (error) {
          console.error('Failed to leave previous group:', error);
        }
      }

      // Fetch the new group
      const response = await fetch(`/api/roommates?shareCode=${encodeURIComponent(normalizedCode)}`);
      
      if (response.ok) {
        const groupData = await response.json();
        
        // Create current user object
        const currentUser: Roommate = {
          id: `user_${Date.now()}`,
          name: userName || 'You',
          email: userEmail,
          joinedAt: new Date().toISOString(),
          budget: 0,
        };

        // Check if user is already in the group
        const existingUser = groupData.roommates?.find((r: Roommate) => r.email === userEmail);

        if (!existingUser) {
          // Add current user to the new group via API
          const addResponse = await fetch('/api/roommates', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shareCode: normalizedCode, roommate: currentUser }),
          });

          if (addResponse.ok) {
            const updated = await addResponse.json();
            setRoommates(updated.group.roommates);
            roommatesRef.current = updated.group.roommates;
          } else {
            const roommatesList = groupData.roommates || [];
            setRoommates(roommatesList);
            roommatesRef.current = roommatesList;
          }
        } else {
          const roommatesList = groupData.roommates || [];
          setRoommates(roommatesList);
          roommatesRef.current = roommatesList;
        }

        // Update user's current group
        setShareCode(normalizedCode);
        setCurrentUserGroup(normalizedCode);
        setJoiningCode('');
        
        // Update localStorage
        const savedUser = localStorage.getItem('roommate_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          userData.currentGroup = normalizedCode;
          localStorage.setItem('roommate_user', JSON.stringify(userData));
        }
        
        toast.success(`Joined new group! Found ${groupData.roommates?.length || 0} roommate(s).`);
        return;
      } else {
        toast.error(`Share code "${normalizedCode}" not found.`);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group. Please try again.');
    }
  };

  const handleRemoveRoommate = async (id: string) => {
    // Prevent user from removing themselves (they should join another group to leave)
    const roommateToRemove = roommates.find(r => r.id === id);
    if (roommateToRemove && roommateToRemove.email === userEmail) {
      toast.error('To leave this group, join another group using a share code');
      return;
    }

    const updated = roommates.filter(r => r.id !== id);
    setRoommates(updated);
    roommatesRef.current = updated;
    
    // Remove from API if shareCode exists
    if (shareCode) {
      try {
        await fetch(`/api/roommates?shareCode=${encodeURIComponent(shareCode)}&roommateId=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to remove from API:', error);
      }
    }
    
    saveRoommates(updated);
    toast.success('Roommate removed');
  };

  const saveRoommates = (roommateList: Roommate[]) => {
    // Update user's current group in localStorage
    const savedUser = localStorage.getItem('roommate_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      userData.currentGroup = shareCode;
      localStorage.setItem('roommate_user', JSON.stringify(userData));
    }
  };

  const handleShare = async () => {
    const shareText = `Join me on BullsRentWise to find the perfect rental!\n\nShare Code: ${shareCode}\n\nUse this code to connect and collaborate!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BullsRentWise - Roommate Connection',
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

  // Show email form if user hasn't added their email
  if (showEmailForm || !userEmail) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 p-3 hover-lift">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900">My Roommates</h2>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Add Your Email to Get Started
          </h3>
          <p className="text-xs text-gray-600 mb-4">
            Enter your email to create or join a roommate group and start collaborating!
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your Name (optional)"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white outline-none text-gray-900 placeholder-gray-400"
              style={{ WebkitTextFillColor: '#111827', color: '#111827', opacity: 1 }}
            />
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Your Email *"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white outline-none text-gray-900 placeholder-gray-400"
              style={{ WebkitTextFillColor: '#111827', color: '#111827', opacity: 1 }}
            />
            <button
              onClick={handleEmailSubmit}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/50 p-3 hover-lift">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900">My Roommates</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
            {roommates.length} {roommates.length !== 1 ? 'people' : 'person'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh group"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => {
              setShowEmailForm(true);
            }}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            title="Change email"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Share Code Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Code
            </h4>
            <button
              onClick={handleShare}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              Share
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 bg-white border-2 border-blue-200 rounded-xl text-sm font-mono font-semibold text-gray-900">
              {shareCode}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareCode);
                toast.success('Code copied!');
              }}
              className="px-3 py-2.5 bg-white border-2 border-blue-200 rounded-xl text-sm hover:bg-blue-50 transition-all hover:border-blue-300"
              title="Copy code"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Join with Code */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
          <h4 className="font-bold text-gray-900 text-xs mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Join Group
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={joiningCode}
              onChange={(e) => setJoiningCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all bg-white outline-none text-gray-900 placeholder-gray-400"
              style={{ WebkitTextFillColor: '#111827', color: '#111827', opacity: 1 }}
            />
            <button
              onClick={handleJoinWithCode}
              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
            >
              Join
            </button>
          </div>
        </div>

        {/* Roommates List */}
        {roommates.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Connected ({roommates.length})
            </h4>
            {roommates.map((roommate) => (
              <div
                key={roommate.id}
                className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md hover-lift transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{roommate.name}</div>
                  <div className="text-xs text-gray-600 truncate">{roommate.email}</div>
                  {roommate.budget > 0 && (
                    <div className="text-xs text-blue-600 font-medium mt-0.5">
                      ${roommate.budget.toFixed(0)}/mo budget
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveRoommate(roommate.id)}
                  className="ml-3 p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Remove roommate"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            {avgBudget > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-300 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">Average Budget:</span>
                  <span className="font-bold text-purple-700">${avgBudget.toFixed(0)}/person</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-700 font-medium">Total Budget:</span>
                  <span className="font-bold text-purple-700">${totalBudget.toFixed(0)}/mo</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-2">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-xs font-medium">No roommates yet</p>
            <p className="text-gray-400 text-xs mt-0.5">Add to collaborate</p>
          </div>
        )}

        {/* Add Roommate Form */}
        {showAddForm ? (
          <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3 bg-gradient-to-br from-gray-50 to-white">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Roommate
            </h4>
            <input
              type="text"
              value={newRoommate.name}
              onChange={(e) => setNewRoommate({ ...newRoommate, name: e.target.value })}
              placeholder="Name"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white outline-none text-gray-900 placeholder-gray-400"
              style={{ WebkitTextFillColor: '#111827', color: '#111827', opacity: 1 }}
            />
            <input
              type="email"
              value={newRoommate.email}
              onChange={(e) => setNewRoommate({ ...newRoommate, email: e.target.value })}
              placeholder="Email"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white outline-none text-gray-900 placeholder-gray-400"
              style={{ WebkitTextFillColor: '#111827', color: '#111827', opacity: 1 }}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={newRoommate.phone}
                onChange={(e) => setNewRoommate({ ...newRoommate, phone: e.target.value })}
                placeholder="Phone"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white outline-none text-gray-900 placeholder-gray-400"
                style={{ WebkitTextFillColor: '#111827', color: '#111827', opacity: 1 }}
              />
              <input
                type="number"
                value={newRoommate.budget || ''}
                onChange={(e) => setNewRoommate({ ...newRoommate, budget: parseFloat(e.target.value) || 0 })}
                placeholder="Budget $"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white outline-none text-gray-900 placeholder-gray-400"
                style={{ WebkitTextFillColor: '#111827', color: '#111827', opacity: 1 }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddRoommate}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewRoommate({ name: '', email: '', phone: '', budget: 0, preferences: '' });
                }}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Roommate
          </button>
        )}
      </div>
    </div>
  );
}

