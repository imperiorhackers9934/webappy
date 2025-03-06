import React from 'react';
import { UserPlus, User, UserCheck, Eye, Heart } from 'lucide-react'; // Assuming you're using lucide-react for icons

const UserCard = ({ user, onConnect, onFollow, onViewProfile, theme = 'orange' }) => {
  const {
    _id,
    firstName,
    lastName,
    profilePicture,
    headline,
    industry,
    location,
    connectionStatus,
    isFollowing,
    mutualConnections
  } = user;

  // Theme configuration
  const themeConfig = {
    orange: {
      connectBtn: connectionStatus === 'pending' 
        ? 'bg-orange-100 text-orange-600' 
        : 'bg-orange-500 hover:bg-orange-600 text-white',
      followBtn: isFollowing
        ? 'bg-orange-100 text-orange-600'
        : 'bg-white border border-orange-500 text-orange-500 hover:bg-orange-50',
      viewBtn: 'text-orange-500 hover:text-orange-600',
      cardBorder: 'border-l-4 border-orange-500'
    },
    blue: {
      connectBtn: connectionStatus === 'pending' 
        ? 'bg-blue-100 text-blue-600' 
        : 'bg-blue-600 hover:bg-blue-700 text-white',
      followBtn: isFollowing
        ? 'bg-blue-100 text-blue-600'
        : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50',
      viewBtn: 'text-blue-600 hover:text-blue-700',
      cardBorder: 'border-l-4 border-blue-500'
    }
  };

  const styles = themeConfig[theme] || themeConfig.orange;

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${styles.cardBorder}`}>
      <div className="p-4">
        <div className="flex items-start mb-4">
          <div className="flex-shrink-0 mr-3">
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt={`${firstName} ${lastName}`} 
                className="h-14 w-14 rounded-lg object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl">
                {firstName?.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{firstName} {lastName}</h3>
            <p className="text-sm text-gray-600">{headline || 'Professional'}</p>
            {industry && <p className="text-xs text-gray-500 mt-1">{industry}</p>}
            {location?.address && (
              <p className="text-xs text-gray-500 mt-1">{location.address}</p>
            )}
          </div>
        </div>
        
        {mutualConnections > 0 && (
          <div className="text-xs text-gray-500 mb-3 flex items-center">
            <UserCheck className="h-3 w-3 mr-1" />
            {mutualConnections} mutual connection{mutualConnections !== 1 ? 's' : ''}
          </div>
        )}
        
        <div className="flex space-x-2 mt-4">
          <button
            onClick={onConnect}
            disabled={connectionStatus === 'pending' || connectionStatus === 'connected'}
            className={`flex items-center px-3 py-1.5 rounded text-sm ${styles.connectBtn} transition ${
              connectionStatus === 'connected' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {connectionStatus === 'pending' ? (
              <>
                <UserCheck className="h-4 w-4 mr-1" />
                Pending
              </>
            ) : connectionStatus === 'connected' ? (
              <>
                <UserCheck className="h-4 w-4 mr-1" />
                Connected
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-1" />
                Connect
              </>
            )}
          </button>
          
          <button
            onClick={onFollow}
            className={`flex items-center px-3 py-1.5 rounded text-sm ${styles.followBtn} transition`}
          >
            <Heart className={`h-4 w-4 mr-1 ${isFollowing ? 'fill-orange-500' : ''}`} />
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          
          <button
            onClick={onViewProfile}
            className={`flex items-center px-3 py-1.5 rounded text-sm ${styles.viewBtn} transition ml-auto`}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
