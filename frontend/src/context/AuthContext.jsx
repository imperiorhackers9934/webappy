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
          const userData = await api.getUserInfo();
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

  const updateUser = (userData) => {
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
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('token', token);
      
      // Update the token state
      setToken(token);
      
      // Check if this is a new user based on the flag from the backend
      const isNewUser = searchParams.get('isNewUser') === 'true';
      console.log('Is new user from URL params:', isNewUser);
      
      // Set the new signup flag before any redirects
      setIsNewSignup(isNewUser);
      
      // Important: Force a slight delay to ensure state update before navigation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (isNewUser) {
        // Always redirect new users to profile setup
        console.log('New user detected, redirecting to profile setup');
        navigate('/profile-setup');
      } else {
        // Get the redirect destination for existing users
        const redirect = searchParams.get('redirect') || '/dashboard';
        console.log('Existing user, redirecting to:', redirect);
        navigate(redirect);
      }
    } else {
      console.error('No token found in URL parameters');
      navigate('/login?error=auth_failed');
    }
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
      setIsNewSignup(response.isNewUser);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const socialLogin = (provider) => {
    window.location.href = `${api.baseURL}/auth/${provider}?redirectTo=${window.location.origin}/auth/callback`;
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
