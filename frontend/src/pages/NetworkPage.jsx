import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import ConnectionRequestsSection from '../components/network/ConnectionRequest';
import ConnectionsSection from '../components/network/ConnectionsSection';
import ProfessionalSuggestionsSection from '../components/network/ProfessionlSugesstionSection';
import Footer from '../components/common/Footer';
import api from '../services/api';

const NetworkPage = () => {
  const { user } = useAuth();
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

  // Fetch connection requests
  useEffect(() => {
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

    fetchConnectionRequests();
  }, []);

  // Fetch connections
  useEffect(() => {
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

    fetchConnections();
  }, []);

  // Fetch suggestions
  useEffect(() => {
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

    fetchSuggestions();
  }, []);

  // Handle connection request response
  const handleConnectionResponse = async (userId, accept) => {
    try {
      if (accept) {
        await api.acceptConnection(userId);
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
      await api.followUser(userId);
      
      // Update the suggestions list to reflect the follow
      setSuggestions(prev => 
        prev.map(user => 
          user._id === userId ? { ...user, isFollowing: !user.isFollowing } : user
        )
      );
    } catch (error) {
      console.error('Error following user:', error);
      setError('Failed to follow user');
    }
  };

  // Handle connecting with a suggested user
  const handleConnect = async (userId) => {
    try {
      await api.sendConnectionRequest(userId);
      
      // Update the suggestions list to show pending status
      setSuggestions(prev => 
        prev.map(user => 
          user._id === userId ? { ...user, connectionStatus: 'pending' } : user
        )
      );
    } catch (error) {
      console.error('Error sending connection request:', error);
      setError('Failed to send connection request');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Please log in to view your network</h1>
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
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 flex-grow">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Network</h1>
          <p className="text-gray-600">Manage your professional relationships and discover new connections</p>
        </div>
        
        {/* Network Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => navigate('/network/connections')}
              className={`px-6 py-3 text-sm font-medium ${
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
              className={`px-6 py-3 text-sm font-medium ${
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
              className={`px-6 py-3 text-sm font-medium ${
                activeSection === 'discover'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Discover People
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
            >
              &times;
            </button>
          </div>
        )}
        
        {/* Active Section Content */}
        {activeSection === 'connections' && (
          <ConnectionsSection 
            connections={connections} 
            loading={loadingConnections} 
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
      </div>
      
      <Footer />
    </div>
  );
};

export default NetworkPage;