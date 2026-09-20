import { Users } from 'lucide-react';

const UserPresence = ({ activeUsers }) => {
  if (!activeUsers || activeUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="presence-bar">
        {activeUsers.slice(0, 3).map((user) => (
          <div 
            key={user._id}
            className="presence-avatar"
            style={{ backgroundColor: user.color || '#7c5cfc' }}
            title={`${user.name} is editing`}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {activeUsers.length > 3 && (
          <div className="presence-avatar bg-surface-3">
             +{activeUsers.length - 3}
          </div>
        )}
      </div>
      <div className="text-xs text-muted hidden lg:block">
        {activeUsers.length} active
      </div>
    </div>
  );
};

export default UserPresence;
