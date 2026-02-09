import { useEffect, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Star, DollarSign, Clock, Globe } from 'lucide-react';

// Custom numbered marker icon factory - memoized
const createMarkerIcon = (number, isSelected) => {
  const bgColor = isSelected ? '#E8A838' : '#C4552D';
  const textColor = isSelected ? '#1C1917' : '#FFFFFF';
  
  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: `
      <div class="custom-marker ${isSelected ? 'selected' : ''}" 
           style="background:${bgColor}; color:${textColor};">
        ${number}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// Map controller component for programmatic view changes
// Map controller to fit all markers
function MapController({ center, restaurants }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    if (restaurants.length > 0) {
      // 1. Create bounds that include all restaurant locations
      const bounds = L.latLngBounds(restaurants.map(r => [r.location.lat, r.location.lng]));
      
      // 2. Also include the user center/home base
      bounds.extend([center.lat, center.lng]);

      // 3. Fly to fit those bounds (with some padding)
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    } else {
      // Fallback: If no restaurants, just go to center
      map.flyTo([center.lat, center.lng], 14, { duration: 0.8 });
    }
  }, [map, center, restaurants]);
  
  return null;
}

// Individual marker component - memoized
const RestaurantMarker = memo(function RestaurantMarker({ 
  restaurant, 
  index, 
  isSelected, 
  onSelect 
}) {
  const icon = useMemo(
    () => createMarkerIcon(index + 1, isSelected),
    [index, isSelected]
  );

  return (
    <Marker
      position={[restaurant.location.lat, restaurant.location.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(restaurant.id),
      }}
    >
      <Popup>
        <div className="popup-content">
          <div className="popup-header">
            <div className="popup-rank">{index + 1}</div>
            <div>
              <div className="popup-title">{restaurant.name}</div>
              <div className="popup-cuisine">{restaurant.cuisine || 'Restaurant'}</div>
            </div>
          </div>

          <div className="popup-details">
            <div className="popup-detail">
              <Star size={14} />
              <span>{restaurant.rating?.toFixed(1) || 'N/A'} rating</span>
            </div>
            <div className="popup-detail">
              <DollarSign size={14} />
              <span>{'$'.repeat(restaurant.priceLevel || 2)} price</span>
            </div>
            {restaurant.openNow !== undefined && (
              <div className="popup-detail">
                <Clock size={14} />
                <span>{restaurant.openNow ? 'Open now' : 'Closed'}</span>
              </div>
            )}
            {restaurant.website && (
              <div className="popup-detail">
                <Globe size={14} />
                <span>Website available</span>
              </div>
            )}
          </div>

          <div className="popup-score">
            <span className="popup-score-label">Group Score</span>
            <span className="popup-score-value">{restaurant.score}</span>
          </div>

          {restaurant.reason && (
            <div className="popup-reason">{restaurant.reason}</div>
          )}

          {restaurant.website && (
            <a
              href={restaurant.website}
              target="_blank"
              rel="noopener noreferrer"
              className="popup-website"
            >
              Visit Website
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

function RestaurantMap({ restaurants, center, selectedId, onSelectRestaurant }) {
  // Memoize initial center to prevent map recreation
  const initialCenter = useMemo(
    () => [center.lat, center.lng],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only use initial value
  );

  return (
    <MapContainer
      center={initialCenter}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapController center={center} restaurants={restaurants} />
      
      {restaurants.map((restaurant, index) => (
        <RestaurantMarker
          key={restaurant.id}
          restaurant={restaurant}
          index={index}
          isSelected={selectedId === restaurant.id}
          onSelect={onSelectRestaurant}
        />
      ))}
    </MapContainer>
  );
}

export default memo(RestaurantMap);
