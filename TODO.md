## TODO List:

Backend:

- [x] Database initialization
- [x] Scoring function
- [x] Google Places API connection
- [x] SQLite caching layer: cache API results, update stale results, fetch from DB
- [ ] Core central recommendation system: aggregate group -> fetch restaurants -> filter -> score -> sort/rank -> return
- [x] API route to core: allows frontend to talk to our core central recommendation system

Frontend:

- [ ] HTML entry point: basic website design
- [ ] React entry point: fancy website design
- [ ] Components: user preference form, list of return restaurants
- [ ] Link to backend
- [ ] OPTIONAL: Map interface?

## Contributions (2/3 - 2/17):

**Nathan**:

- Project plan and codebase setup
- Scoring function
- Google Places API connection routing
- Database schema

**David**:

- initialize SQLite database connection in services/database.js
- Implement recommendations logic in services/recommendations.js
- Add POST /api/recommendations route for handling frontend requests
- Refactored googlePlace.js to correct field names

**Gurjot**:

- Implemented Real-Time Multiplayer Architecture: Built the Socket.io infrastructure to allow users to create/join lobbies and sync data across devices in real-time.

- Built Dynamic Radius Control: Added frontend controls and backend logic to handle variable search radii (1km - 50km) with API safety caps.

- Developed Live Voting System: Created the "Heart" feature, allowing groups to vote on restaurants with instant updates across all screens.

- Integrated Interactive Map: Added Leaflet maps with custom markers and auto-zoom bounds to visualize search results.