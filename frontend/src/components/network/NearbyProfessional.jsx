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
  const [error, setError] = useState(null);
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

  const getUserLocation = () => {
    setLoading(true);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`Got location: ${latitude}, ${longitude}`);
          setUserLocation({ latitude, longitude });
          fetchNearbyUsers(latitude, longitude, filters.distance);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError(`Location error: ${error.message}`);
          setLoading(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000, 
          maximumAge: 10000 
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
    }
  };
  
  const fetchNearbyUsers = async (latitude, longitude, distance) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching nearby users with distance: ${distance}km`);
      
      // Get nearby users
      const nearbyResponse = await api.getNearbyProfessionals(distance);
      
      console.log('Nearby users response:', nearbyResponse);
      
      if (!Array.isArray(nearbyResponse)) {
        throw new Error('Invalid API response format');
      }
      
      // Get connections separately
      let connections = [];
      try {
        connections = await api.getConnections('all');
        console.log('Connections response:', connections);
        
        if (!Array.isArray(connections)) {
          console.warn('Invalid connections response format');
          connections = [];
        }
      } catch (connError) {
        console.error('Failed to fetch connections:', connError);
        connections = [];
      }
      
      // Create a Set of connection IDs for faster lookup
      const connectionIds = new Set();
      connections.forEach(conn => {
        if (conn && conn._id) {
          connectionIds.add(conn._id);
        }
      });
      
      console.log(`Found ${connectionIds.size} connections to filter out`);
      
      // Filter out users who are in your connections
      const filteredUsers = nearbyResponse.filter(user => {
        // Skip invalid user data
        if (!user || !user._id) {
          console.warn('Skipping invalid user:', user);
          return false;
        }
        
        // Skip connections
        return !connectionIds.has(user._id);
      });
      
      console.log(`After filtering: ${filteredUsers.length} users`);
      
      setNearbyUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching nearby professionals:', error);
      setError(`Failed to get nearby users: ${error.message}`);
      setNearbyUsers([]);
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
    } else {
      setError('Your location is required. Please enable location services.');
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

  // Manually force display of all users
  const renderAllUsers = nearbyUsers.map((user, index) => (
    <div key={user._id} className="mb-4">
      <UserCard
        user={user}
        distance={user.distance}
        onConnect={() => handleConnect(user._id)}
        onFollow={() => handleFollow(user._id)}
        onViewProfile={() => handleViewProfile(user._id)}
      />
    </div>
  ));

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
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h3 className="font-bold mb-2">Debug Information</h3>
          <div>
            <p>User Location: {userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : 'Not available'}</p>
            <p>Total Users: {nearbyUsers.length}</p>
            {error && <p className="text-red-500">Error: {error}</p>}
          </div>
          
          <div className="mt-2">
            <h4 className="font-bold">User List ({nearbyUsers.length}):</h4>
            <ul className="pl-4">
              {nearbyUsers.map((user, index) => (
                <li key={user._id}>
                  {index + 1}. {user.firstName} {user.lastName} ({user.distance ? `${user.distance}km` : 'unknown distance'})
                </li>
              ))}
            </ul>
          </div>
          
          <button 
            onClick={getUserLocation}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Refresh Data
          </button>
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
        
        {error && <span className="text-red-500 ml-2">({error})</span>}
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
              <button 
                onClick={getUserLocation}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div>
              {/* Simple list rendering - should show all users */}
              {showDebug && (
                <div className="mb-8">
                  <h3 className="font-bold mb-4">Simple List Display (Should show all {nearbyUsers.length} users):</h3>
                  {renderAllUsers}
                </div>
              )}
            
              {/* Main grid display */}
              <div className="flex flex-wrap -mx-2">
                {nearbyUsers.map((user, index) => (
                  <div key={user._id} className="w-full md:w-1/2 lg:w-1/3 px-2 mb-4">
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
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyProfessionalsPage;
