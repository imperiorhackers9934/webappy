import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../common/Loader';
import UserCard from '../common/UserCard';
import { MapPin, Sliders } from 'lucide-react';

const NearbyProfessionalsPage = () => {
  const [loading, setLoading] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    apiResponseCount: 0,
    connectionsCount: 0,
    filteredCount: 0
  });
  const [filters, setFilters] = useState({
    distance: 10, // km
    industries: '',
    skills: '',
    availableForMeeting: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user's location when the component mounts
    getUserLocation();
  }, []);

  // Debug effect to log when users change
  useEffect(() => {
    console.log(`Rendering ${nearbyUsers.length} users:`, nearbyUsers);
  }, [nearbyUsers]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          fetchNearbyUsers(latitude, longitude, filters.distance);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };
  
  const fetchNearbyUsers = async (latitude, longitude, distance) => {
    setLoading(true);
    try {
      // Just get the nearby users without filtering in the component
      const nearbyResponse = await api.getNearbyProfessionals(distance);
      
      // Log detailed API response for debugging
      console.log('API response data:', nearbyResponse);
      
      if (!Array.isArray(nearbyResponse)) {
        console.error('Invalid response from getNearbyProfessionals:', nearbyResponse);
        setNearbyUsers([]);
        setLoading(false);
        return;
      }
      
      console.log(`API returned ${nearbyResponse.length} users`);
      
      // Now fetch connections in a separate call
      let connections = [];
      try {
        connections = await api.getConnections('all');
        if (!Array.isArray(connections)) {
          console.error('Invalid response from getConnections:', connections);
          connections = [];
        }
      } catch (connectionError) {
        console.error('Error fetching connections:', connectionError);
        connections = [];
      }
      
      console.log(`Found ${connections.length} connections`);
      
      // Create a Set of connection IDs for faster lookup (only if we have connections)
      const connectionIds = new Set(connections.map(conn => conn._id));
      
      // Filter out users who are in your connections (only if we have connections)
      const filteredUsers = connections.length > 0 
        ? nearbyResponse.filter(user => {
            // Validate user data
            if (!user || !user._id) {
              console.warn('Invalid user data found:', user);
              return false;
            }
            return !connectionIds.has(user._id);
          })
        : nearbyResponse;
      
      console.log(`After filtering: ${filteredUsers.length} users remaining`);
      
      // Do a final validation of user data to ensure all required fields are present
      const validUsers = filteredUsers.filter(user => {
        if (!user || !user._id || !user.firstName || !user.lastName) {
          console.warn('User missing required data:', user);
          return false;
        }
        return true;
      });
      
      console.log(`${validUsers.length} valid users to display`);
      
      // Update debug info
      setDebugInfo({
        apiResponseCount: nearbyResponse.length,
        connectionsCount: connections.length,
        filteredCount: filteredUsers.length,
        validCount: validUsers.length
      });
      
      // Set the final list of users
      setNearbyUsers(validUsers);
    } catch (error) {
      console.error('Error fetching nearby professionals:', error);
      setNearbyUsers([]);
      setDebugInfo({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleApplyFilters = () => {
    if (userLocation) {
      fetchNearbyUsers(
        userLocation.latitude,
        userLocation.longitude,
        filters.distance
      );
    }
  };

  const handleConnect = async (userId) => {
    try {
      await api.sendConnectionRequest(userId);
      // Update the user's status in the list
      setNearbyUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, connectionStatus: 'pending' } 
            : user
        )
      );
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await api.followUser(userId);
      // Update the user's status in the list
      setNearbyUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, isFollowing: response.following } 
            : user
        )
      );
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 
    'Marketing', 'Sales', 'Design', 'Engineering', 
    'Consulting', 'Legal', 'Real Estate', 'Hospitality'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nearby Professionals</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => navigate('/network/suggested')}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            View Suggested
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
          >
            <Sliders className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Debug Toggle */}
      <div className="mb-4">
        <button 
          onClick={() => setShowDebug(!showDebug)}
          className="text-sm text-blue-600 underline"
        >
          {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
        </button>
      </div>

      {/* Debug Information */}
      {showDebug && (
        <div className="bg-gray-100 p-4 rounded mb-4 text-xs">
          <h3 className="font-bold mb-2">Debug Information</h3>
          <ul>
            <li>API Response: {debugInfo.apiResponseCount} users</li>
            <li>Connections: {debugInfo.connectionsCount} users</li>
            <li>After Filtering: {debugInfo.filteredCount} users</li>
            <li>Valid Users: {debugInfo.validCount} users</li>
            {debugInfo.error && <li className="text-red-500">Error: {debugInfo.error}</li>}
          </ul>
          
          <div className="mt-2">
            <h4 className="font-bold">User IDs in state ({nearbyUsers.length}):</h4>
            <ul className="pl-4">
              {nearbyUsers.map((user, index) => (
                <li key={user._id}>
                  {index + 1}. {user.firstName} {user.lastName} ({user.distance}km)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Location Status */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center">
        <MapPin className="h-5 w-5 text-blue-600 mr-2" />
        {userLocation ? (
          <span className="text-gray-700">
            Showing professionals near your current location
          </span>
        ) : (
          <span className="text-yellow-600">
            Unable to get your location. Please enable location services.
          </span>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
              <input
                type="range"
                name="distance"
                min="1"
                max="100"
                value={filters.distance}
                onChange={handleFilterChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 km</span>
                <span>{filters.distance} km</span>
                <span>100 km</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                name="industries"
                value={filters.industries}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
                placeholder="e.g. React, Marketing, Design"
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              name="availableForMeeting"
              id="availableForMeeting"
              checked={filters.availableForMeeting}
              onChange={handleFilterChange}
              className="mr-2"
            />
            <label htmlFor="availableForMeeting" className="text-sm text-gray-700">
              Only show users available for in-person meetings
            </label>
          </div>
          <div className="mt-4">
            <button
              onClick={handleApplyFilters}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : (
        <>
          {nearbyUsers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No professionals found in your area.</p>
              <p className="text-gray-600 mt-2">Try expanding your search distance or changing your filters.</p>
            </div>
          ) : (
            <>
              {/* Simple text list for debugging */}
              {showDebug && (
                <div className="bg-white p-4 mb-6 rounded shadow-sm">
                  <h3 className="font-bold mb-2">Text List of Users:</h3>
                  <ul className="pl-5 list-decimal">
                    {nearbyUsers.map(user => (
                      <li key={user._id} className="mb-1">
                        {user.firstName} {user.lastName} - {user.distance}km
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            
              {/* Main grid display */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-screen">
                {nearbyUsers.map((user, index) => (
                  <div key={user._id} className="relative">
                    {showDebug && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs rounded-bl z-10">
                        User #{index + 1}
                      </div>
                    )}
                    <UserCard
                      user={user}
                      distance={user.distance}
                      onConnect={() => handleConnect(user._id)}
                      onFollow={() => handleFollow(user._id)}
                      onViewProfile={() => handleViewProfile(user._id)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyProfessionalsPage;
