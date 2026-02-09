import { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { UtensilsCrossed, Search, AlertCircle, MapPin, Users, Copy } from 'lucide-react';
import PreferenceForm from './components/PreferenceForm';
import GroupPanel from './components/GroupPanel';
import RestaurantList from './components/RestaurantList';
import RestaurantMap from './components/RestaurantMap';
import Lobby from './components/Lobby';
import socket from './socket';

const DEFAULT_CENTER = { lat: 33.6405, lng: -117.8443 };

function App() {
  // Session State
  const [sessionCode, setSessionCode] = useState(null);

  // Group state
  const [users, setUsers] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  // Results state
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Location & Filter state
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [radius, setRadius] = useState(2000);
  const [radiusChanged, setRadiusChanged] = useState(false);
  const [editingData, setEditingData] = useState(null);

  // Voting
  const [votes, setVotes] = useState({});

  // --- SOCKET.IO EFFECTS ---
  useEffect(() => {
    socket.on('session_created', (code) => {
      setSessionCode(code);
      setUsers([]);
    });

    socket.on('user_list_updated', (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on('results_updated', (incomingResults) => {
        setRecommendations(incomingResults);
        setLoading(false); 
    });

    socket.on('error', (msg) => {
      setError(msg);
      setTimeout(() => setError(null), 3000);
    });

    socket.on('votes_updated', (updatedVotes) => {
        setVotes(updatedVotes);
    });

    return () => {
      socket.off('session_created');
      socket.off('user_list_updated');
      socket.off('results_updated');
      socket.off('votes_updated');
      socket.off('error');
    };
  }, []);

  // --- HANDLERS ---
  const handleCreateSession = () => {
    socket.emit('create_session');
  };

  const handleJoinSession = (code) => {
    setSessionCode(code);
    setUsers([]);
  };

  const handleAddUser = useCallback((userData) => {
    if (sessionCode) {
      const userPayload = { 
        code: sessionCode, 
        user: { ...userData, id: socket.id }
      };
      
      if (editingData) {
         socket.emit('update_user', userPayload);
      } else {
         socket.emit('join_session', userPayload);
      }
    } else {
      setUsers((prev) => [...prev, { id: Date.now(), ...userData }]);
    }
    
    setEditingData(null);
    setError(null);
  }, [sessionCode, users, editingData]);

  const handleEditUser = useCallback((user) => {
    if (sessionCode && user.id !== socket.id) {
        alert("You can only edit your own preferences in multiplayer mode!");
        return;
    }
    setEditingData(user);
  }, [sessionCode]);

  const handleRemoveUser = useCallback((userId) => {
    if (sessionCode) {
       if (userId !== socket.id) {
           alert("You can only remove yourself!");
           return;
       }
       socket.emit('leave_session', { code: sessionCode, userId });
       setSessionCode(null);
    } else {
       setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  }, [sessionCode]);

  const handleVote = useCallback((restaurantId) => {
    if (sessionCode) {
        socket.emit('toggle_vote', {
            code: sessionCode,
            restaurantId: restaurantId,
            userId: socket.id
        });
    } else {
        // Local mode fallback
        setVotes(prev => {
           const currentVoters = prev[restaurantId] || [];
           const hasVoted = currentVoters.includes('local-user');
           return {
               ...prev,
               [restaurantId]: hasVoted 
                 ? currentVoters.filter(id => id !== 'local-user')
                 : [...currentVoters, 'local-user']
           };
        });
    }
  }, [sessionCode]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('success');
      },
      () => setLocationStatus('error')
    );
  }, []);

  const handleSearch = useCallback(async () => {
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
      const response = await axios.post('http://localhost:3000/api/recommendations', {
        users,
        location: searchLocation,
        radius: radius,
        forceRefresh: radiusChanged
      });

      const newRecommendations = response.data.recommendations || [];
      setRecommendations(newRecommendations);

      if (sessionCode) {
        socket.emit('sync_results', {
            code: sessionCode,
            recommendations: newRecommendations
        });
      }

      if (response.data.recommendations?.length === 0) {
        setError('No restaurants found matching your group preferences');
      }
      setRadiusChanged(false);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to get recommendations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [users, location, radius, radiusChanged, sessionCode]);

  const mapCenter = useMemo(() => {
    if (recommendations.length > 0) {
      return { lat: recommendations[0].location.lat, lng: recommendations[0].location.lng };
    }
    return location || DEFAULT_CENTER;
  }, [recommendations, location]);

  const canSearch = users.length > 0 && !loading;

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <div className="logo">
            <div className="logo-mark"><UtensilsCrossed strokeWidth={2.5} /></div>
            <h1>Dev<span>Dinners</span></h1>
          </div>
          <span className="tagline">Real-Time Group Dining</span>
        </div>
      </header>

      <main className="main-content">
        
        {/* VIEW 1: LOBBY (If no session) */}
        {!sessionCode ? (
           <Lobby 
             onCreateSession={handleCreateSession}
             onJoinSession={handleJoinSession}
           />
        ) : (
        /* VIEW 2: APP (If in session) */
        <>
          <section className="input-panel">
            <div className="panel-header">
              {/* Show Session Code */}
              <div className="session-badge" onClick={() => navigator.clipboard.writeText(sessionCode)} style={{cursor: 'pointer'}}>
                <Users size={16} />
                <span>Group Code: <strong>{sessionCode}</strong></span>
                <Copy size={12} style={{opacity: 0.5}}/>
              </div>

              <h2>Add Your Preferences</h2>
              <p>Enter your food choices to join the group.</p>
            </div>

            <PreferenceForm
              onAddUser={handleAddUser}
              location={location}
              locationStatus={locationStatus}
              onRequestLocation={requestLocation}
              editData={editingData}
            />

            {users.length > 0 && (
              <GroupPanel 
                users={users} 
                onRemoveUser={handleRemoveUser} 
                onEditUser={handleEditUser}
              />
            )}

            {/* Radius Slider */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3>Search Distance</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <input 
                  type="range" min="1000" max="50000" step="500" 
                  value={radius}
                  onChange={(e) => { setRadius(Number(e.target.value)); setRadiusChanged(true); }}
                  style={{ flex: 1 }}
                />
                <span style={{ fontWeight: 'bold', minWidth: '80px' }}>
                  {(radius / 1609.34).toFixed(1)} miles
                </span>
              </div>
            </div>

            <button
              className="search-btn"
              onClick={handleSearch}
              disabled={!canSearch}
            >
              {loading ? <div className="spinner" /> : <><Search strokeWidth={2.5} /><span>Find Restaurants</span></>}
            </button>

            {error && (
              <div className="error-toast">
                <AlertCircle />
                <span>{error}</span>
              </div>
            )}
          </section>

          <section className="results-panel">
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
                    <Users />
                  </div>
                  <h3>Waiting for Group</h3>
                  <p>
                    Share code <strong>{sessionCode}</strong> with friends.<br/>
                    Currently {users.length} {users.length === 1 ? 'person' : 'people'} joined.
                  </p>
                </div>
              )}
            </div>

            {recommendations.length > 0 && (
              <RestaurantList
                restaurants={recommendations}
                selectedId={selectedRestaurant}
                onSelect={setSelectedRestaurant}
                votes={votes}
                onVote={handleVote}
                currentUserId={socket.id}
              />
            )}
          </section>
        </>
        )}

      </main>

      <footer className="footer">
        <div><strong>DevDinners</strong> — CS178 Project</div>
      </footer>
    </div>
  );
}

export default App;