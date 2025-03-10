import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import socketManager from '../services/socketmanager';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isNewSignup, setIsNewSignup] = useState(false);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // Load user info when token changes
  useEffect(() => {
    const loadUserInfo = async () => {
      if (token) {
        try {
          setLoading(true);
          console.log('Loading user info with token');
          const userData = await api.getUserInfo();
          setUser(userData);
          localStorage.setItem('token', token);
          
          // Connect to socket with token
          if (!socketManager.isConnected()) {
            socketManager.connect(token);
          }
          
          // Reset new signup flag after loading user
          // This ensures it doesn't persist across sessions
          setIsNewSignup(false);
          setAuthError(null);
        } catch (error) {
          console.error('Failed to load user info:', error);
          
          if (error.response && error.response.status === 401) {
            console.warn('Token invalid or expired, logging out');
            logout();
          }
          
          setAuthError('Authentication failed. Please login again.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, [token]);

  const login = async (credentials) => {
    try {
      setAuthError(null);
      console.log('Attempting login with credentials');
      const response = await api.login(credentials);
      console.log('Login successful');
      
      setToken(response.token);
      setUser(response.user);
      setIsNewSignup(false);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.response?.data?.error || 'Login failed');
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      setAuthError(null);
      console.log('Attempting signup with user data');
      const response = await api.signup(userData);
      console.log('Signup successful');
      
      setToken(response.token);
      setUser(response.user);
      
      // Explicitly set new signup flag
      setIsNewSignup(true);
      
      return response.isNewUser;
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError(error.response?.data?.error || 'Signup failed');
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out user');
    
    // Try to call the logout API if we have a token
    if (token) {
      api.logout().catch(error => {
        console.warn('Error during logout API call:', error);
      });
    }
    
    // Disconnect socket
    socketManager.disconnect();
    
    // Clear local storage and state
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsNewSignup(false);
    setAuthError(null);
    
    // Redirect to login page
    navigate('/login');
  };

  const updateUser = (userData) => {
    console.log('Updating user data');
    setUser(prev => ({ ...prev, ...userData }));
    
    // When user updates profile, reset new signup flag
    if (isNewSignup) {
      setIsNewSignup(false);
    }
  };

  const handleAuthCallback = async (searchParams) => {
    console.log('Auth callback triggered', searchParams.toString());
    const token = searchParams.get('token');
    console.log('Token from URL:', token);
    
    if (!token) {
      console.error('No token found in URL parameters');
      throw new Error('Authentication failed - no token received');
    }
    
    try {
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Update the token state
      setToken(token);
      
      // Check if this is a new user based on the flag from the backend
      const isNewUser = searchParams.get('isNewUser') === 'true';
      console.log('Is new user from URL params:', isNewUser);
      
      // Set the new signup flag before any redirects
      setIsNewSignup(isNewUser);
      
      // Load user info with the new token
      try {
        const userData = await api.getUserInfo();
        setUser(userData);
        console.log('User data loaded successfully:', userData);
      } catch (userError) {
        console.error('Failed to load user data after auth callback:', userError);
        // Still continue with the flow since we have a valid token
      }
      
      // Important: Force a slight delay to ensure state update before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the redirect destination
      const redirect = searchParams.get('redirect') || (isNewUser ? '/profile-setup' : '/dashboard');
      
      // Navigate based on user status
      if (isNewUser) {
        // Always redirect new users to profile setup
        console.log('New user detected, redirecting to profile setup');
        navigate('/profile-setup');
      } else {
        // Use the provided redirect destination for existing users
        console.log('Existing user, redirecting to:', redirect);
        navigate(redirect);
      }
      
      return true;
    } catch (error) {
      console.error('Error in auth callback processing:', error);
      // Clear any potentially bad token
      localStorage.removeItem('token');
      setToken(null);
      setAuthError('Authentication failed - please try again');
      throw error;
    }
  };

  const sendPhoneVerification = async (phoneNumber) => {
    try {
      setAuthError(null);
      return await api.sendPhoneVerification(phoneNumber);
    } catch (error) {
      console.error('Send phone verification error:', error);
      setAuthError(error.response?.data?.error || 'Failed to send verification code');
      throw error;
    }
  };

  const verifyPhone = async (phoneNumber, code) => {
    try {
      setAuthError(null);
      const response = await api.verifyPhone(phoneNumber, code);
      setToken(response.token);
      setUser(response.user);
      
      // Check if this is a new user
      setIsNewSignup(response.isNewUser);
      
      return response;
    } catch (error) {
      console.error('Verify phone error:', error);
      setAuthError(error.response?.data?.error || 'Phone verification failed');
      throw error;
    }
  };

  const socialLogin = (provider, redirectTo = '/dashboard') => {
    setAuthError(null);
    
    // Clear any existing token to prevent issues
    localStorage.removeItem('token');
    setToken(null);
    
    // Redirect to OAuth provider
    const encodedRedirect = encodeURIComponent(redirectTo);
    const authUrl = `${api.baseURL}/auth/${provider}?redirectTo=${encodedRedirect}`;
    
    console.log(`Redirecting to ${provider} OAuth:`, authUrl);
    window.location.href = authUrl;
  };

  const value = {
    user,
    token,
    loading,
    authError,
    login,
    signup,
    logout,
    updateUser,
    sendPhoneVerification,
    verifyPhone,
    socialLogin,
    handleAuthCallback,
    isNewSignup,
    setIsNewSignup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
