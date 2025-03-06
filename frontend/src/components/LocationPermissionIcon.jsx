// Enhanced location permission icon with better tooltip
// Save this as components/LocationPermissionIcon.jsx

import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Map } from 'lucide-react'; // Using Lucide icons
import Tooltip from './common/Tooltip'; // Import the Tooltip component

const LocationPermissionIcon = () => {
  const [permissionState, setPermissionState] = useState('checking');
  const [showTooltip, setShowTooltip] = useState(false);
  // States: 'checking', 'granted', 'denied', 'prompt', 'unsupported'

  useEffect(() => {
    checkLocationPermission();
    
    // Periodically check permission status
    const intervalId = setInterval(() => {
      checkLocationPermission();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  const checkLocationPermission = () => {
    if (!navigator.geolocation) {
      setPermissionState('unsupported');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          console.log('Permission state:', result.state);
          setPermissionState(result.state);
          
          // Listen for changes to permission state
          result.onchange = () => {
            console.log('Permission state changed:', result.state);
            setPermissionState(result.state);
          };
        })
        .catch(error => {
          console.error('Error checking permission:', error);
          // Fallback to direct check
          directPermissionCheck();
        });
    } else {
      // Browsers without permissions API
      directPermissionCheck();
    }
  };

  const directPermissionCheck = () => {
    // Try to get location as a test
    navigator.geolocation.getCurrentPosition(
      // Success - permission granted
      () => setPermissionState('granted'),
      // Error - probably denied or prompt needed
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
        } else {
          setPermissionState('prompt');
        }
      },
      { timeout: 5000, maximumAge: 0 }
    );
  };

  const requestPermission = () => {
    // If already granted, don't do anything
    if (permissionState === 'granted') return;
    
    console.log('Requesting location permission...');
    setShowTooltip(true);
    
    // Request location permission
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location permission granted:', position);
        setPermissionState('granted');
        
        // Hide tooltip after success
        setTimeout(() => {
          setShowTooltip(false);
        }, 1500);
      },
      (error) => {
        console.error('Location permission error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Don't show anything if permission is granted or still checking
  if (permissionState === 'granted' || permissionState === 'checking') {
    return null;
  }

  // Determine tooltip content based on state
  const getTooltipContent = () => {
    if (permissionState === 'prompt') {
      return 'Click to enable location sharing for nearby connections';
    } else if (permissionState === 'denied') {
      return (
        <div>
          <p className="font-bold mb-1">Location access blocked</p>
          <p>Please enable location in your browser settings to use nearby features</p>
        </div>
      );
    } else if (permissionState === 'unsupported') {
      return 'Your browser doesn\'t support location services';
    }
    return '';
  };

  // Determine icon style based on state
  const getIconStyles = () => {
    if (permissionState === 'denied') {
      return 'bg-red-500 hover:bg-red-600';
    } else if (permissionState === 'unsupported') {
      return 'bg-gray-500 hover:bg-gray-600';
    }
    return 'bg-orange-500 hover:bg-orange-600';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Tooltip 
        content={getTooltipContent()}
        position="top"
        visible={showTooltip}
      >
        <button
          onClick={requestPermission}
          className={`flex items-center justify-center w-14 h-14 rounded-full ${getIconStyles()} text-white shadow-lg transition-colors focus:outline-none`}
          aria-label="Enable location services"
        >
          {permissionState === 'denied' ? (
            <AlertCircle size={24} />
          ) : (
            <MapPin size={24} />
          )}
          
          {/* Pulse animation for the prompt state */}
          {permissionState === 'prompt' && (
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500"></span>
            </span>
          )}
        </button>
      </Tooltip>
    </div>
  );
};

export default LocationPermissionIcon;
