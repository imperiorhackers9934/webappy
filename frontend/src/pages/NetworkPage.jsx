// frontend/src/pages/NetworkPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import ConnectionRequestsSection from '../components/network/ConnectionRequest';
import ConnectionsSection from '../components/network/ConnectionsSection';
import ProfessionalSuggestionsSection from '../components/network/ProfessionlSugesstionSection';
import Footer from '../components/common/Footer';
import api from '../services/api';
import socketManager from '../services/socketmanager';

const NetworkPage = () => {
  const { user, socketStatus } = useAuth();
  const navigate = useNavigate();
  const { section } = useParams();
  const [activeSection, setActiveSection] = useState(section || 'connections');
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  // Update active section when route changes
  useEffect(() => {
    if (section) {
      setActiveSection(section);
    }
  }, [section]);

  // Register socket event handlers for real-time updates
  useEffect(() => {
    if (socketStatus !== 'CONNECTED') return;

    // Handle new connection request
    const newRequestUnsubscribe = socketManager.on('new_connection_request', (data) => {
      // Refresh connection requests when a new one is received
      fetchConnectionRequests();
    });

    // Handle when someone accepts your connection request
    const connectionAcceptedUnsubscribe = socketManager.on('connection_accepted', (data) => {
      // Refresh connections when one is accepted
      fetchConnections();
    });

    // Handle when someone follows you
    const newFollowerUnsubscribe = socketManager.on('new_follower', (data) => {
      // We could display a notification here
      // For now, we'll just refresh connections which include followers
      fetchConnections();
    });

    return () => {
      newRequestUnsubscribe();
      connectionAcceptedUnsubscribe();
      newFollowerUnsubscribe();
    };
  }, [socketStatus]);

  // Fetch connection requests
  const fetchConnectionRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await api.getConnectionRequests();
      setConnectionRequests(response);
      setLoadingRequests(false);
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      setError('Failed to load connection requests');
      setLoadingRequests(false);
    }
  };

  // Fetch connections
  const fetchConnections = async () => {
    try {
      setLoadingConnections(true);
      const response = await api.getConnections();
      setConnections(response);
      setLoadingConnections(false);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('Failed to load connections');
      setLoadingConnections(false);
    }
  };

  // Fetch suggestions
  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const response = await api.getProfessionalSuggestions({ limit: 20 });
      setSuggestions(response);
      setLoadingSuggestions(false);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Failed to load suggestions');
      setLoadingSuggestions(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    if (!user) return;

    fetchConnectionRequests();
    fetchConnections();
    fetchSuggestions();
  }, [user]);

  // Handle connection request response
  const handleConnectionResponse = async (userId, accept) => {
    try {
      if (accept) {
        await api.acceptConnection(userId);
        
        // Emit socket event for real-time notification
        socketManager.emit('accept_connection', { senderUserId: userId });
      } else {
        await api.declineConnection(userId);
      }

      // Remove from requests list
      setConnectionRequests(prev => prev.filter(request => request._id !== userId));

      // If accepted, add to connections list
      if (accept) {
        const updatedUser = connectionRequests.find(request => request._id === userId);
        if (updatedUser) {
          setConnections(prev => [updatedUser, ...prev]);
        }
      }
    } catch (error) {
      console.error(`Error ${accept ? 'accepting' : 'declining'} connection:`, error);
      setError(`Failed to ${accept ? 'accept' : 'decline'} connection request`);
    }
  };

  // Handle following a user
  const handleFollow = async (userId) => {
    try {
      const response = await api.followUser(userId);
      
      // Update the suggestions list to reflect the follow
      setSuggestions(prev => 
        prev.map(user => 
          user._id === userId ? { 
            ...user, 
            isFollowing: !user.isFollowing 
          } : user
        )
      );
      
      return response;
    } catch (error) {
      console.error('Error following user:', error);
      setError('Failed to follow user');
      throw error;
    }
  };

  // Handle connecting with a suggested user
  const handleConnect = async (userId) => {
    try {
      await api.sendConnectionRequest(userId);
      
      // Emit socket event for real-time notification
      socketManager.emit('send_connection_request', { targetUserId: userId });
      
      // Update the suggestions list to show pending status
      setSuggestions(prev => 
        prev.map(user => 
          user._id === userId ? { 
            ...user, 
            connectionStatus: 'pending' 
          } : user
        )
      );
    } catch (error) {
      console.error('Error sending connection request:', error);
      setError('Failed to send connection request');
    }
  };

  // Create chat with a connection
  const handleCreateChat = async (connectionId) => {
    try {
      const chatResponse = await api.createChat(connectionId);
      
      // Navigate to the chat page with the new chat
      navigate(`/chat/${chatResponse._id}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to start conversation. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white shadow-md rounded-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your network</h1>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Network</h1>
          <p className="text-gray-600">Manage your professional relationships and discover new connections</p>
        </div>
        
        {/* Network Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => navigate('/network/connections')}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeSection === 'connections'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Connections
              {connections.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {connections.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => navigate('/network/requests')}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeSection === 'requests'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Requests
              {connectionRequests.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                  {connectionRequests.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => navigate('/network/discover')}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeSection === 'discover'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Discover People
            </button>
            
            <button
              onClick={() => navigate('/network/nearby')}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeSection === 'nearby'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Nearby
            </button>
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="absolute top-0 right-0 p-2"
              aria-label="Close error message"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}
        
        {/* Socket Connection Warning */}
        {socketStatus !== 'CONNECTED' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <p className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              Connection status: {socketStatus}. Some real-time updates might be delayed.
            </p>
          </div>
        )}
        
        {/* Active Section Content */}
        {activeSection === 'connections' && (
          <ConnectionsSection 
            connections={connections} 
            loading={loadingConnections}
            onCreateChat={handleCreateChat}
          />
        )}
        
        {activeSection === 'requests' && (
          <ConnectionRequestsSection 
            requests={connectionRequests} 
            loading={loadingRequests} 
            onAccept={(userId) => handleConnectionResponse(userId, true)}
            onDecline={(userId) => handleConnectionResponse(userId, false)}
          />
        )}
        
        {activeSection === 'discover' && (
          <ProfessionalSuggestionsSection 
            suggestions={suggestions} 
            loading={loadingSuggestions} 
            onConnect={handleConnect}
            onFollow={handleFollow}
          />
        )}
        
        {activeSection === 'nearby' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Professionals Near You</h2>
            {/* We'll reuse the NearbyProfessionals component from your code */}
            {/* This component will be integrated directly from your existing code */}
            <p className="text-gray-500 text-center py-10">Loading nearby professionals...</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default NetworkPage;