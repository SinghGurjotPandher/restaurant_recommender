import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { UtensilsCrossed, Search, AlertCircle, MapPin, Users } from 'lucide-react';
import PreferenceForm from './components/PreferenceForm';
import GroupPanel from './components/GroupPanel';
import RestaurantList from './components/RestaurantList';
import RestaurantMap from './components/RestaurantMap';

// Default center (UCI campus)
const DEFAULT_CENTER = { lat: 33.6405, lng: -117.8443 };

function App() {
  // Group state
  const [users, setUsers] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  // Results state
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Location state
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | success | error

  // Add user to group - useCallback for stable reference
  const handleAddUser = useCallback((userData) => {
    setUsers((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...userData,
      },
    ]);
    setError(null);
  }, []);

  // Remove user from group
  const handleRemoveUser = useCallback((userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  // Get user location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocationStatus('success');
      },
      () => {
        setLocationStatus('error');
      }
    );
  }, []);

  // Fetch recommendations from API
  const handleSearch = useCallback(async () => {
    // Validation - early return pattern
    if (users.length === 0) {
      setError('Add at least one person to your group');
      return;
    }

    const searchLocation = location || DEFAULT_CENTER;
    
    setLoading(true);
    setError(null);
    setRecommendations([]);
    setSelectedRestaurant(null);

    try {
      const response = await axios.post('/api/recommendations', {
        users,
        location: searchLocation,
        radius: 2000,
      });
      
      setRecommendations(response.data.recommendations || []);
      
      if (response.data.recommendations?.length === 0) {
        setError('No restaurants found matching your group preferences');
      }
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to get recommendations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [users, location]);

  // Map center - memoized to prevent unnecessary recalcs
  const mapCenter = useMemo(() => {
    if (recommendations.length > 0) {
      return {
        lat: recommendations[0].location.lat,
        lng: recommendations[0].location.lng,
      };
    }
    return location || DEFAULT_CENTER;
  }, [recommendations, location]);

  // Check if search is possible
  const canSearch = users.length > 0 && !loading;

  return (
    <div className="app">
      {/* Header */}
      <header className="hero">
        <div className="hero-content">
          <div className="logo">
            <div className="logo-mark">
              <UtensilsCrossed strokeWidth={2.5} />
            </div>
            <h1>Dev<span>Dinners</span></h1>
          </div>
          <span className="tagline">Group Restaurant Finder</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Left Panel - Input */}
        <section className="input-panel">
          <div className="panel-header">
            <h2>Build Your Group</h2>
            <p>Add each person's food preferences, then find restaurants everyone will love.</p>
          </div>

          {/* Preference Form */}
          <PreferenceForm
            onAddUser={handleAddUser}
            location={location}
            locationStatus={locationStatus}
            onRequestLocation={requestLocation}
          />

          {/* Group Members */}
          {users.length > 0 && (
            <GroupPanel users={users} onRemoveUser={handleRemoveUser} />
          )}

          {/* Search Button */}
          <button
            className="search-btn"
            onClick={handleSearch}
            disabled={!canSearch}
            type="button"
          >
            {loading ? (
              <div className="spinner" />
            ) : (
              <>
                <Search strokeWidth={2.5} />
                <span>Find Restaurants</span>
              </>
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="error-toast">
              <AlertCircle />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Right Panel - Results */}
        <section className="results-panel">
          {/* Map */}
          <div className="map-container">
            {recommendations.length > 0 ? (
              <RestaurantMap
                restaurants={recommendations}
                center={mapCenter}
                selectedId={selectedRestaurant}
                onSelectRestaurant={setSelectedRestaurant}
              />
            ) : (
              <div className="map-empty">
                <div className="map-empty-icon">
                  {users.length === 0 ? <Users /> : <MapPin />}
                </div>
                <h3>
                  {users.length === 0 
                    ? 'Start Building Your Group' 
                    : 'Ready to Search'}
                </h3>
                <p>
                  {users.length === 0
                    ? 'Add people and their preferences to find the perfect restaurant for everyone.'
                    : `${users.length} ${users.length === 1 ? 'person' : 'people'} in your group. Click "Find Restaurants" to see recommendations.`}
                </p>
              </div>
            )}
          </div>

          {/* Restaurant List */}
          {recommendations.length > 0 && (
            <RestaurantList
              restaurants={recommendations}
              selectedId={selectedRestaurant}
              onSelect={setSelectedRestaurant}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <strong>DevDinners</strong> — CS178 Project by Nathan Tran, David Deng, Gurjot Singh Pandher
        </div>
        <div className="footer-note">
          Powered by Google Places API
        </div>
      </footer>
    </div>
  );
}

export default App;
