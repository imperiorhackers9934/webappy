import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const NearbyProfessionals = ({ user }) => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(10); // Default 10km radius
  const [currentLocation, setCurrentLocation] = useState(null);

  // Get user's current location
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ latitude, longitude });
          },
          (error) => {
            console.error('Geolocation error:', error);
            setError('Could not get your location. Please enable location services.');
            setLoading(false);
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, // Reduce timeout to 10 seconds
            maximumAge: 0 
          }
        );
      } else {
        setError('Geolocation is not supported by your browser');
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  // Fetch nearby professionals when location is available
  useEffect(() => {
    const fetchNearbyProfessionals = async () => {
      if (!currentLocation) return;
      
      try {
        setLoading(true);
        
        // Update user's location on the server
        try {
          await api.updateLocation(currentLocation.latitude, currentLocation.longitude);
          console.log('Location updated successfully:', currentLocation);
        } catch (locationError) {
          console.log('Location update error:', locationError);
          // Continue even if location update fails
        }
        
        // Fetch nearby professionals
        try {
          const response = await api.getNearbyProfessionals(distance);
          setProfessionals(response);
        } catch (fetchError) {
          console.error('Error fetching nearby professionals:', fetchError);
          setError('Failed to load nearby professionals');
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchNearbyProfessionals:', error);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    };

    fetchNearbyProfessionals();
  }, [currentLocation, distance]);

  // Calculate positions for professionals inside the oval
  const positionProfiles = () => {
    const maxVisible = Math.min(professionals.length, 8); // Show max 8 profiles
    const profiles = [];
    
    for (let i = 0; i < maxVisible; i++) {
      const professional = professionals[i];
      
      // Use a golden ratio based spiral to position profiles
      // This prevents overlapping and creates a nice distribution
      const theta = i * 2.4; // Golden angle in radians
      const radius = Math.min(16, 5 + 2.5 * Math.sqrt(i)); // Adjust radius based on index
      
      // Convert polar to cartesian coordinates (0,0 is center)
      const x = radius * Math.cos(theta);
      const y = radius * Math.sin(theta) * 0.6; // Multiply by 0.6 to account for oval shape
      
      // Convert to percentage (center is 50%, 50%)
      const xPercent = 50 + x;
      const yPercent = 50 + y;
      
      profiles.push({
        ...professional,
        position: { x: xPercent, y: yPercent }
      });
    }
    
    return profiles;
  };

  // Send connection request
  const handleConnect = async (userId) => {
    try {
      if (!userId) {
        console.error('No user ID provided');
        return;
      }
      
      console.log('Sending connection request to user:', userId);
      await api.sendConnectionRequest(userId);
      
      // Update the list to show "Pending" for this user
      setProfessionals(prev => 
        prev.map(p => 
          p._id === userId ? { ...p, connectionStatus: 'pending' } : p
        )
      );
    } catch (error) {
      console.error('Error sending connection request:', error);
      // Check the specific error message or status
      if (error.response) {
        console.error('Server response:', error.response.data);
      }
    }
  };

  if (loading && !professionals.length) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Scanning for Professionals</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Scanning for Professionals</h3>
        </div>
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-orange-500 hover:text-orange-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const positionedProfiles = positionProfiles();

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Scanning for Professionals</h3>
      </div>

      {professionals.length === 0 ? (
        <div className="text-center py-8 text-gray-500 px-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>No professionals found nearby.</p>
          <p className="text-sm mt-1">Try increasing the search distance or check back later.</p>
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center">
          {/* Main orange oval with profiles inside */}
          <div className="relative w-64 h-40 mb-6">
            {/* Orange oval background */}
            <div className="absolute inset-0" style={{ 
              background: '#FF7A45', 
              borderRadius: '50%',
              overflow: 'hidden'
            }}>
              {/* Inner white ring */}
              <div className="absolute inset-4" style={{ 
                border: '1px solid white', 
                borderRadius: '50%',
                opacity: 0.5
              }}></div>
            </div>
            
            {/* Profiles inside the oval */}
            {positionedProfiles.map((professional) => (
              <div 
                key={professional._id}
                className="absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: `${professional.position.x}%`, 
                  top: `${professional.position.y}%`,
                  zIndex: 10
                }}
              >
                <Link to={`/profile/${professional._id}`}>
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-white border-2 border-white shadow">
                    {professional.profilePicture ? (
                      <img
                        src={professional.profilePicture}
                        alt={`${professional.firstName} ${professional.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-300">
                        <span className="text-xs font-semibold text-gray-600">
                          {professional.firstName?.charAt(0)}
                          {professional.lastName?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
                
                {/* Connection status indicator below the profile */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                  {professional.connectionStatus === 'connected' ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-600">✓</span>
                  ) : professional.connectionStatus === 'pending' ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">•••</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleConnect(professional._id);
                      }}
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-600 hover:bg-green-200"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Status text */}
          <div className="text-center mt-2 mb-2 text-gray-700">
            Found {professionals.length} professional{professionals.length !== 1 ? 's' : ''} nearby
          </div>
        </div>
      )}
      
      <div className="px-4 py-3 bg-gray-50 text-sm border-t border-gray-200">
        <Link 
          to="/network/recommendations" 
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          See all professionals
        </Link>
      </div>
    </div>
  );
};

export default NearbyProfessionals;
