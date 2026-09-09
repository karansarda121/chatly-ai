import './UserAvatar.css';

function UserAvatar({ alt = '', user }) {
  const name = user?.displayName || user?.username || '?';
  if (user?.avatarUrl) return <img src={user.avatarUrl} alt={alt} />;
  return <span className="user-avatar__fallback" aria-label={alt || `${name}'s avatar`}>{name.trim().charAt(0).toUpperCase()}</span>;
}

export default UserAvatar;
