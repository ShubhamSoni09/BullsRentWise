'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import SharedPropertyList from '@/components/SharedPropertyList';
import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from '@/lib/firebaseClient';

interface RoommateMember {
  uid: string;
  displayName: string;
  role?: 'owner' | 'member';
  joinedAt?: string;
  lastActive?: string;
}

interface RoommateConnectorProps {
  address: string;
  riskScore: number;
  onRoommateUpdate?: (count: number) => void;
}

type PendingAction = 'share' | 'join' | null;

const STORAGE_PREFIX = 'roommate_group_state_';

function generateShareCode(): string {
  return `BRW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

function formatTimestamp(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function RoommateConnector({ address, riskScore, onRoommateUpdate }: RoommateConnectorProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [members, setMembers] = useState<RoommateMember[]>([]);
  const [shareCode, setShareCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [groupBusy, setGroupBusy] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  const storageKey = `${STORAGE_PREFIX}${address}`;

  if (!isFirebaseConfigured) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 lg:p-6 hover-lift">
        <div className="space-y-3 text-sm text-gray-600">
          <h3 className="text-lg font-semibold text-gray-900">My Roommates</h3>
          <p>
            Configure Firebase to enable roommate collaboration. Add your Firebase client keys to
            <code className="mx-1 px-1 py-0.5 bg-gray-100 rounded text-xs">.env.local</code>:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="text-xs">NEXT_PUBLIC_FIREBASE_API_KEY</code></li>
            <li><code className="text-xs">NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</code></li>
            <li><code className="text-xs">NEXT_PUBLIC_FIREBASE_PROJECT_ID</code></li>
            <li><code className="text-xs">NEXT_PUBLIC_FIREBASE_APP_ID</code></li>
          </ul>
          <p>Once set, refresh the page to create share codes and invite roommates.</p>
        </div>
      </div>
    );
  }

  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setDisplayName('');
        setProfileLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as { displayName?: string };
          if (data.displayName) {
            setDisplayName(data.displayName);
            setAuthDisplayName(data.displayName);
          }
        } else if (user.displayName) {
          setDisplayName(user.displayName);
          setAuthDisplayName(user.displayName);
        }
      } catch (error) {
        console.error('Failed to load user profile', error);
        toast.error('Unable to load your roommate profile.');
      } finally {
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as { shareCode?: string };
        if (parsed?.shareCode) {
          setShareCode(parsed.shareCode);
        }
      }
    } catch (error) {
      console.warn('Failed to restore roommate state', error);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!shareCode || !firebaseUser) {
      if (!shareCode) setMembers([]);
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify({ shareCode }));

    const membersRef = collection(db, 'groups', shareCode, 'members');
    const membersQuery = query(membersRef, orderBy('joinedAt', 'asc'));

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const nextMembers: RoommateMember[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          return {
            uid: docSnap.id,
            displayName: data.displayName ?? 'Roommate',
            role: data.role === 'owner' ? 'owner' : 'member',
            joinedAt: data.joinedAt?.toDate?.()?.toISOString?.() ?? data.joinedAt,
            lastActive: data.lastActive?.toDate?.()?.toISOString?.() ?? data.lastActive,
          };
        });

        setMembers(nextMembers);
        setSubscriptionError(null);
        if (onRoommateUpdate) onRoommateUpdate(nextMembers.length);
      },
      (error) => {
        console.error('Roommate subscription error', error);
        setSubscriptionError('Unable to sync roommates. Try rejoining or refreshing.');
      },
    );

    return () => unsubscribe();
  }, [db, firebaseUser, onRoommateUpdate, shareCode, storageKey]);

  useEffect(() => {
    if (!shareCode) {
      localStorage.removeItem(storageKey);
    }
  }, [shareCode, storageKey]);

  const isMember = useMemo(() => {
    if (!firebaseUser || !shareCode) return false;
    return members.some((member) => member.uid === firebaseUser.uid);
  }, [firebaseUser, members, shareCode]);

  const owner = useMemo(
    () => members.find((member) => member.role === 'owner'),
    [members],
  );

  const ensureProfile = (action: PendingAction) => {
    if (groupBusy) return false;
    if (firebaseUser && displayName) return true;
    setPendingAction(action);
    setAuthDisplayName(displayName);
    setAuthModalOpen(true);
    return false;
  };

  const persistGroupMembership = (code?: string) => {
    if (!code) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify({ shareCode: code }));
  };

  const ensureGroup = async (user: User, name: string) => {
    setGroupBusy(true);
    try {
      let candidate = shareCode || generateShareCode();
      let attempts = 0;

      while (attempts < 5) {
        const groupRef = doc(db, 'groups', candidate);
        const snapshot = await getDoc(groupRef);
        if (!snapshot.exists() || snapshot.data()?.ownerUid === user.uid) {
          break;
        }
        candidate = generateShareCode();
        attempts += 1;
      }

      const groupRef = doc(db, 'groups', candidate);
      await setDoc(
        groupRef,
        {
          ownerUid: user.uid,
          ownerDisplayName: name,
          address,
          riskScore,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await setDoc(
        doc(db, 'groups', candidate, 'members', user.uid),
        {
          displayName: name,
          role: 'owner',
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        },
        { merge: true },
      );

      setShareCode(candidate);
      persistGroupMembership(candidate);
      return candidate;
    } catch (error) {
      console.error('Failed to ensure group', error);
      toast.error('Unable to prepare a share code right now.');
      return null;
    } finally {
      setGroupBusy(false);
    }
  };

  const joinGroup = async (user: User, name: string, code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Enter a share code first.');
      return;
    }

    setGroupBusy(true);
    try {
      const groupRef = doc(db, 'groups', trimmed);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        toast.error('Share code not found.');
        return;
      }

      await setDoc(
        doc(db, 'groups', trimmed, 'members', user.uid),
        {
          displayName: name,
          role: groupSnap.data()?.ownerUid === user.uid ? 'owner' : 'member',
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp(),
        },
        { merge: true },
      );

      setShareCode(trimmed);
      setJoinCodeInput('');
      persistGroupMembership(trimmed);
      toast.success('Joined group!');
    } catch (error) {
      console.error('Failed to join group', error);
      toast.error('Unable to join this group right now.');
    } finally {
      setGroupBusy(false);
    }
  };

  const handleShare = async () => {
    if (groupBusy) return;
    if (!ensureProfile('share')) return;

    if (!firebaseUser || !displayName) return;
    const code = await ensureGroup(firebaseUser, displayName);
    if (!code) return;

    const shareText = `Join me in evaluating this property on BullsRentWise!

Address: ${address}
Share Code: ${code}

Open BullsRentWise, tap "Join Group", and enter the code to collaborate.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'BullsRentWise Roommates', text: shareText });
        toast.success('Link shared!');
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('Share text copied to clipboard.');
      }
    } catch {
      await navigator.clipboard.writeText(shareText);
      toast.success('Share text copied to clipboard.');
    }
  };

  const handleJoin = async () => {
    if (groupBusy) return;
    if (!joinCodeInput.trim()) {
      toast.error('Please enter a share code.');
      return;
    }

    if (!ensureProfile('join')) return;
    if (!firebaseUser || !displayName) return;

    await joinGroup(firebaseUser, displayName, joinCodeInput);
  };

  const handleLeave = async () => {
    if (!firebaseUser || !shareCode) return;
    setGroupBusy(true);

    try {
      await deleteDoc(doc(db, 'groups', shareCode, 'members', firebaseUser.uid));
      toast.success('You left the group.');
      setShareCode('');
      setMembers([]);
      persistGroupMembership(undefined);
    } catch (error) {
      console.error('Failed to leave group', error);
      toast.error('Unable to leave the group.');
    } finally {
      setGroupBusy(false);
    }
  };

  const handleAuthSubmit = async () => {
    if (!authDisplayName.trim()) {
      toast.error('Please enter a display name.');
      return;
    }

    setAuthSubmitting(true);
    const action = pendingAction;

    try {
      let user = firebaseUser;
      if (!user) {
        const credential = await signInAnonymously(auth);
        user = credential.user;
        setFirebaseUser(user);
      }

      if (!user) {
        toast.error('Sign-in failed. Please try again.');
        return;
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          displayName: authDisplayName.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setDisplayName(authDisplayName.trim());
      toast.success('Profile saved!');
      setAuthModalOpen(false);
      setPendingAction(null);

      if (action === 'share') {
        await handleShare();
      } else if (action === 'join') {
        await handleJoin();
      }
    } catch (error) {
      console.error('Authentication flow failed', error);
      toast.error('Could not complete sign-in. Try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleAuthCancel = () => {
    setAuthModalOpen(false);
    setPendingAction(null);
  };

  const currentUserMember = useMemo(
    () => members.find((member) => member.uid === firebaseUser?.uid),
    [firebaseUser?.uid, members],
  );

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-5 lg:p-6 hover-lift relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg lg:text-xl font-bold text-gray-900">My Roommates</h3>
            {owner && (
              <p className="text-xs text-gray-500">
                Host: {owner.uid === firebaseUser?.uid ? 'You' : owner.displayName}
              </p>
            )}
          </div>
        </div>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
          {members.length} {members.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Code
            </h4>
            <button
              onClick={handleShare}
              disabled={groupBusy || profileLoading}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {groupBusy && pendingAction === 'share' ? 'Preparing…' : 'Share'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 bg-white border-2 border-blue-200 rounded-xl text-sm font-mono font-semibold text-gray-900">
              {shareCode || 'Tap Share to generate'}
            </code>
            <button
              onClick={async () => {
                if (!shareCode) {
                  toast.error('Generate a share code first.');
                  return;
                }
                await navigator.clipboard.writeText(shareCode);
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
          {!isMember && shareCode && (
            <p className="mt-3 text-xs text-blue-700 bg-blue-100 rounded-lg px-3 py-2">
              Share this code with roommates. You will see everyone here as soon as they join.
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
          <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Join Group
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-200 focus:border-green-500 transition-all bg-white outline-none"
            />
            <button
              onClick={handleJoin}
              disabled={groupBusy}
              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {groupBusy && pendingAction === 'join' ? 'Joining…' : 'Join'}
            </button>
          </div>
          {!firebaseUser && (
            <p className="mt-3 text-xs text-gray-600">
              We only ask you to sign in when you share or join a group. Browsing stays anonymous.
            </p>
          )}
        </div>

        {subscriptionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {subscriptionError}
          </div>
        )}

        {members.length > 0 ? (
          <div className="space-y-3 max-h-52 overflow-y-auto scroll-smooth">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 sticky top-0 bg-white/90 backdrop-blur-sm py-1">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Collaborators ({members.length})
            </h4>
            {members.map((member) => (
              <div
                key={member.uid}
                className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md hover-lift transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-purple-500/20 text-purple-700 font-semibold flex items-center justify-center shrink-0 uppercase">
                    {member.displayName.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {member.uid === firebaseUser?.uid ? 'You' : member.displayName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.role === 'owner' ? 'Host' : 'Member'}
                      {member.lastActive && ` • active ${formatTimestamp(member.lastActive)}`}
                    </div>
                  </div>
                </div>
                {member.uid === firebaseUser?.uid && (
                  <button
                    onClick={handleLeave}
                    disabled={groupBusy}
                    className="ml-3 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Leave
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl px-4 py-6 text-center text-sm text-gray-500">
            Share your code so roommates can collaborate with you.
          </div>
        )}
      </div>

      {shareCode && isMember && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <SharedPropertyList
            shareCode={shareCode}
            currentUserId={firebaseUser?.uid ?? 'anon'}
            currentUserName={displayName || currentUserMember?.displayName || 'You'}
          />
        </div>
      )}

      {authModalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4 z-20">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Let roommates know who you are</h4>
            <p className="text-sm text-gray-600">
              We only need a display name to show in the roommate list.
            </p>
            <input
              type="text"
              value={authDisplayName}
              onChange={(e) => setAuthDisplayName(e.target.value)}
              placeholder="Display name"
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAuthSubmit}
                disabled={authSubmitting}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {authSubmitting ? 'Saving…' : 'Continue'}
              </button>
              <button
                onClick={handleAuthCancel}
                disabled={authSubmitting}
                className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


