'use client';

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebaseClient';

type VoteMap = Record<string, 'yes' | 'no'>;

interface SharedComment {
  userId: string;
  userName: string;
  comment: string;
  date?: string;
}

interface SharedProperty {
  id: string;
  address: string;
  riskScore: number;
  rent?: number;
  addedByUid?: string;
  addedByName?: string;
  addedAt?: string;
  votes: VoteMap;
  comments: SharedComment[];
}

interface SharedPropertyListProps {
  shareCode: string;
  currentUserId: string;
  currentUserName: string;
}

function toIso(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value?.toDate) {
    const date = value.toDate();
    return date instanceof Date ? date.toISOString() : undefined;
  }
  if (value instanceof Date) return value.toISOString();
  return undefined;
}

export default function SharedPropertyList({ shareCode, currentUserId, currentUserName }: SharedPropertyListProps) {
  const db = getFirebaseDb();
  const [properties, setProperties] = useState<SharedProperty[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareCode) return;

    const propertiesRef = collection(db, 'groups', shareCode, 'properties');
    const propertiesQuery = query(propertiesRef, orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(
      propertiesQuery,
      (snapshot) => {
        const next: SharedProperty[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          const votes: VoteMap = data.votes ?? {};
          const comments: SharedComment[] = Array.isArray(data.comments)
            ? data.comments.map((comment: any) => ({
                userId: comment?.userId ?? 'roommate',
                userName: comment?.userName ?? comment?.userId ?? 'Roommate',
                comment: comment?.comment ?? '',
                date: toIso(comment?.date),
              }))
            : [];

          return {
            id: docSnap.id,
            address: data.address ?? 'Shared property',
            riskScore: typeof data.riskScore === 'number' ? data.riskScore : 0,
            rent: typeof data.rent === 'number' ? data.rent : undefined,
            addedByUid: data.addedByUid,
            addedByName: data.addedByName ?? data.addedByUid ?? 'Roommate',
            addedAt: toIso(data.addedAt),
            votes,
            comments,
          };
        });

        setProperties(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Failed to subscribe to shared properties', err);
        setLoading(false);
        setError('Unable to load shared properties. Check your permissions or rejoin the group.');
      },
    );

    return () => unsubscribe();
  }, [db, shareCode]);

  const approvalStats = useMemo(() => {
    return properties.reduce<Record<string, { yes: number; no: number; approval: number }>>((acc, property) => {
      const yesVotes = Object.values(property.votes).filter((vote) => vote === 'yes').length;
      const noVotes = Object.values(property.votes).filter((vote) => vote === 'no').length;
      const total = yesVotes + noVotes;
      acc[property.id] = {
        yes: yesVotes,
        no: noVotes,
        approval: total > 0 ? (yesVotes / total) * 100 : 0,
      };
      return acc;
    }, {});
  }, [properties]);

  const handleVote = async (propertyId: string, vote: 'yes' | 'no') => {
    try {
      await setDoc(
        doc(db, 'groups', shareCode, 'properties', propertyId),
        {
          votes: {
            [currentUserId]: vote,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      console.error('Failed to record vote', err);
      toast.error('Unable to record your vote. Try again.');
    }
  };

  const handleCommentSubmit = async (propertyId: string) => {
    const draft = commentDrafts[propertyId]?.trim();
    if (!draft) return;

    try {
      await setDoc(
        doc(db, 'groups', shareCode, 'properties', propertyId),
        {
          comments: arrayUnion({
            userId: currentUserId,
            userName: currentUserName,
            comment: draft,
            date: serverTimestamp(),
          }),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setCommentDrafts((prev) => ({ ...prev, [propertyId]: '' }));
      toast.success('Comment added!');
    } catch (err) {
      console.error('Failed to add comment', err);
      toast.error('Unable to post comment right now.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-3 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-24 bg-gray-100 rounded" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-6 text-sm">
        {error}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">📋 Shared Property List</h3>
        <p className="text-gray-500 text-sm">
          No properties shared yet. Save a property from the results to collaborate with your roommates.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-900">📋 Shared Property List</h3>

      {properties.map((property) => {
        const stats = approvalStats[property.id] ?? { yes: 0, no: 0, approval: 0 };
        const riskColor =
          property.riskScore < 30 ? 'text-green-600' : property.riskScore < 60 ? 'text-yellow-600' : 'text-red-600';

        return (
          <div key={property.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{property.address}</h4>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                  <span className={`font-semibold ${riskColor}`}>Risk: {property.riskScore}/100</span>
                  {typeof property.rent === 'number' && <span>Rent: ${property.rent.toFixed(0)}/mo</span>}
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>Added by</div>
                <div className="font-medium text-gray-800">
                  {property.addedByUid === currentUserId ? 'You' : property.addedByName}
                </div>
                {property.addedAt && (
                  <div>{new Date(property.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleVote(property.id, 'yes')}
                  className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 text-sm"
                >
                  👍 Yes ({stats.yes})
                </button>
                <button
                  onClick={() => handleVote(property.id, 'no')}
                  className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm"
                >
                  👎 No ({stats.no})
                </button>
                {stats.yes + stats.no > 0 && (
                  <div className="ml-auto text-xs text-gray-600">{stats.approval.toFixed(0)}% approval</div>
                )}
              </div>
            </div>

            {property.comments.length > 0 && (
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <h5 className="text-sm font-semibold text-gray-900">Comments</h5>
                {property.comments.map((comment, index) => (
                  <div key={`${comment.userId}-${index}`} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">
                      {comment.userId === currentUserId ? 'You' : comment.userName}
                    </div>
                    <div>{comment.comment}</div>
                    {comment.date && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(comment.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentDrafts[property.id] ?? ''}
                  onChange={(event) =>
                    setCommentDrafts((prev) => ({ ...prev, [property.id]: event.target.value }))
                  }
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleCommentSubmit(property.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleCommentSubmit(property.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


