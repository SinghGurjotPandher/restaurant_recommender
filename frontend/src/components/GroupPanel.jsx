import { memo } from 'react';
import { X } from 'lucide-react';

const BUDGET_MAP = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };

function GroupPanel({ users, onRemoveUser }) {
  return (
    <div className="group-panel">
      <div className="group-header">
        <h3>Your Group</h3>
        <span className="group-count">
          {users.length} {users.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      <div className="user-cards">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-meta">
                {user.cuisines.slice(0, 2).map((c) => (
                  <span key={c} className="user-tag">{c}</span>
                ))}
                {user.cuisines.length > 2 && (
                  <span className="user-tag">+{user.cuisines.length - 2}</span>
                )}
                <span className="user-tag">{BUDGET_MAP[user.budget]}</span>
                {user.dietary && (
                  <span className="user-tag dietary">{user.dietary}</span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="remove-btn"
              onClick={() => onRemoveUser(user.id)}
              aria-label={`Remove ${user.name}`}
            >
              <X strokeWidth={2.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(GroupPanel);
