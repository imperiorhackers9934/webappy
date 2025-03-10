// In frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isNewSignup, setIsNewSignup] = useState(false);
  const navigate = useNavigate();

  // Load user info when token changes
  useEffect(() => {
    const loadUserInfo = async () => {
      if (token) {
        try {
          // Set token in API service
          api.setAuthToken(token);
          
          // Get user data
          const response = await api.getUserInfo();
          const userData = response.user || response;
          
          setUser(userData);
          localStorage.setItem('token', token);
          
          // Reset new signup flag after loading user
          // This ensures it doesn't persist across sessions
          setIsNewSignup(false);
        } catch (error) {
          console.error('Failed to load user info:', error);
          logout();
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
      const response = await api.login(credentials);
      setToken(response.token);
      setUser(response.user);
      setIsNewSignup(false);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const response = await api.signup(userData);
      setToken(response.token);
      setUser(response.user);
      
      // Explicitly set new signup flag
      setIsNewSignup(true);
      
      return response.isNewUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsNewSignup(false);
    navigate('/login');
  };

  const updateUser = async (userData) => {
    try {
      // Submit update to API
      const response = await api.updateProfile(userData);
      
      // Update local user state with returned data or the submitted data
      setUser(prev => ({ 
        ...prev, 
        ...userData, 
        ...(response.user || {})
      }));
      
      // When user updates profile, reset new signup flag
      if (isNewSignup) {
        setIsNewSignup(false);
      }
      
      return response;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const handleAuthCallback = async (searchParams) => {
    console.log('Auth callback triggered', searchParams.toString());
    const tokenFromUrl = searchParams.get('token');
    const isNewUserFromUrl = searchParams.get('isNewUser') === 'true';
    const error = searchParams.get('error');
    const redirect = searchParams.get('redirect') || '/dashboard';
    
    console.log('Token from URL:', tokenFromUrl);
    console.log('Is new user from URL params:', isNewUserFromUrl);
    
    if (error) {
      throw new Error(error);
    }
    
    if (!tokenFromUrl) {
      throw new Error('No token found in URL parameters');
    }
    
    // Store the token in localStorage
    localStorage.setItem('token', tokenFromUrl);
    
    // Update the token state
    setToken(tokenFromUrl);
    
    // Set the new signup flag
    setIsNewSignup(isNewUserFromUrl);
    
    // Important: Wait for state updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Decide where to redirect the user
    if (isNewUserFromUrl) {
      // New users go to profile setup
      console.log('New user detected, redirecting to profile setup');
      navigate('/profile-setup');
    } else {
      // Existing users go to dashboard or specified redirect
      console.log('Existing user, redirecting to:', redirect);
      navigate(redirect);
    }
    
    return { success: true };
  };

  const sendPhoneVerification = async (phoneNumber) => {
    return api.sendPhoneVerification(phoneNumber);
  };

  const verifyPhone = async (phoneNumber, code) => {
    try {
      const response = await api.verifyPhone(phoneNumber, code);
      setToken(response.token);
      setUser(response.user);
      
      // Check if this is a new user
      setIsNewSignup(response.isNewUser || !response.user.profileComplete);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const socialLogin = (provider, redirectUrl) => {
    // Construct the frontend callback URL
    const callbackUrl = `${window.location.origin}/auth/callback`;
    
    // Redirect to OAuth endpoint with proper callback URL
    const authUrl = `${api.baseURL}/auth/${provider}?redirectTo=${encodeURIComponent(callbackUrl)}`;
    
    console.log(`Redirecting to social login: ${authUrl}`);
    window.location.href = authUrl;
  };

  const value = {
    user,
    token,
    loading,
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
