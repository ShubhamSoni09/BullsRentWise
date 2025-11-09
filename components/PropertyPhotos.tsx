'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface Photo {
  id: string;
  url: string;
  caption: string;
  date: string;
  source?: string;
  width?: number;
  height?: number;
}

interface PropertyPhotosProps {
  address: string;
  lat: number;
  lng: number;
}

export default function PropertyPhotos({ address, lat, lng }: PropertyPhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [placeName, setPlaceName] = useState<string>('');
  const [missingApiKey, setMissingApiKey] = useState(false);
  const [usedStreetViewFallback, setUsedStreetViewFallback] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hasShownToastRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const originalOverflow = document.body.style.overflow;
    if (selectedPhoto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedPhoto, isMounted]);

  useEffect(() => {
    hasShownToastRef.current = false; // Reset when address/location changes
    fetchPhotos();
  }, [address, lat, lng]);

  const fetchPhotos = async () => {
    setLoading(true);
    setMissingApiKey(false);
    setUsedStreetViewFallback(false);
    try {
      const response = await fetch('/api/places/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, lat, lng }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }

      const data = await response.json();

      if (data.missingApiKey) {
        setMissingApiKey(true);
        setPhotos([]);
        setPlaceName(address);
        toast.error('Set GOOGLE_API_KEY in your .env.local to enable property photos');
        return;
      }

      setPhotos(data.photos || []);
      setPlaceName(data.placeName || address);
      setUsedStreetViewFallback(Boolean(data.streetViewFallback));
      
      // Only show toast once per fetch
      if (!hasShownToastRef.current) {
        if (data.photos && data.photos.length > 0) {
          if (data.streetViewFallback) {
            toast.success('Showing Google Street View preview for this address');
          } else {
            toast.success(`Found ${data.photos.length} photo${data.photos.length > 1 ? 's' : ''} from Google Places`);
          }
        } else {
          toast.info('No photos found for this location');
        }
        hasShownToastRef.current = true;
      }
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to load photos');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const openPhotoViewer = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const closePhotoViewer = () => {
    setSelectedPhoto(null);
  };

  const modal = selectedPhoto && isMounted
    ? createPortal(
        <div
          className="fixed inset-0 bg-black/90 z-[1000] flex items-center justify-center p-4"
          onClick={closePhotoViewer}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closePhotoViewer}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full z-10 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || 'Property photo'}
              className="w-full h-full object-contain rounded-lg bg-black"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
              }}
            />
            {selectedPhoto.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4 rounded-b-lg">
                <p className="font-medium mb-1">{selectedPhoto.caption}</p>
                <p className="text-xs text-gray-300">Source: {selectedPhoto.source === 'google_street_view' ? 'Google Street View' : 'Google Places'}</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Property Photos</h3>
          {placeName && placeName !== address && (
            <p className="text-sm text-gray-600 mt-1">📍 {placeName}</p>
          )}
        </div>
        <button
          onClick={fetchPhotos}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
            <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600 text-sm font-medium">Loading photos from Google Places...</p>
        </div>
      )}

      {!loading && usedStreetViewFallback && photos.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m0 14v2m4-5l4 4m0 0l4-4m-4 4V11" />
          </svg>
          Showing Google Street View preview because dedicated property photos were not available.
        </div>
      )}

      {!loading && photos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm font-medium">No photos available</p>
          {missingApiKey ? (
            <p className="text-amber-600 text-xs mt-2 font-medium max-w-xs mx-auto">
              Add <code className="font-mono">GOOGLE_API_KEY</code> to your <code className="font-mono">.env.local</code> file to enable Google Places and Street View photos.
            </p>
          ) : (
            <>
              <p className="text-gray-400 text-xs mt-1">
                Photos from Google Places or Street View will appear here when available
              </p>
              <p className="text-gray-400 text-xs mt-2">
                Try refining the address or clicking refresh
              </p>
            </>
          )}
        </div>
      )}

      {!loading && photos.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-pink-400 transition-all shadow-md hover:shadow-xl hover-lift"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Property photo'}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => openPhotoViewer(photo)}
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <button
                      onClick={() => openPhotoViewer(photo)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/90 rounded-full hover:bg-white transition-all"
                    >
                      <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                  </div>
                  {photo.source === 'google_places' && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      Google Places
                    </div>
                  )}
                  {photo.source === 'google_street_view' && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                      </svg>
                      Street View
                    </div>
                  )}
                </div>
                {photo.caption && (
                  <div className="p-2">
                    <p className="text-xs text-gray-600 line-clamp-2">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Photo count */}
          <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <span className="font-medium">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} from Google Places
            </span>
            <span className="text-xs text-gray-500">
              Click photos to view full size
            </span>
          </div>
        </>
      )}

      {/* Full-size Photo Viewer Modal */}
      {modal}
    </div>
  );
}
