'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SharedProperty {
  id: string;
  address: string;
  riskScore: number;
  rent?: number;
  addedBy: string;
  addedAt: string;
  votes: { userId: string; vote: 'yes' | 'no' }[];
  comments: { userId: string; comment: string; date: string }[];
}

interface SharedPropertyListProps {
  shareCode: string;
  currentUserId: string;
}

export default function SharedPropertyList({ shareCode, currentUserId }: SharedPropertyListProps) {
  const [properties, setProperties] = useState<SharedProperty[]>([]);
  const [newComment, setNewComment] = useState<{ propertyId: string; comment: string }>({
    propertyId: '',
    comment: '',
  });

  useEffect(() => {
    // Load shared properties from localStorage
    const saved = localStorage.getItem(`shared_properties_${shareCode}`);
    if (saved) {
      setProperties(JSON.parse(saved));
    }
  }, [shareCode]);

  const handleVote = (propertyId: string, vote: 'yes' | 'no') => {
    const updated = properties.map(prop => {
      if (prop.id === propertyId) {
        const existingVote = prop.votes.find(v => v.userId === currentUserId);
        const newVotes = existingVote
          ? prop.votes.map(v => v.userId === currentUserId ? { ...v, vote } : v)
          : [...prop.votes, { userId: currentUserId, vote }];
        return { ...prop, votes: newVotes };
      }
      return prop;
    });
    setProperties(updated);
    saveProperties(updated);
    toast.success(`Voted ${vote === 'yes' ? '👍' : '👎'}`);
  };

  const handleAddComment = (propertyId: string) => {
    if (!newComment.comment.trim()) return;

    const updated = properties.map(prop => {
      if (prop.id === propertyId) {
        return {
          ...prop,
          comments: [
            ...prop.comments,
            {
              userId: currentUserId,
              comment: newComment.comment,
              date: new Date().toISOString(),
            },
          ],
        };
      }
      return prop;
    });
    setProperties(updated);
    saveProperties(updated);
    setNewComment({ propertyId: '', comment: '' });
    toast.success('Comment added!');
  };

  const saveProperties = (props: SharedProperty[]) => {
    localStorage.setItem(`shared_properties_${shareCode}`, JSON.stringify(props));
  };

  const yesVotes = (property: SharedProperty) => property.votes.filter(v => v.vote === 'yes').length;
  const noVotes = (property: SharedProperty) => property.votes.filter(v => v.vote === 'no').length;

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">📋 Shared Property List</h3>
        <p className="text-gray-500 text-sm">
          No properties shared yet. Add properties to collaborate with roommates!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Shared Property List</h3>
      
      <div className="space-y-4">
        {properties.map((property) => {
          const riskColor = property.riskScore < 30 ? 'text-green-600' : 
                           property.riskScore < 60 ? 'text-yellow-600' : 'text-red-600';
          const yesCount = yesVotes(property);
          const noCount = noVotes(property);
          const totalVotes = yesCount + noCount;
          const approvalRate = totalVotes > 0 ? (yesCount / totalVotes) * 100 : 0;

          return (
            <div key={property.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{property.address}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-sm font-semibold ${riskColor}`}>
                      Risk: {property.riskScore}/100
                    </span>
                    {property.rent && (
                      <span className="text-sm text-gray-600">
                        Rent: ${property.rent.toFixed(0)}/mo
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Added by</div>
                  <div className="text-sm font-medium">{property.addedBy}</div>
                </div>
              </div>

              {/* Voting */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4 mb-2">
                  <button
                    onClick={() => handleVote(property.id, 'yes')}
                    className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 text-sm"
                  >
                    👍 Yes ({yesCount})
                  </button>
                  <button
                    onClick={() => handleVote(property.id, 'no')}
                    className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm"
                  >
                    👎 No ({noCount})
                  </button>
                  {totalVotes > 0 && (
                    <div className="ml-auto text-xs text-gray-600">
                      {approvalRate.toFixed(0)}% approval
                    </div>
                  )}
                </div>
              </div>

              {/* Comments */}
              {property.comments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-900 mb-2">Comments</h5>
                  <div className="space-y-2">
                    {property.comments.map((comment, idx) => (
                      <div key={idx} className="text-sm bg-gray-50 rounded p-2">
                        <div className="font-medium text-gray-900">{comment.userId}</div>
                        <div className="text-gray-700">{comment.comment}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(comment.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Comment */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment.propertyId === property.id ? newComment.comment : ''}
                    onChange={(e) => setNewComment({ propertyId: property.id, comment: e.target.value })}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddComment(property.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(property.id)}
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
    </div>
  );
}

