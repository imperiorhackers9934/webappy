import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loader from '../common/Loader';
import UserCard from '../common/UserCard';
import { MapPin, Sliders, AlertCircle, X } from 'lucide-react';

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
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markerRef = useRef(null);
  const navigate = useNavigate();

  // Load Google Maps API
  useEffect(() => {
    // Only load once
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const loadGoogleMapsApi = () => {
      // Define initMap globally so Google Maps can call it when loaded
      window.initMap = () => {
        console.log('Google Maps API loaded');
        setMapLoaded(true);
      };
      
      const googleMapScript = document.createElement('script');
      googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
      googleMapScript.async = true;
      googleMapScript.defer = true;
      
      googleMapScript.addEventListener('error', (e) => {
        console.error('Error loading Google Maps API:', e);
        setLocationError('Failed to load maps. Please try again later.');
        setLocationLoading(false);
      });
      
      document.body.appendChild(googleMapScript);
    };

    loadGoogleMapsApi();
  }, []);

  // Initialize map when it's shown and API is loaded
  useEffect(() => {
    if (showMap && mapLoaded && mapRef.current && !googleMapRef.current) {
      initializeMap();
    }
  }, [showMap, mapLoaded]);

  useEffect(() => {
    // Get user's location when the component mounts
    getUserLocation();
  }, []);

  const initializeMap = () => {
    try {
      // Default center (can be anywhere, we'll recenter based on user location)
      const defaultCenter = { lat: 0, lng: 0 };
      const center = userLocation ? 
        { lat: userLocation.latitude, lng: userLocation.longitude } : 
        defaultCenter;
      
      // Create the map
      const mapOptions = {
        center: center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      };
      
      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;
      
      // Add marker at current location
      if (userLocation) {
        const marker = new window.google.maps.Marker({
          position: { lat: userLocation.latitude, lng: userLocation.longitude },
          map: map,
          draggable: true,
          title: 'Your location'
        });
        markerRef.current = marker;
        
        // Add circle to show accuracy radius
        if (userLocation.accuracy) {
          const accuracyCircle = new window.google.maps.Circle({
            map: map,
            center: { lat: userLocation.latitude, lng: userLocation.longitude },
            radius: userLocation.accuracy,
            fillColor: '#FF9800',
            fillOpacity: 0.2,
            strokeColor: '#FF9800',
            strokeOpacity: 0.5,
            strokeWeight: 1
          });
        }
        
        // Listen for marker drag end
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          const newLat = position.lat();
          const newLng = position.lng();
          
          // Use more decimal places for higher precision
          const preciseLatitude = parseFloat(newLat.toFixed(7));
          const preciseLongitude = parseFloat(newLng.toFixed(7));
          
          console.log(`Exact location selected: ${preciseLatitude}, ${preciseLongitude}`);
          
          // Update location with high accuracy (manual selection)
          setUserLocation({
            latitude: preciseLatitude,
            longitude: preciseLongitude,
            accuracy: 1, // Set to 1 meter for pinpoint accuracy
            isManual: true,
            timestamp: new Date().toISOString()
          });
        });
      } else {
        // If no location yet, use geolocation API to get current position
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              
              // Center map at detected location
              map.setCenter({ lat: latitude, lng: longitude });
              
              // Add marker
              const marker = new window.google.maps.Marker({
                position: { lat: latitude, lng: longitude },
                map: map,
                draggable: true,
                title: 'Your location'
              });
              markerRef.current = marker;
              
              // Update location state with precision
              setUserLocation({
                latitude: parseFloat(latitude.toFixed(7)),
                longitude: parseFloat(longitude.toFixed(7)),
                accuracy: position.coords.accuracy,
                timestamp: new Date().toISOString()
              });
              
              // Listen for marker drag end
              marker.addListener('dragend', () => {
                const position = marker.getPosition();
                const newLat = position.lat();
                const newLng = position.lng();
                
                // Use more decimal places for higher precision
                const preciseLatitude = parseFloat(newLat.toFixed(7));
                const preciseLongitude = parseFloat(newLng.toFixed(7));
                
                console.log(`Exact location selected: ${preciseLatitude}, ${preciseLongitude}`);
                
                // Update location
                setUserLocation({
                  latitude: preciseLatitude,
                  longitude: preciseLongitude,
                  accuracy: 1, // High accuracy for manual selection
                  isManual: true,
                  timestamp: new Date().toISOString()
                });
              });
            },
            (error) => {
              console.error('Error getting location for map:', error);
              // Just center the map at a default location
              map.setCenter({ lat: 40.7128, lng: -74.0060 }); // New York
            }
          );
        }
      }
      
      // Add search box
      const input = document.createElement('input');
      input.placeholder = 'Search for a location';
      input.className = 'map-search-box';
      
      // Make the search box responsive - more space on mobile
      if (window.innerWidth < 768) {
        input.style.cssText = 'position:absolute;top:10px;left:10px;width:calc(100% - 20px);padding:8px;border:1px solid #ccc;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);font-size:14px;z-index:10;';
      } else {
        input.style.cssText = 'position:absolute;top:10px;left:110px;width:60%;padding:8px;border:1px solid #ccc;border-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:10;';
      }
      
      map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(input);
      
      const searchBox = new window.google.maps.places.SearchBox(input);
      
      // Listen for search box changes
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        
        if (places.length === 0) return;
        
        const place = places[0];
        
        if (!place.geometry || !place.geometry.location) return;
        
        // Center map at selected location
        map.setCenter(place.geometry.location);
        
        // Move marker
        if (markerRef.current) {
          markerRef.current.setPosition(place.geometry.location);
        } else {
          const marker = new window.google.maps.Marker({
            position: place.geometry.location,
            map: map,
            draggable: true,
            title: 'Your location'
          });
          markerRef.current = marker;
          
          // Listen for marker drag end
          marker.addListener('dragend', () => {
            const position = marker.getPosition();
            const newLat = position.lat();
            const newLng = position.lng();
            
            // Use more decimal places for higher precision
            const preciseLatitude = parseFloat(newLat.toFixed(7));
            const preciseLongitude = parseFloat(newLng.toFixed(7));
            
            // Update location
            setUserLocation({
              latitude: preciseLatitude,
              longitude: preciseLongitude,
              accuracy: 1, // High accuracy for manual selection
              isManual: true,
              timestamp: new Date().toISOString()
            });
          });
        }
        
        // Update location with precision
        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        
        const preciseLatitude = parseFloat(newLat.toFixed(7));
        const preciseLongitude = parseFloat(newLng.toFixed(7));
        
        setUserLocation({
          latitude: preciseLatitude,
          longitude: preciseLongitude,
          accuracy: 1, // High accuracy for search results
          isManual: true,
          timestamp: new Date().toISOString()
        });
      });
      
    } catch (error) {
      console.error('Error initializing Google Map:', error);
    }
  };

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
            latitude: parseFloat(latitude.toFixed(7)), 
            longitude: parseFloat(longitude.toFixed(7)), 
            accuracy, // in meters
            timestamp: new Date().toISOString() 
          });
          
          // Log for debugging
          console.log(`Location accuracy: ${accuracy} meters`);
          
          // Fetch nearby users with the obtained coordinates
          fetchNearbyUsers(parseFloat(latitude.toFixed(7)), parseFloat(longitude.toFixed(7)), filters.distance);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage;
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location services in your browser or use the map to set your location manually.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable. Please try again later or use the map to set your location manually.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again or use the map to set your location manually.";
              break;
            default:
              errorMessage = "An unknown error occurred while getting your location. Please use the map to set your location manually.";
          }
          
          setLocationError(errorMessage);
          setLocationLoading(false);
          setLoading(false);
          
          // Show map automatically when location detection fails
          setShowMap(true);
        },
        options
      );
    } else {
      setLocationError("Geolocation is not supported by this browser. Please use the map to set your location manually.");
      setLocationLoading(false);
      setLoading(false);
      
      // Show map automatically when geolocation is not supported
      setShowMap(true);
    }
  };
  
  const fetchNearbyUsers = async (latitude, longitude, distance) => {
    setLoading(true);
    try {
      console.log(`Fetching nearby users at coordinates: ${latitude}, ${longitude} within ${distance}km`);
      
      // Use the server-side location detection based on the passed coordinates
      const response = await api.getNearbyProfessionals(distance, latitude, longitude);
      
      if (!Array.isArray(response)) {
        console.error('Invalid response from getNearbyProfessionals:', response);
        setNearbyUsers([]);
        setLoading(false);
        return;
      }
      
      console.log(`Retrieved ${response.length} nearby users`);
      
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
    // On mobile, automatically hide filters after applying
    if (window.innerWidth < 768) {
      setShowFilters(false);
    }
  };

  const handleRefreshLocation = () => {
    getUserLocation();
  };

  const handleUseMap = () => {
    setShowMap(true);
  };

  const handleCloseMap = () => {
    setShowMap(false);
  };

  const handleConfirmMapLocation = () => {
    if (userLocation && userLocation.isManual) {
      fetchNearbyUsers(userLocation.latitude, userLocation.longitude, filters.distance);
    }
    setShowMap(false);
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
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 sm:gap-0">
        <h1 className="text-xl md:text-2xl font-bold">Nearby Professionals</h1>
        <div className="flex w-full sm:w-auto space-x-2 md:space-x-4">
          <button 
            onClick={() => navigate('/network/suggested')}
            className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            View Suggested
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none px-3 md:px-4 py-2 text-xs md:text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center"
          >
            <Sliders className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Map Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-3 md:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl overflow-hidden shadow-xl">
            <div className="flex justify-between items-center bg-orange-500 text-white p-3 md:p-4">
              <h3 className="text-base md:text-lg font-medium">Set Your Location</h3>
              <button onClick={handleCloseMap} className="text-white">
                <X className="h-5 w-5 md:h-6 md:w-6" />
              </button>
            </div>
            <div className="p-3 md:p-4">
              <p className="text-sm md:text-base text-gray-600 mb-2 md:mb-3">
                Drag the marker to your exact location or search for a place.
              </p>
              <div 
                ref={mapRef} 
                className="h-64 md:h-96 w-full bg-gray-100 rounded-lg"
                style={{ height: '250px', minHeight: '250px', maxHeight: '400px', '@media (min-width: 768px)': { height: '400px' } }}
              >
                {!mapLoaded && (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 md:h-10 md:w-10 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                )}
              </div>
              <div className="mt-3 md:mt-4 flex justify-end">
                <button
                  onClick={handleConfirmMapLocation}
                  className="px-3 md:px-4 py-2 text-xs md:text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Confirm Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Status */}
      <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-4 md:mb-6">
        {locationLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500 mr-2"></div>
            <span className="text-sm md:text-base text-gray-700">Getting your location...</span>
          </div>
        ) : locationError ? (
          <div className="flex flex-col md:flex-row md:items-center text-red-600">
            <AlertCircle className="h-5 w-5 mb-2 md:mb-0 md:mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm md:text-base">Location Error</p>
              <p className="text-xs md:text-sm">{locationError}</p>
              <div className="mt-2 flex space-x-3">
                <button 
                  onClick={handleRefreshLocation}
                  className="text-orange-500 text-xs md:text-sm hover:underline"
                >
                  Try Again
                </button>
                <button 
                  onClick={handleUseMap}
                  className="text-orange-500 text-xs md:text-sm hover:underline"
                >
                  Set Location Manually
                </button>
              </div>
            </div>
          </div>
        ) : userLocation ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-orange-600 mr-2" />
                <span className="text-sm md:text-base text-gray-700">
                  {userLocation.isManual ? 
                    'Using your manually selected location' : 
                    'Showing professionals near your current location'
                  }
                </span>
              </div>
              <div className="mt-2 sm:mt-0 sm:ml-auto flex space-x-3">
                <button 
                  onClick={handleRefreshLocation}
                  className="text-xs md:text-sm text-orange-500 hover:underline"
                >
                  Refresh Location
                </button>
                <button 
                  onClick={handleUseMap}
                  className="text-xs md:text-sm text-orange-500 hover:underline"
                >
                  Set Manually
                </button>
              </div>
            </div>
            <div className="mt-1 md:mt-2 text-xs text-gray-500">
              {userLocation.isManual ? 
                'Manually set locations provide the best accuracy.' :
                `Location accuracy: ${userLocation.accuracy ? `${Math.round(userLocation.accuracy)} meters` : 'Unknown'}`
              }
              {userLocation.accuracy > 1000 && !userLocation.isManual && (
                <span className="block sm:ml-2 sm:inline text-orange-500">
                  (Poor accuracy. Consider setting your location manually for better results)
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center text-yellow-600">
            <MapPin className="h-5 w-5 mr-2" />
            <span className="text-sm md:text-base">
              Unable to get your location. Please enable location services.
            </span>
            <button 
              onClick={handleUseMap}
              className="mt-2 sm:mt-0 sm:ml-3 text-orange-500 text-xs md:text-sm hover:underline"
            >
              Set Location Manually
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-3 md:p-4 mb-4 md:mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
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
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                name="industries"
                value={filters.industries}
                onChange={handleFilterChange}
                className="w-full border border-gray-300 rounded-md p-2 text-xs md:text-sm"
              >
                <option value="">All Industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
                placeholder="e.g. React, Marketing, Design"
                className="w-full border border-gray-300 rounded-md p-2 text-xs md:text-sm"
              />
            </div>
          </div>
          <div className="mt-3 md:mt-4 flex items-center">
            <input
              type="checkbox"
              name="availableForMeeting"
              id="availableForMeeting"
              checked={filters.availableForMeeting}
              onChange={handleFilterChange}
              className="mr-2"
            />
            <label htmlFor="availableForMeeting" className="text-xs md:text-sm text-gray-700">
              Only show users available for in-person meetings
            </label>
          </div>
          <div className="mt-3 md:mt-4">
            <button
              onClick={handleApplyFilters}
              className="bg-orange-500 text-white py-1.5 md:py-2 px-3 md:px-4 rounded-md text-xs md:text-sm hover:bg-orange-600 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48 md:h-64">
          <Loader />
        </div>
      ) : (
        <>
          {nearbyUsers.length === 0 ? (
            <div className="text-center py-6 md:py-10 bg-white rounded-lg shadow-md p-4 md:p-8">
              <div className="bg-orange-100 rounded-full h-16 w-16 md:h-20 md:w-20 flex items-center justify-center mx-auto mb-3 md:mb-4">
                <MapPin className="h-8 w-8 md:h-10 md:w-10 text-orange-500" />
              </div>
              <p className="text-sm md:text-base text-gray-600">No professionals found in your area.</p>
              <p className="text-sm md:text-base text-gray-600 mt-2">Try expanding your search distance or changing your filters.</p>
              <div className="mt-4 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={handleRefreshLocation}
                  className="px-4 py-2 text-xs md:text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Refresh Location
                </button>
                <button 
                  onClick={handleUseMap}
                  className="px-4 py-2 text-xs md:text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Set Location Manually
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
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
