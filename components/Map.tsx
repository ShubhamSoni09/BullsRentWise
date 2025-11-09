'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface MapProps {
  lat: number;
  lng: number;
  address: string;
  complaints: any[];
  crimes?: any[];
}

export default function Map({ lat, lng, address, complaints, crimes = [] }: MapProps) {
  // Create custom icons for different crime severities
  const createCrimeIcon = (severity: number) => {
    let color = 'gray';
    if (severity >= 5) {
      color = 'red';
    } else if (severity >= 3) {
      color = 'orange';
    } else if (severity >= 2) {
      color = 'yellow';
    } else {
      color = 'blue';
    }

    const htmlString = '<div style="background-color: ' + color + '; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>';

    return L.divIcon({
      className: 'custom-marker',
      html: htmlString,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
  };

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[lat, lng]}>
        <Popup>{address}</Popup>
      </Marker>
      <Circle
        center={[lat, lng]}
        radius={400}
        pathOptions={{ color: 'blue', fillOpacity: 0.1 }}
      />
      {complaints.map((complaint, idx) => (
        <Marker
          key={`complaint-${idx}`}
          position={[complaint.lat || lat, complaint.lng || lng]}
        >
          <Popup>
            <div>
              <strong>🔧 {complaint.type || 'Complaint'}</strong>
              <br />
              {complaint.description || 'No description'}
              <br />
              <small>{complaint.date || 'Date unknown'}</small>
            </div>
          </Popup>
        </Marker>
      ))}
      {crimes.map((crime, idx) => (
        <Marker
          key={`crime-${idx}`}
          position={[crime.lat, crime.lng]}
          icon={createCrimeIcon(crime.severity)}
        >
          <Popup>
            <div>
              <strong>🚨 {crime.type || 'Crime'}</strong>
              <br />
              <span className={crime.severity >= 5 ? 'text-red-600' : crime.severity >= 3 ? 'text-orange-600' : 'text-blue-600'}>
                {crime.category}
              </span>
              <br />
              {crime.description || 'No description'}
              <br />
              <small>{crime.date || 'Date unknown'}</small>
              {crime.distance && (
                <>
                  <br />
                  <small className="text-gray-500">{crime.distance}m away</small>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

