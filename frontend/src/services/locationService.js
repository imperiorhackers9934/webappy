// Fixed Location Service to handle distance values properly

import api from './api'; // Adjust the path as needed
import socketManager from './socketmanager';

// Enhanced location service with better error handling and data validation
const locationService = {
  // Update location with better error handling
  updateLocation: async (latitude, longitude) => {
    // Validate input first
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || 
        isNaN(latitude) || isNaN(longitude)) {
      console.error('Invalid location data:', { latitude, longitude });
      return { 
        success: false, 
        error: 'Invalid location data' 
      };
    }

    // Ensure values are within valid ranges for latitude and longitude
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.error('Location coordinates out of valid range:', { latitude, longitude });
      return { 
        success: false, 
        error: 'Coordinates out of valid range' 
      };
    }

    // Format to 6 decimal places max (about 10cm precision) to avoid potential issues
    const formattedLatitude = parseFloat(latitude.toFixed(6));
    const formattedLongitude = parseFloat(longitude.toFixed(6));

    try {
      // First attempt - regular update
      const response = await api.put('/api/location', { 
        latitude: formattedLatitude, 
        longitude: formattedLongitude 
      });
      
      // Emit location update via Socket.IO if successful
      if (socketManager && socketManager.emit) {
        socketManager.emit('update_location', { 
          latitude: formattedLatitude, 
          longitude: formattedLongitude 
        });
      }
      
      return response.data;
    } catch (error) {
      console.log('Location update error (primary):', error);
      
      // If the regular update fails, try the continuous update endpoint as fallback
      try {
        // Retry with continuous location endpoint which might be more reliable
        const fallbackResponse = await api.post('/api/location/continuous-update', {
          latitude: formattedLatitude,
          longitude: formattedLongitude,
          accuracy: 10, // Default reasonable accuracy in meters
          heading: null,
          speed: null
        });
        
        console.log('Used fallback location update method');
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error('Location update error (fallback):', fallbackError);
        
        // Still emit update via socketManager if available, even if API call failed
        // This might still update the UI without requiring the API success
        if (socketManager && socketManager.emit) {
          socketManager.emit('update_location', { 
            latitude: formattedLatitude, 
            longitude: formattedLongitude 
          });
        }
        
        // Return a constructed mock response to prevent UI errors
        return { 
          success: false,
          locationUpdatedViaSocket: true,
          error: fallbackError.message || 'Location update failed'
        };
      }
    }
  },
  
  // Get nearby professionals without requiring a location update first
  // Fix for the distance.toFixed error by ensuring distance is a number
  getNearbyProfessionals: async (distance = 10, latitude = null, longitude = null) => {
    try {
      // Build the request parameters
      const params = { distance };
      
      // Add coordinates if provided
      if (latitude !== null && longitude !== null) {
        params.latitude = parseFloat(latitude.toFixed(6));
        params.longitude = parseFloat(longitude.toFixed(6));
      }
      
      // Make the API call
      const response = await api.get('/api/network/nearby', { params });
      
      // Process the response to ensure consistent format
      const professionals = Array.isArray(response.data) ? response.data : 
                          (response.data.professionals || []);
      
      // Map any necessary data transformations or enrichments
      // The key fix: Ensure distance is always a number before calling toFixed
      return professionals.map(prof => {
        // Create a new distance property that's guaranteed to be a number
        let distanceNum = null;
        
        if (typeof prof.distance === 'number') {
          distanceNum = prof.distance;
        } else if (typeof prof.distance === 'string') {
          // Try to parse the string to a number
          const parsed = parseFloat(prof.distance);
          if (!isNaN(parsed)) {
            distanceNum = parsed;
          }
        }
        
        return {
          ...prof,
          // Ensure these properties exist
          firstName: prof.firstName || '',
          lastName: prof.lastName || '',
          connectionStatus: prof.connectionStatus || 'none',
          // Format distance safely
          distanceFormatted: distanceNum !== null ? `${distanceNum.toFixed(1)} km` : 'nearby',
          // Keep the original distance for sorting
          distance: distanceNum
        };
      });
    } catch (error) {
      console.error('Error fetching nearby professionals:', error);
      
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  },

  // IP-based geolocation as a fallback when other methods fail
  getIPLocation: async () => {
    try {
      // First try server-side IP detection
      const response = await api.get('/api/location/ip');
      
      // If the server has an endpoint for IP location
      if (response.data && response.data.latitude && response.data.longitude) {
        return response.data;
      }
      
      // If server doesn't provide location or endpoint doesn't exist,
      // return a default location (could be configured per your app's needs)
      return { 
        latitude: 0, 
        longitude: 0,
        city: 'Unknown',
        region: 'Unknown',
        country: 'Unknown',
        isDefault: true
      };
    } catch (error) {
      console.error('Error in IP-based geolocation:', error);
      // Return a default location as fallback
      return { 
        latitude: 0, 
        longitude: 0,
        city: 'Unknown',
        region: 'Unknown',
        country: 'Unknown',
        isDefault: true,
        error: error.message
      };
    }
  }
};

export default locationService;
