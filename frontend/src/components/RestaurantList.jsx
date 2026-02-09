import { memo } from 'react';
import { Star, MapPin, DollarSign, SearchX, Heart } from 'lucide-react';

function RestaurantList({ restaurants, selectedId, onSelect, votes = {}, onVote, currentUserId }) {
  // Handle keyboard navigation
  const handleKeyDown = (e, restaurantId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(restaurantId);
    }
  };

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
        {restaurants.map((restaurant, index) => {
          // --- VOTING LOGIC ---
          // Get the list of user IDs who voted for this restaurant
          // We use the googlePlaceId as the key for voting because it's unique globally
          const voters = votes[restaurant.googlePlaceId] || [];
          const voteCount = voters.length;
          
          // Check if *I* voted (so we can color the heart red)
          const isVoted = currentUserId && voters.includes(currentUserId);

          return (
            <div
              key={restaurant.id}
              role="option"
              aria-selected={selectedId === restaurant.id}
              tabIndex={0}
              className={`restaurant-item ${selectedId === restaurant.id ? 'selected' : ''}`}
              onClick={() => onSelect(restaurant.id)}
              onKeyDown={(e) => handleKeyDown(e, restaurant.id)}
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

              {/* --- VOTE BUTTON --- */}
              <button 
                className={`vote-btn ${isVoted ? 'voted' : ''}`}
                onClick={(e) => {
                  e.stopPropagation(); // Stop clicking the card when clicking the heart
                  onVote(restaurant.googlePlaceId);
                }}
                title={isVoted ? "Remove vote" : "Vote for this place"}
              >
                <Heart 
                  size={20} 
                  fill={isVoted ? "#e11d48" : "none"} // Filled if voted
                  color={isVoted ? "#e11d48" : "#9ca3af"} // Red outline if voted, gray if not
                />
                {voteCount > 0 && <span className="vote-count">{voteCount}</span>}
              </button>
              {/* ------------------- */}

              <div className="item-score">{restaurant.score}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(RestaurantList);