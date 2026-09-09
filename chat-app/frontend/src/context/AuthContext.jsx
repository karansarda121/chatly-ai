import { useState } from 'react';

import api from '../services/api.js';
import { disconnectSocket } from '../services/socket.js';
import AuthContext from './authContext.js';

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('chatly_user'));
  } catch {
    localStorage.removeItem('chatly_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function saveSession({ token, user: authenticatedUser }) {
    localStorage.setItem('chatly_token', token);
    localStorage.setItem('chatly_user', JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
  }

  function saveUser(updatedUser) {
    localStorage.setItem('chatly_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  async function login(credentials) {
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/api/auth/login', credentials);
      saveSession(data);
      return data.user;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function register(details) {
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/api/auth/register', details);
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function getEmailVerificationStatus(email) {
    const { data } = await api.post('/api/auth/verification-status', { email });
    return data;
  }
  async function verifyEmail(details) {
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/api/auth/verify-email', details);
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resendVerificationOtp(email) {
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/api/auth/resend-verification-otp', { email });
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function requestPasswordReset(email) { setIsSubmitting(true); try { const { data } = await api.post('/api/auth/forgot-password', { email }); return data; } finally { setIsSubmitting(false); } }
  async function resendPasswordResetOtp(email) { setIsSubmitting(true); try { const { data } = await api.post('/api/auth/resend-password-reset-otp', { email }); return data; } finally { setIsSubmitting(false); } }
  async function verifyPasswordResetOtp(details) { setIsSubmitting(true); try { const { data } = await api.post('/api/auth/verify-password-reset-otp', details); return data; } finally { setIsSubmitting(false); } }
  async function resetPassword(details) { setIsSubmitting(true); try { const { data } = await api.post('/api/auth/reset-password', details); return data; } finally { setIsSubmitting(false); } }
  async function updateProfile(details) {
    setIsSubmitting(true);
    try {
      const { data } = await api.put('/api/auth/me', details);
      saveUser(data.user);
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    setIsSubmitting(true);
    try {
      const { data } = await api.put('/api/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      saveUser(data.user);
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changePassword(details) {
    setIsSubmitting(true);
    try {
      const { data } = await api.put('/api/auth/change-password', details);
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }

  function logout() {
    disconnectSocket();
    localStorage.removeItem('chatly_token');
    localStorage.removeItem('chatly_user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, isSubmitting, login, register, getEmailVerificationStatus, verifyEmail, resendVerificationOtp, requestPasswordReset, resendPasswordResetOtp, verifyPasswordResetOtp, resetPassword, updateProfile, updateAvatar, changePassword, logout }}>{children}</AuthContext.Provider>;
}
