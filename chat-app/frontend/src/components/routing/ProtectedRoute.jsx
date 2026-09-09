import { Navigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth.js';

/** Prevents signed-out users from opening pages that require authentication. */
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
