import { Navigate, Route, Routes } from 'react-router-dom';

import LandingPage from './components/LandingPage.jsx';
import ProtectedRoute from './components/routing/ProtectedRoute.jsx';
import PublicOnlyRoute from './components/routing/PublicOnlyRoute.jsx';
import DashboardPlaceholder from './pages/DashboardPlaceholder.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';

function App() {
  return ( 
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/verify-email" element={<PublicOnlyRoute><VerifyEmailPage /></PublicOnlyRoute>} />
      <Route path="/app" element={<ProtectedRoute><DashboardPlaceholder /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
