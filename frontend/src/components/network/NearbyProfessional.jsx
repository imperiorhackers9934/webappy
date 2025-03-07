import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../common/Loader';
import UserCard from '../common/UserCard';
import { MapPin, Sliders, AlertCircle } from 'lucide-react';

const NearbyProfessionalsPage = () => {
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [filters, setFilters] = useState({
    distance: 10, // km
    industries: '',
    skills: '',
    availableForMeeting: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user's location when the component mounts
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (navigator.geolocation) {
      // Request high accuracy location
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Location obtained successfully:", position.coords);
          const { latitude, longitude, accuracy } = position.coords;
          
          // Store location with accuracy information for debugging
          setUserLocation({ 
            latitude, 
            longitude, 
            accuracy, // in meters
            timestamp: new Date().toISOString() 
          });
          
          // Log for debugging
          console.log(`Location accuracy: ${accuracy} meters`);
          
          // Fetch nearby users with the obtained coordinates
          fetchNearbyUsers(latitude, longitude, filters.distance);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage;
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location services in your browser.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please try again later.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = "An unknown error occurred while getting your location.";
          }
          
          setLocationError(errorMessage);
          setLocationLoading(false);
          setLoading(false);
        },
        options
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      setLocationLoading(false);
      setLoading(false);
    }
  };
  
  const fetchNearbyUsers = async (latitude, longitude, distance) => {
    setLoading(true);
    try {
      console.log(`Fetching nearby users at coordinates: ${latitude}, ${longitude} within ${distance}km`);
      
      // Use an improved approach - manually construct the API request with the exact coordinates
      const response = await api.getNearbyProfessionals(distance);
      
      if (!Array.isArray(response)) {
        console.error('Invalid response from getNearbyProfessionals:', response);
        setNearbyUsers([]);
        setLoading(false);
        return;
      }
      
      console.log(`Retrieved ${response.length} nearby users`);
      
      // Create a Set of connection IDs for faster lookup
      let connectionIds = new Set();
      try {
        const connections = await api.getConnections('all');
        if (Array.isArray(connections)) {
          connectionIds = new Set(connections.map(conn => conn._id));
        }
      } catch (connectionError) {
        console.error('Error fetching connections:', connectionError);
      }
      
      // Sort users by distance (closest first)
      const sortedUsers = response.sort((a, b) => {
        // Handle cases where distance might be missing
        const distanceA = typeof a.distance === 'number' ? a.distance : Infinity;
        const distanceB = typeof b.distance === 'number' ? b.distance : Infinity;
        
        return distanceA - distanceB; // Sort ascending (closest first)
      });
      
      // Log distance information for debugging
      console.log('Users sorted by distance:');
      sortedUsers.slice(0, 5).forEach(u => {
        console.log(`${u.firstName} ${u.lastName}: ${u.distance}km`);
      });
      
      setNearbyUsers(sortedUsers);
    } catch (error) {
      console.error('Error fetching nearby professionals:', error);
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
    }
  };

  const handleRefreshLocation = () => {
    getUserLocation();
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
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center"
          >
            <Sliders className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Location Status */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        {locationLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500 mr-2"></div>
            <span className="text-gray-700">Getting your location...</span>
          </div>
        ) : locationError ? (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Location Error</p>
              <p className="text-sm">{locationError}</p>
              <button 
                onClick={handleRefreshLocation}
                className="mt-2 text-orange-500 text-sm hover:underline"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : userLocation ? (
          <div>
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-gray-700">
                Showing professionals near your current location
              </span>
              <button 
                onClick={handleRefreshLocation}
                className="ml-2 text-xs text-orange-500 hover:underline"
              >
                Refresh Location
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Location accuracy: {userLocation.accuracy ? `${Math.round(userLocation.accuracy)} meters` : 'Unknown'}
            </div>
          </div>
        ) : (
          <div className="flex items-center text-yellow-600">
            <MapPin className="h-5 w-5 mr-2" />
            <span>
              Unable to get your location. Please enable location services.
            </span>
          </div>
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
              className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition"
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
            <div className="text-center py-10 bg-white rounded-lg shadow-md p-8">
              <div className="bg-orange-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-10 w-10 text-orange-500" />
              </div>
              <p className="text-gray-600">No professionals found in your area.</p>
              <p className="text-gray-600 mt-2">Try expanding your search distance or changing your filters.</p>
              <button 
                onClick={handleRefreshLocation}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
              >
                Refresh Location
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyUsers.map(user => (
                <UserCard
                  key={user._id}
                  user={user}
                  distance={user.distance}
                  onConnect={() => handleConnect(user._id)}
                  onFollow={() => handleFollow(user._id)}
                  onViewProfile={() => handleViewProfile(user._id)}
                  theme="orange"
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyProfessionalsPage;
