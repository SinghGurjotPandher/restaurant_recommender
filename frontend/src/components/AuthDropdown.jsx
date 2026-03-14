import { useState } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';

export default function AuthDropdown({ user, onLogin, onRegister, onLogout }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await onLogin(email, password);
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        await onRegister(email, password, displayName);
      }
      reset();
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="auth-area">
        <button className="auth-trigger signed-in" onClick={() => setOpen(!open)}>
          <User size={16} />
          <span>{user.displayName || user.email}</span>
          <ChevronDown size={14} />
        </button>
        {open && (
          <div className="auth-dropdown">
            <div className="auth-user-info">
              <div className="auth-avatar">{(user.displayName || user.email)[0].toUpperCase()}</div>
              <div>
                <div className="auth-user-name">{user.displayName || 'No name set'}</div>
                <div className="auth-user-email">{user.email}</div>
              </div>
            </div>
            <button className="auth-logout-btn" onClick={() => { onLogout(); setOpen(false); }}>
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auth-area">
      <button className="auth-trigger" onClick={() => { setOpen(!open); reset(); }}>
        <User size={16} />
        <span>Sign In / Sign Up</span>
      </button>
      {open && (
        <div className="auth-dropdown">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError(''); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setError(''); }}
            >
              Sign Up
            </button>
          </div>
          <form className="auth-form" onSubmit={handleSubmit}>
            {tab === 'register' && (
              <input
                type="text"
                className="auth-input"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}
            <input
              type="email"
              className="auth-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="auth-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <div className="auth-error">{error}</div>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Please wait...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
