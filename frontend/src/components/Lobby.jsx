import { useState } from 'react';
import { Users, ArrowRight, Copy } from 'lucide-react';

export default function Lobby({ onCreateSession, onJoinSession }) {
  const [mode, setMode] = useState('menu'); // 'menu' | 'join'
  const [roomCode, setRoomCode] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomCode.length === 4) {
      onJoinSession(roomCode.toUpperCase());
    }
  };

  return (
    <div className="lobby-card card">
      <div className="lobby-icon">
        <Users size={48} strokeWidth={1.5} />
      </div>
      
      <h2>Start Dining</h2>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Plan a meal together in real-time.
      </p>

      {mode === 'menu' ? (
        <div className="lobby-buttons">
          <button 
            className="lobby-btn primary"
            onClick={onCreateSession}
          >
            Start New Group
          </button>
          
          <div className="divider">or</div>
          
          <button 
            className="lobby-btn secondary"
            onClick={() => setMode('join')}
          >
            Join Existing Group
          </button>
        </div>
      ) : (
        <form onSubmit={handleJoin} className="join-form">
          <label>Enter 4-Letter Code</label>
          <input
            type="text"
            maxLength={4}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ABCD"
            className="code-input"
            autoFocus
          />
          
          <div className="button-group">
            <button 
              type="button" 
              className="lobby-btn secondary"
              onClick={() => setMode('menu')}
            >
              Back
            </button>
            <button 
              type="submit" 
              className="lobby-btn primary"
              disabled={roomCode.length !== 4}
            >
              Join Group <ArrowRight size={18} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}