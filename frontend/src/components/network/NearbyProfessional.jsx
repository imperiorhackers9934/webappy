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
            console.error('Error getting location:', error);
            setError('Could not get your location. Please enable location services.');
            setLoading(false);
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
        await api.updateLocation(currentLocation.latitude, currentLocation.longitude);
        
        // Fetch nearby professionals
        const response = await api.getNearbyProfessionals(distance);
        setProfessionals(response);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching nearby professionals:', error);
        setError('Failed to load nearby professionals');
        setLoading(false);
      }
    };

    fetchNearbyProfessionals();
  }, [currentLocation, distance]);

  // Send connection request
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
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Professionals Near You</h2>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Professionals Near You</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Professionals Near You</h2>
        <div className="flex items-center">
          <label className="text-sm text-gray-600 mr-2">Distance:</label>
          <select 
            value={distance} 
            onChange={(e) => setDistance(Number(e.target.value))}
            className="border border-gray-300 rounded-md p-1 text-sm"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
        </div>
      </div>

      {professionals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>No professionals found nearby.</p>
          <p className="text-sm mt-1">Try increasing the search distance or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {professionals.map(professional => (
            <div key={professional._id} className="flex border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex-shrink-0 mr-4">
                {professional.profilePicture ? (
                  <img 
                    src={professional.profilePicture} 
                    alt={`${professional.firstName} ${professional.lastName}`}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-lg font-semibold text-gray-600">
                      {professional.firstName?.charAt(0)}
                      {professional.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <Link to={`/profile/${professional._id}`} className="text-blue-600 hover:underline font-medium">
                  {professional.firstName} {professional.lastName}
                </Link>
                
                {professional.headline && (
                  <p className="text-sm text-gray-600 mt-1">{professional.headline}</p>
                )}
                
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {professional.distance ? (
                    <span>{professional.distance < 1 ? 'Less than 1 km away' : `${professional.distance.toFixed(1)} km away`}</span>
                  ) : (
                    <span>Nearby</span>
                  )}
                </div>
                
                <div className="mt-2">
                  {professional.connectionStatus === 'connected' ? (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Connected
                    </span>
                  ) : professional.connectionStatus === 'pending' ? (
                    <span className="text-sm text-gray-500">
                      Connection request sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(professional._id)}
                      className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium py-1 px-3 rounded-full"
                    >
                      + Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-center">
        <Link to="/network/discover" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View all professionals
        </Link>
      </div>
    </div>
  );
};

export default NearbyProfessionals;