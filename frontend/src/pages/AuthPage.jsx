import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../components/auth/Login';
import Signup from '../components/auth/Signup';
import PhoneLogin from '../components/auth/PhoneLogin';
import AuthLayout from '../components/layout/AuthLayout';
import { useToast } from '../components/common/Toast';

const AuthPage = ({ type = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, handleAuthCallback, isNewSignup } = useAuth();
  const [authType, setAuthType] = useState(type);
  const { addToast } = useToast();
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  useEffect(() => {
    // Check if user is already logged in and not in callback mode
    if (user && !location.pathname.includes('/auth/callback')) {
      navigate('/dashboard');
    }

    // Handle OAuth callback if on callback page
    if (location.pathname === '/auth/callback') {
      handleOAuthCallback();
    }

    // Check for error params
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');
    const expired = urlParams.get('expired');

    if (error) {
      let errorMessage = 'Authentication failed';
      if (error === 'auth_failed') {
        errorMessage = 'Authentication failed. Please try again.';
      } else if (error === 'server_error') {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error === 'invalid_state') {
        errorMessage = 'Security validation failed. Please try again.';
      } else if (error === 'linkedin_auth_failed') {
        errorMessage = 'LinkedIn authentication failed. Please try again.';
      }
      addToast(errorMessage, 'error');
    }

    if (expired === 'true') {
      addToast('Your session has expired. Please log in again.', 'warning');
    }
  }, [location, user, navigate, addToast]);

  useEffect(() => {
    // Update auth type based on props
    setAuthType(type);
  }, [type]);

  const handleOAuthCallback = async () => {
    try {
      setIsProcessingCallback(true);
      const searchParams = new URLSearchParams(location.search);
      console.log('Processing auth callback with params:', searchParams.toString());
      
      await handleAuthCallback(searchParams);
      
      // The handleAuthCallback function should handle navigation
    } catch (error) {
      console.error('Error handling auth callback:', error);
      addToast('Failed to authenticate. Please try again.', 'error');
      navigate('/login');
    } finally {
      setIsProcessingCallback(false);
    }
  };

  // Show loading state during callback processing
  if (isProcessingCallback) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Processing your login...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {authType === 'signup' ? (
        <Signup />
      ) : authType === 'phone-login' ? (
        <PhoneLogin />
      ) : (
        <Login />
      )}
    </AuthLayout>
  );
};

export default AuthPage;
