const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const authRoutes = require('./routes/auth');
require('dotenv').config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
// Database
const db = require('./services/database'); 

// Routes
const recommendationsRouter = require('./routes/recommendations');
app.use('/api/recommendations', recommendationsRouter);

// --- SOCKET.IO LOGIC ---
const sessions = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 1. Host creates a session
    socket.on('create_session', () => {
        // Generate random 4-letter code
        const code = Math.random().toString(36).substring(2, 6).toUpperCase();
        sessions[code] = [];
        socket.join(code);
        
        // Send code back to host
        socket.emit('session_created', code);
        console.log(`Session created: ${code}`);
    });

    // 2. User joins a session
    socket.on('join_session', ({ code, user }) => {
        const roomCode = code.toUpperCase();
        if (sessions[roomCode]) {
            socket.join(roomCode);
            
            // Add user to session
            const newUser = { ...user, id: socket.id }; // Use socket ID as distinct ID
            sessions[roomCode].push(newUser);

            // Broadcast updated user list to everyone in the room
            io.to(roomCode).emit('user_list_updated', sessions[roomCode]);
            console.log(`User joined ${roomCode}: ${user.name}`);
        } else {
            socket.emit('error', 'Invalid Room Code');
        }
    });

    // 3. Update User (Edit)
    socket.on('update_user', ({ code, user }) => {
        const roomCode = code.toUpperCase();
        if (sessions[roomCode]) {
            // Replace user data
            sessions[roomCode] = sessions[roomCode].map(u => 
                u.id === user.id ? user : u
            );
            io.to(roomCode).emit('user_list_updated', sessions[roomCode]);
        }
    });

    // 4. Remove User
    socket.on('leave_session', ({ code, userId }) => {
        const roomCode = code.toUpperCase();
        if (sessions[roomCode]) {
            sessions[roomCode] = sessions[roomCode].filter(u => u.id !== userId);
            io.to(roomCode).emit('user_list_updated', sessions[roomCode]);
        }
    });

    socket.on('sync_results', ({ code, recommendations }) => {
        const roomCode = code.toUpperCase();
        if (sessions[roomCode]) {
            // Broadcast these results to everyone ELSE in the room
            socket.to(roomCode).emit('results_updated', recommendations);
            console.log(`Results synced to room ${roomCode}`);
        }
    });

    socket.on('toggle_vote', ({ code, restaurantId, userId }) => {
        const roomCode = code.toUpperCase();
        const session = sessions[roomCode];
        
        if (session) {
            // Initialize votes object if it doesn't exist
            // Structure: { "place_id_1": ["user1", "user2"], "place_id_2": [] }
            if (!session.votes) session.votes = {};
            if (!session.votes[restaurantId]) session.votes[restaurantId] = [];

            const voters = session.votes[restaurantId];
            const hasVoted = voters.includes(userId);

            if (hasVoted) {
                // Remove vote (Toggle off)
                session.votes[restaurantId] = voters.filter(id => id !== userId);
            } else {
                // Add vote (Toggle on)
                session.votes[restaurantId].push(userId);
            }

            // Broadcast the entire votes object to everyone
            io.to(roomCode).emit('votes_updated', session.votes);
            console.log(`Vote toggled in ${roomCode} for ${restaurantId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Basic route
app.get('/', (req, res) => {
    res.send('Restaurant Recommender API');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});