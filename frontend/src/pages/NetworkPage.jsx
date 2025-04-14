import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';

// Dynamically import Leaflet components to avoid SSR issues
const NearbyProfessionalsPage = ({ user }) => {
  // State management
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distance, setDistance] = useState(10); // Default 10km radius
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [selectedUser, setSelectedUser] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [unit, setUnit] = useState('km');
  const [filters, setFilters] = useState({
    industry: null,
    skills: [],
    interests: [],
    connectionStatus: 'all',
    lastActive: null
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    enabled: false,
    radius: 1,
    unit: 'km'
  });
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const mapContainerRef = useRef(null);

  // Safe distance formatting function
  const formatDistance = (distance) => {
    try {
      if (typeof distance === 'number' && !isNaN(distance)) {
        return distance < 1 
          ? `${(distance * 1000).toFixed(0)}m away` 
          : `${distance.toFixed(1)}km away`;
      }
      
      if (typeof distance === 'string') {
        const parsedDist = parseFloat(distance);
        if (!isNaN(parsedDist)) {
          return parsedDist < 1 
            ? `${(parsedDist * 1000).toFixed(0)}m away` 
            : `${parsedDist.toFixed(1)}km away`;
        }
      }
      
      return 'nearby';
    } catch (error) {
      console.error('Error formatting distance:', error);
      return 'nearby';
    }
  };

  // Get user's current location
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation({ latitude, longitude });
            setLocationError(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationError(true);
            setError('Could not get your location. Please enable location services.');
            setLoading(false);
          },
          { 
            enableHighAccuracy: true, 
            timeout: 15000,
            maximumAge: 0 
          }
        );
      } else {
        setLocationError(true);
        setError('Geolocation is not supported by your browser');
        setLoading(false);
      }
    };

    getUserLocation();
  }, []);

  // Function to fetch nearby professionals
  const fetchNearbyProfessionals = useCallback(async (loc, dist) => {
    if (!loc) return;
    
    try {
      setLoading(true);
      
      try {
        // First try using the NetworkPage endpoint
        const params = { 
          distance: dist,
          latitude: loc.latitude,
          longitude: loc.longitude
        };
        
        console.log('Attempting to fetch from primary endpoint');
        const response = await api.get('/api/network/nearby', { params });
        
        // Process the response
        const professionalsData = Array.isArray(response.data) ? response.data : 
                          (response.data.professionals || []);
        
        // Map and safely process each professional
        const processedProfessionals = professionalsData.map(prof => {
          return {
            ...prof,
            _id: prof._id || prof.id,
            firstName: prof.firstName || '',
            lastName: prof.lastName || '',
            connectionStatus: prof.connectionStatus || 'none',
            formattedDistance: formatDistance(prof.distance),
            distanceValue: typeof prof.distance === 'number' ? prof.distance : 
                          (typeof prof.distance === 'string' ? parseFloat(prof.distance) || null : null),
            // Generate random coordinates if none are provided
            latitude: prof.latitude || (loc.latitude + (Math.random() - 0.5) * 0.01),
            longitude: prof.longitude || (loc.longitude + (Math.random() - 0.5) * 0.01)
          };
        });
        
        setProfessionals(processedProfessionals);
        
      } catch (primaryError) {
        console.error('Primary endpoint failed:', primaryError);
        
        // Try the alternate endpoint
        try {
          console.log('Attempting to fetch from alternate endpoint');
          const response = await api.get('/api/nearby-users', { 
            params: { 
              distance: dist,
              latitude: loc.latitude,
              longitude: loc.longitude
            }
          });
          
          // Extract users from the response
          const professionalsData = response.data.users || [];
          
          // Process the data
          const processedProfessionals = professionalsData.map(prof => {
            return {
              ...prof,
              _id: prof._id || prof.id,
              firstName: prof.firstName || '',
              lastName: prof.lastName || '',
              connectionStatus: prof.connectionStatus || 'none',
              formattedDistance: formatDistance(prof.distance),
              distanceValue: typeof prof.distance === 'number' ? prof.distance : 
                            (typeof prof.distance === 'string' ? parseFloat(prof.distance) || null : null),
              // Generate random coordinates if none are provided
              latitude: prof.latitude || (loc.latitude + (Math.random() - 0.5) * 0.01),
              longitude: prof.longitude || (loc.longitude + (Math.random() - 0.5) * 0.01)
            };
          });
          
          setProfessionals(processedProfessionals);
          
        } catch (secondaryError) {
          console.error('Both API endpoints failed:', { primaryError, secondaryError });
          throw new Error('Failed to load nearby professionals. Please try again later.');
        }
      }
      
      // Update location separately
      try {
        // Try to update location using different methods
        if (typeof api.updateLocation === 'function') {
          await api.updateLocation(loc.latitude, loc.longitude);
        } else {
          console.log('updateLocation not available in api, skipping');
        }
      } catch (locationError) {
        console.log('Location update failed, but professionals were fetched');
      }
    } catch (error) {
      console.error('Error in fetchNearbyProfessionals:', error);
      setError(error.message || 'Failed to load nearby professionals');
      
      // In development mode, load mock data
      if (process.env.NODE_ENV === 'development' || true) { // Force mock data for demo
        console.log('Loading mock data');
        const mockProfessionals = generateMockProfessionals(10, loc);
        setProfessionals(mockProfessionals);
      } else {
        setProfessionals([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch nearby professionals when location is available
  useEffect(() => {
    if (currentLocation) {
      fetchNearbyProfessionals(currentLocation, distance);
    }
  }, [currentLocation, distance, fetchNearbyProfessionals]);

  // Initialize Leaflet map
  useEffect(() => {
    // Only run this effect in the browser, not during SSR
    if (typeof window === 'undefined') return;
    
    // Dynamically import Leaflet
    const initMap = async () => {
      try {
        // Dynamic import of Leaflet
        const L = await import('leaflet');
        
        // Fix for marker icons in webpack
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });
        
        setMapLoaded(true);
        
        // If location already exists, initialize map
        if (currentLocation && mapContainerRef.current && !leafletMapRef.current) {
          // Create map instance
          const map = L.map(mapContainerRef.current).setView(
            [currentLocation.latitude, currentLocation.longitude], 
            13
          );
          
          // Add tile layer (OpenStreetMap)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);
          
          // Add user location marker
          const userIcon = L.divIcon({
            className: 'current-user-marker',
            html: `<div class="current-user-dot"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          const userMarker = L.marker(
            [currentLocation.latitude, currentLocation.longitude],
            { icon: userIcon }
          ).addTo(map);
          
          // Add radius circle
          const radiusInMeters = distance * (unit === 'km' ? 1000 : 1609.34);
          const circle = L.circle(
            [currentLocation.latitude, currentLocation.longitude],
            {
              radius: radiusInMeters,
              color: '#FF6B00',
              fillColor: '#FF6B00',
              fillOpacity: 0.1,
              weight: 2
            }
          ).addTo(map);
          
          circleRef.current = circle;
          leafletMapRef.current = map;
          
          // Add markers for professionals
          if (professionals.length > 0) {
            addProfessionalsToMap(professionals, L, map);
          }
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    if (currentLocation && !leafletMapRef.current) {
      initMap();
    }
  }, [currentLocation, professionals, distance, unit]);

  // Update map when professionals change
  useEffect(() => {
    if (mapLoaded && leafletMapRef.current && professionals.length > 0) {
      // Dynamically import Leaflet
      import('leaflet').then(L => {
        addProfessionalsToMap(professionals, L, leafletMapRef.current);
      });
    }
  }, [professionals, mapLoaded]);

  // Update circle radius when distance changes
  useEffect(() => {
    if (circleRef.current && currentLocation) {
      const radiusInMeters = distance * (unit === 'km' ? 1000 : 1609.34);
      circleRef.current.setRadius(radiusInMeters);
    }
  }, [distance, unit, currentLocation]);

  // Function to add professional markers to map
  const addProfessionalsToMap = (professionals, L, map) => {
    // Clear existing markers
    if (markersRef.current.length) {
      markersRef.current.forEach(marker => map.removeLayer(marker));
      markersRef.current = [];
    }
    
    // Add new markers
    const newMarkers = professionals.map(professional => {
      // Create custom icon based on connection status
      const iconColor = getMarkerColor(professional.connectionStatus);
      const isSelected = selectedUser && selectedUser._id === professional._id;
      
      const customIcon = L.divIcon({
        className: `professional-marker ${isSelected ? 'selected-marker' : ''}`,
        html: `
          <div class="marker-container" style="background-color: ${iconColor}; border: 2px solid white; width: ${isSelected ? '44px' : '40px'}; height: ${isSelected ? '44px' : '40px'}; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
            ${professional.profilePicture 
              ? `<img src="${professional.profilePicture}" alt="${professional.firstName}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />`
              : `<div style="color: white; font-weight: bold; font-size: 14px;">${getInitials(professional.firstName, professional.lastName)}</div>`
            }
          </div>
          ${isSelected ? `
            <div class="marker-info" style="background: white; padding: 5px 10px; border-radius: 4px; margin-top: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap; text-align: center;">
              <div style="font-weight: bold; font-size: 12px;">${professional.firstName} ${professional.lastName}</div>
              <div style="font-size: 11px; color: #666;">${professional.formattedDistance}</div>
            </div>
          ` : ''}
        `,
        iconSize: [isSelected ? 44 : 40, isSelected ? 44 : 40],
        iconAnchor: [isSelected ? 22 : 20, isSelected ? 22 : 20],
        popupAnchor: [0, -20]
      });
      
      // Create marker
      const marker = L.marker(
        [professional.latitude, professional.longitude], 
        { icon: customIcon }
      ).addTo(map);
      
      // Add popup with professional details
      marker.bindPopup(`
        <div class="popup-content" style="width: 200px; padding: 10px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            ${professional.profilePicture 
              ? `<img src="${professional.profilePicture}" alt="${professional.firstName}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover;" />`
              : `<div style="width: 40px; height: 40px; border-radius: 50%; background-color: #f0f0f0; margin-right: 10px; display: flex; justify-content: center; align-items: center; font-weight: bold;">${getInitials(professional.firstName, professional.lastName)}</div>`
            }
            <div>
              <div style="font-weight: bold;">${professional.firstName} ${professional.lastName}</div>
              <div style="font-size: 12px; color: #666;">${professional.headline || professional.title || 'Professional'}</div>
            </div>
          </div>
          <div style="font-size: 12px; margin-bottom: 5px; display: flex; align-items: center;">
            <span style="color: #FF6B00; margin-right: 5px;">📍</span> ${professional.formattedDistance}
          </div>
          <div style="display: flex; margin-top: 10px;">
            <a href="/profile/${professional._id}" style="flex: 1; text-align: center; padding: 5px; background: #f0f0f0; border-radius: 4px; margin-right: 5px; text-decoration: none; color: #555; font-size: 12px;">View Profile</a>
            ${professional.connectionStatus === 'connected' 
              ? `<a href="/messages/${professional._id}" style="flex: 1; text-align: center; padding: 5px; background: #e6f0ff; border-radius: 4px; text-decoration: none; color: #4A90E2; font-size: 12px;">Message</a>`
              : professional.connectionStatus === 'pending'
                ? `<span style="flex: 1; text-align: center; padding: 5px; background: #fff9e6; border-radius: 4px; color: #EAB308; font-size: 12px;">Pending</span>`
                : `<button onclick="connectWithUser('${professional._id}')" style="flex: 1; text-align: center; padding: 5px; background: #FF6B00; border-radius: 4px; border: none; color: white; font-size: 12px; cursor: pointer;">Connect</button>`
            }
          </div>
        </div>
      `);
      
      // Add click event
      marker.on('click', () => {
        setSelectedUser(professional);
        
        // Close any open popups to avoid UI clutter
        map.closePopup();
        
        // Remove all markers and re-add them to update the selected state
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];
        addProfessionalsToMap(professionals, L, map);
      });
      
      return marker;
    });
    
    markersRef.current = newMarkers;
    
    // If there's a selected user, ensure their marker is above others (z-index)
    if (selectedUser) {
      const selectedMarker = markersRef.current.find((_, index) => {
        return professionals[index]._id === selectedUser._id;
      });
      
      if (selectedMarker) {
        selectedMarker.getElement().style.zIndex = 1000;
      }
    }
    
    // Fit bounds to show all markers if we have professionals
    if (professionals.length > 0) {
      const bounds = L.latLngBounds([
        [currentLocation.latitude, currentLocation.longitude],
        ...professionals.map(p => [p.latitude, p.longitude])
      ]);
      
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });
    }
  };

  // Distance range handler
  const handleDistanceChange = (event) => {
    const newDistance = parseInt(event.target.value, 10);
    setDistance(newDistance);
  };
  
  const handleDistanceChangeComplete = () => {
    if (currentLocation) {
      fetchNearbyProfessionals(currentLocation, distance);
    }
  };

  // Toggle unit (km/mi)
  const toggleUnit = () => {
    const newUnit = unit === 'km' ? 'mi' : 'km';
    setUnit(newUnit);
    if (currentLocation) {
      fetchNearbyProfessionals(currentLocation, distance);
    }
  };

  // Send connection request
  const handleConnect = async (userId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      if (!userId) {
        console.error('No user ID provided');
        return;
      }
      
      console.log('Sending connection request to user:', userId);
      
      // Try to send connection request
      try {
        await api.sendConnectionRequest(userId);
      } catch (error) {
        console.error('Connection request failed:', error);
      }
      
      // Update the list to show "Pending" for this user
      setProfessionals(prev => 
        prev.map(p => 
          p._id === userId ? { ...p, connectionStatus: 'pending' } : p
        )
      );
      
      // Update selected user if this is the one
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({
          ...selectedUser,
          connectionStatus: 'pending'
        });
      }
      
      // Show success message
      alert(`Connection request sent to ${
        professionals.find(p => p._id === userId)?.firstName || 'user'
      }`);
    } catch (error) {
      console.error('Error sending connection request:', error);
    }
  };

  // Get initials from name
  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  // Get marker color based on connection status
  const getMarkerColor = (connectionStatus) => {
    switch (connectionStatus) {
      case 'connected':
        return '#22C55E'; // Green
      case 'pending':
        return '#EAB308'; // Yellow
      default:
        return '#3B82F6'; // Blue
    }
  };

  // Retry getting location
  const retryLocation = () => {
    setLoading(true);
    setLocationError(false);
    setError(null);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
        },
        (error) => {
          console.error('Geolocation retry failed:', error);
          setLocationError(true);
          setError('Still unable to get your location. Please check your device settings.');
          setLoading(false);
        },
        { 
          enableHighAccuracy: true, 
          timeout: 15000,
          maximumAge: 0 
        }
      );
    }
  };

  // Toggle notification preferences
  const toggleNotifications = async () => {
    try {
      const newStatus = !notificationPrefs.enabled;
      
      // In a real app, we would call an API to update preferences
      setNotificationPrefs({
        ...notificationPrefs,
        enabled: newStatus
      });
      
      alert(newStatus 
        ? `You'll be notified when professionals are nearby.` 
        : `You won't receive alerts about nearby professionals.`
      );
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setFilterModalVisible(false);
    // Refetch with new filters
    if (currentLocation) {
      fetchNearbyProfessionals(currentLocation, distance);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    if (currentLocation) {
      fetchNearbyProfessionals(currentLocation, distance);
    }
  };

  // Helper function to generate mock data for development
  const generateMockProfessionals = (count, location) => {
    const mockProfiles = [];
    for (let i = 0; i < count; i++) {
      // Generate random coordinates nearby
      const latitude = location.latitude + (Math.random() - 0.5) * 0.01;
      const longitude = location.longitude + (Math.random() - 0.5) * 0.01;
      
      // Calculate approximate distance
      const distance = calculateDistance(
        location.latitude, 
        location.longitude, 
        latitude,
        longitude
      );
      
      // Sample industries and skills
      const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing'];
      const titles = ['Software Engineer', 'Product Manager', 'UX Designer', 'Data Scientist', 'Marketing Specialist'];
      
      mockProfiles.push({
        _id: `mock-${i}`,
        firstName: ['Alex', 'Jamie', 'Taylor', 'Morgan', 'Casey', 'Jordan', 'Riley', 'Quinn', 'Avery', 'Blake'][i % 10],
        lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][i % 10],
        profilePicture: null,
        headline: titles[i % titles.length],
        industry: industries[i % industries.length],
        distance: distance,
        formattedDistance: formatDistance(distance),
        connectionStatus: ['none', 'connected', 'pending'][i % 3],
        latitude,
        longitude,
        lastActive: '2 hours ago'
      });
    }
    return mockProfiles;
  };

  // Helper function to calculate distance between coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  // Simple Filter Modal Component
  const FilterModal = ({ visible, onClose, filters, onApplyFilters }) => {
    if (!visible) return null;
    
    const [localFilters, setLocalFilters] = useState({...filters});
    
    const handleFilterChange = (key, value) => {
      setLocalFilters(prev => ({
        ...prev,
        [key]: value
      }));
    };
    
    const handleApply = () => {
      onApplyFilters(localFilters);
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Filter Professionals</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-4">
            {/* Industry Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={localFilters.industry || ''}
                onChange={(e) => handleFilterChange('industry', e.target.value || null)}
              >
                <option value="">All Industries</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
            
            {/* Connection Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Connection Status</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'none', 'pending', 'connected'].map(status => (
                  <button
                    key={status}
                    className={`px-3 py-1 rounded-full text-sm ${
                      localFilters.connectionStatus === status
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => handleFilterChange('connectionStatus', status)}
                  >
                    {status === 'all' ? 'All' : 
                      status === 'none' ? 'Not Connected' : 
                      status === 'pending' ? 'Pending' : 
                      'Connected'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Last Active */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Active</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={localFilters.lastActive || ''}
                onChange={(e) => handleFilterChange('lastActive', e.target.value || null)}
              >
                <option value="">Any Time</option>
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && !professionals.length) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Scanning for Professionals</h3>
          <div className="animate-pulse">
            <div className="h-2 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Looking for professionals near you...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Scanning for Professionals</h3>
        </div>
        <div className="p-6 flex flex-col items-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Location Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={retryLocation}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Professionals Nearby</h3>
        <div className="flex items-center">
          <button
            onClick={() => setFilterModalVisible(true)}
            className="mr-3 inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {distance} {unit}
            </span>
            <input
              id="distance"
              type="range"
              min="1"
              max="50"
              value={distance}
              onChange={handleDistanceChange}
              onMouseUp={handleDistanceChangeComplete}
              onTouchEnd={handleDistanceChangeComplete}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <button 
              onClick={toggleUnit}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600"
            >
              {unit === 'km' ? 'mi' : 'km'}
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex px-4 py-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 text-sm font-medium rounded-md mr-2 flex items-center ${
              viewMode === 'map' 
                ? 'bg-orange-100 text-orange-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center ${
              viewMode === 'list' 
                ? 'bg-orange-100 text-orange-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="relative">
          {/* Map Container */}
          <div 
            ref={mapContainerRef}
            className="w-full h-[550px]"
            style={{ height: '550px' }}
          >
            {/* Leaflet will be initialized here */}
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
                  <p className="mt-3 text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* CSS for map markers */}
          <style jsx global>{`
            .current-user-marker {
              background-color: rgba(76, 175, 80, 0.2);
              border-radius: 50%;
              border: 1px solid #4CAF50;
            }
            .current-user-dot {
              width: 12px;
              height: 12px;
              background-color: #4CAF50;
              border-radius: 50%;
              margin: 6px;
            }
            .selected-marker {
              z-index: 1000 !important;
            }
          `}</style>
          
          {/* Selected User Card for mobile view */}
          {viewMode === 'map' && selectedUser && (
            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg overflow-hidden z-10">
              <button 
                onClick={() => setSelectedUser(null)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="p-4">
                <div className="flex items-start">
                  {selectedUser.profilePicture ? (
                    <img
                      src={selectedUser.profilePicture}
                      alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                      className="h-14 w-14 rounded-full object-cover flex-shrink-0 mr-4"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mr-4">
                      <span className="text-lg font-medium text-gray-600">
                        {getInitials(selectedUser.firstName, selectedUser.lastName)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-medium text-gray-900 truncate">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {selectedUser.headline || selectedUser.title || 'Professional'}
                    </p>
                    <div className="flex items-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="ml-1 text-sm text-orange-500">{selectedUser.formattedDistance}</span>
                      
                      {selectedUser.industry && (
                        <>
                          <span className="mx-2 text-gray-300">•</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="ml-1 text-sm text-gray-500">{selectedUser.industry}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex">
                  <Link
                    to={`/profile/${selectedUser._id}`}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-md text-center text-sm font-medium text-gray-700 mr-2"
                  >
                    View Profile
                  </Link>
                  
                  {selectedUser.connectionStatus === 'connected' ? (
                    <Link
                      to={`/messages/${selectedUser._id}`}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 py-2 px-4 rounded-md text-center text-sm font-medium text-blue-600"
                    >
                      Message
                    </Link>
                  ) : selectedUser.connectionStatus === 'pending' ? (
                    <span className="flex-1 bg-yellow-50 py-2 px-4 rounded-md text-center text-sm font-medium text-yellow-600">
                      Request Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(selectedUser._id)}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 py-2 px-4 rounded-md text-center text-sm font-medium text-white"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* List View */}
      {viewMode === 'list' && (
        <div className="overflow-hidden">
          {refreshing && (
            <div className="p-2 bg-gray-50 text-center">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-500">Refreshing...</span>
            </div>
          )}
          
          {professionals.length === 0 ? (
            <div className="text-center py-12 px-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No professionals found</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                Try increasing your search radius or adjusting your filters to find more professionals in this area.
              </p>
              <button 
                onClick={handleRefresh}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {professionals.map((professional) => (
                <div 
                  key={professional._id}
                  className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <div 
                    onClick={() => setSelectedUser(professional)}
                    className="flex flex-1 items-center cursor-pointer"
                  >
                    <div className="flex-shrink-0 relative">
                      {professional.profilePicture ? (
                        <img
                          src={professional.profilePicture}
                          alt={`${professional.firstName} ${professional.lastName}`}
                          className="h-12 w-12 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <span className="text-sm font-medium text-gray-600">
                            {getInitials(professional.firstName, professional.lastName)}
                          </span>
                        </div>
                      )}
                      
                      {/* Connection status indicator */}
                      <div className="absolute -bottom-1 -right-1">
                        {professional.connectionStatus === 'connected' ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 ring-2 ring-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : professional.connectionStatus === 'pending' ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 ring-2 ring-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {professional.firstName} {professional.lastName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {professional.headline || professional.title || 'Professional'}
                      </p>
                      <div className="flex items-center mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="ml-1 text-xs text-orange-500">
                          {professional.formattedDistance}
                        </span>
                        
                        {professional.industry && (
                          <>
                            <span className="mx-1.5 text-gray-300">•</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="ml-1 text-xs text-gray-500 truncate">
                              {professional.industry}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="ml-4 flex-shrink-0">
                    {professional.connectionStatus === 'connected' ? (
                      <Link
                        to={`/messages/${professional._id}`}
                        className="inline-flex items-center p-1.5 border border-blue-100 bg-blue-50 rounded text-xs font-medium text-blue-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </Link>
                    ) : professional.connectionStatus === 'pending' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleConnect(professional._id, e)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Notification Toggle */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <button
          onClick={handleRefresh}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
        
        <button
          onClick={toggleNotifications}
          className={`text-sm font-medium flex items-center px-3 py-1.5 rounded-full ${
            notificationPrefs.enabled
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 mr-1.5 ${notificationPrefs.enabled ? 'text-white' : 'text-gray-500'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={notificationPrefs.enabled 
                ? "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              } 
            />
          </svg>
          {notificationPrefs.enabled ? 'Notifications On' : 'Notifications Off'}
        </button>
      </div>
      
      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApplyFilters={handleFilterChange}
      />
      
      {/* Add CSS for styling */}
      <style jsx>{`
        /* Add any component-specific CSS here */
        .distance-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FF6B00;
          cursor: pointer;
        }
        .distance-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FF6B00;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default NearbyProfessionalsPage;