import { Navigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth.js';

/** Wait for backend JWT verification before redirecting a user away from public auth pages. */
function PublicOnlyRoute({ children }) {
  const { user, isAuthReady } = useAuth();
  if (!isAuthReady) return <div className="auth-route-loading" role="status">Checking your session...</div>;
  return user ? <Navigate to="/app" replace /> : children;
}

export default PublicOnlyRoute;