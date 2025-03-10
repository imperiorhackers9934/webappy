// In frontend/src/pages/AuthPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Login from '../components/auth/Login';
import Signup from '../components/auth/Signup';
import PhoneLogin from '../components/auth/PhoneLogin';
import { useAuth } from '../context/AuthContext';

const AuthPage = ({ type: propType }) => {
  const { type: paramType } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading, handleAuthCallback, isNewSignup } = useAuth();
  
  // Initialize authType from either prop or param
  const [authType, setAuthType] = useState(propType || paramType || 'login');
  const [isCallbackProcessing, setIsCallbackProcessing] = useState(false);
  const [callbackError, setCallbackError] = useState(null);

  useEffect(() => {
    // Handle OAuth callback
    if (location.pathname === '/auth/callback' && !isCallbackProcessing) {
      setIsCallbackProcessing(true);
      
      const token = searchParams.get('token');
      const isNewUser = searchParams.get('isNewUser') === 'true';
      const error = searchParams.get('error');
      
      console.log('OAuth callback triggered:', { token, isNewUser, error });
      
      if (error) {
        setCallbackError(error);
        setIsCallbackProcessing(false);
        return;
      }
      
      if (token) {
        // Process the callback - handleAuthCallback will handle state and redirects
        handleAuthCallback(searchParams).catch(err => {
          console.error('Error handling auth callback:', err);
          setCallbackError('Failed to process authentication');
          setIsCallbackProcessing(false);
        });
      } else {
        console.error('No token found in URL parameters');
        setCallbackError('Authentication failed - no token received');
        setIsCallbackProcessing(false);
      }
      
      return;
    }
    
    // Only run the following logic when auth state is settled (not loading)
    if (!loading) {
      // For debugging
      console.log('Auth state:', { user, isNewSignup, pathname: location.pathname });
      
      // If authenticated user...
      if (user) {
        // New users should be redirected to profile setup from any auth page
        if (isNewSignup && 
            (location.pathname === '/login' || 
             location.pathname === '/signup' || 
             location.pathname === '/phone-login')) {
          console.log('Redirecting new user to profile setup');
          navigate('/profile-setup');
          return;
        }
        
        // Existing users should be redirected to dashboard from any auth page
        if (!isNewSignup && 
            (location.pathname === '/login' || 
             location.pathname === '/signup' || 
             location.pathname === '/phone-login')) {
          console.log('Redirecting existing user to dashboard');
          navigate('/dashboard');
          return;
        }
      }
    }
    
    // Update auth type if props or params change
    if (propType || paramType) {
      setAuthType(propType || paramType);
    }
  }, [user, loading, propType, paramType, location.pathname, navigate, searchParams, 
      handleAuthCallback, isNewSignup, isCallbackProcessing]);
  
  // Render appropriate auth component
  const renderAuthComponent = () => {
    switch (authType) {
      case 'signup':
        return <Signup />;
      case 'phone-login':
        return <PhoneLogin />;
      case 'login':
      default:
        return <Login />;
    }
  };

  // Show loading indicator while authentication state is being determined
  if (loading || (location.pathname === '/auth/callback' && isCallbackProcessing)) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Processing authentication...</p>
        </div>
      </AuthLayout>
    );
  }

  // Show error if OAuth callback failed
  if (callbackError) {
    return (
      <AuthLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Authentication Error: </strong>
          <span className="block sm:inline">{callbackError}</span>
          <div className="mt-4">
            <button 
              onClick={() => navigate('/login')}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Back to Login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {renderAuthComponent()}
    </AuthLayout>
  );
};

export default AuthPage;
