import { Navigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth.js';

/** Prevents signed-in users from returning to Login or Register pages. */
function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/app" replace /> : children;
}

export default PublicOnlyRoute;
