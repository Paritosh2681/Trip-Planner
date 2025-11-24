import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Trip, Activity } from '../types';
import { Loader2 } from 'lucide-react';

// Fix for default leaflet marker icon missing in standard builds
// We use CDN URLs instead of importing assets directly to avoid bundler issues in this environment
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapProps {
  trip: Trip;
  activeActivityId: string | null;
  onMarkerClick: (id: string) => void;
}

// Component to handle map movement/zoom
const MapController: React.FC<{ activities: Activity[], activeId: string | null }> = ({ activities, activeId }) => {
  const map = useMap();

  useEffect(() => {
    if (activities.length === 0) return;

    // Calculate bounds to fit all markers
    const bounds = L.latLngBounds(activities.map(a => [a.coordinates.lat, a.coordinates.lng]));
    
    if (activeId) {
      const active = activities.find(a => a.id === activeId);
      if (active) {
        map.flyTo([active.coordinates.lat, active.coordinates.lng], 15, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    } else {
       map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [activities, activeId, map]);

  return null;
};

const CustomMarker: React.FC<{ activity: Activity; isActive: boolean; onClick: () => void }> = ({ activity, isActive, onClick }) => {
  const divIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="marker-pin ${isActive ? 'active' : ''}"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  const markerRef = useRef<L.Marker>(null);

  return (
    <Marker 
      ref={markerRef}
      position={[activity.coordinates.lat, activity.coordinates.lng]} 
      icon={divIcon}
      eventHandlers={{ 
        click: () => {
          onClick();
          // Open popup when marker is clicked
          if (markerRef.current) {
            markerRef.current.openPopup();
          }
        }
      }}
    >
      <Popup className="sharp-popup">
        <div className="font-sans text-sm p-1">
          <strong className="block uppercase tracking-wide text-xs mb-1">{activity.time}</strong>
          <h3 className="font-bold text-base">{activity.title}</h3>
        </div>
      </Popup>
    </Marker>
  );
};

const TripMap: React.FC<MapProps> = ({ trip, activeActivityId, onMarkerClick }) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const allActivities = trip.schedule.flatMap(day => day.activities);

  // Default center (will be overridden by MapController)
  const center = allActivities.length > 0 
    ? { lat: allActivities[0].coordinates.lat, lng: allActivities[0].coordinates.lng } 
    : { lat: 51.505, lng: -0.09 };

  return (
    <div className="h-full w-full bg-[#f4f4f4] relative z-0">
      {/* Loading indicator */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 z-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-neutral-400" />
            <p className="text-xs text-neutral-500 uppercase tracking-widest">Loading Map</p>
          </div>
        </div>
      )}
      
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        preferCanvas={true}
        whenReady={() => {
          // Set a small delay to ensure tiles are loaded
          setTimeout(() => setIsMapLoaded(true), 300);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          updateWhenIdle={false}
          updateWhenZooming={false}
          keepBuffer={2}
        />
        <MapController activities={allActivities} activeId={activeActivityId} />
        
        {allActivities.map(activity => (
          <CustomMarker 
            key={activity.id} 
            activity={activity} 
            isActive={activity.id === activeActivityId}
            onClick={() => onMarkerClick(activity.id)}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default TripMap;