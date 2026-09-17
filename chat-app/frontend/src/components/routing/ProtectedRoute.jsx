import { Navigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth.js';

/** Wait for backend JWT verification before exposing a protected route. */
function ProtectedRoute({ children }) {
  const { user, isAuthReady } = useAuth();
  if (!isAuthReady) return <div className="auth-route-loading" role="status">Checking your session...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;