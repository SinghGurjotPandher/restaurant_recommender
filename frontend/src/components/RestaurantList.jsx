import { memo, useCallback } from 'react';
import { Star, MapPin, DollarSign, SearchX } from 'lucide-react';

function RestaurantList({ restaurants, selectedId, onSelect }) {
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e, restaurant) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(restaurant.id);
    }
  }, [onSelect]);

  // Empty state
  if (restaurants.length === 0) {
    return (
      <div className="no-results">
        <SearchX />
        <h3>No Restaurants Found</h3>
        <p>Try adjusting your group's preferences or search in a different area.</p>
      </div>
    );
  }

  return (
    <div className="restaurant-list">
      <div className="list-header">
        <h3>Top Picks</h3>
        <span className="results-count">{restaurants.length} results</span>
      </div>

      <div className="restaurant-items" role="listbox" aria-label="Restaurant recommendations">
        {restaurants.map((restaurant, index) => (
          <div
            key={restaurant.id}
            role="option"
            aria-selected={selectedId === restaurant.id}
            tabIndex={0}
            className={`restaurant-item ${selectedId === restaurant.id ? 'selected' : ''}`}
            onClick={() => onSelect(restaurant.id)}
            onKeyDown={(e) => handleKeyDown(e, restaurant)}
          >
            <div className="item-rank">{index + 1}</div>
            <div className="item-info">
              <div className="item-name">{restaurant.name}</div>
              <div className="item-meta">
                <span>
                  <Star size={12} />
                  {restaurant.rating?.toFixed(1) || 'N/A'}
                </span>
                <span>
                  <DollarSign size={12} />
                  {'$'.repeat(restaurant.priceLevel || 2)}
                </span>
                <span>
                  <MapPin size={12} />
                  {restaurant.cuisine || 'Restaurant'}
                </span>
              </div>
            </div>
            <div className="item-score">{restaurant.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(RestaurantList);
