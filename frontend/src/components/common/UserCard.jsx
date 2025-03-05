import React from 'react';
import { MapPin, Briefcase, Users, Check, UserPlus, MoreHorizontal } from 'lucide-react';

const UserCard = ({ user, distance, onConnect, onFollow, onViewProfile }) => {
  // Create a default image if user doesn't have a profile picture
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return 'U';
  };

  const connectionStatusButton = () => {
    if (user.isConnected) {
      return (
        <button
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-100"
          disabled
        >
          <Check className="w-4 h-4 mr-2" />
          Connected
        </button>
      );
    } else if (user.connectionStatus === 'pending') {
      return (
        <button
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-100"
          disabled
        >
          <Check className="w-4 h-4 mr-2" />
          Pending
        </button>
      );
    } else {
      return (
        <button
          onClick={onConnect}
          className="w-full flex items-center justify-center px-4 py-2 border border-blue-600 rounded-md text-blue-600 hover:bg-blue-50 transition"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Connect
        </button>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Cover Image or Background */}
      <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      
      <div className="p-4 relative">
        {/* Profile Picture */}
        <div className="absolute -top-12 left-4 rounded-full border-4 border-white overflow-hidden">
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={`${user.firstName} ${user.lastName}`} 
              className="w-20 h-20 object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-300 flex items-center justify-center text-lg font-semibold text-gray-600">
              {getInitials()}
            </div>
          )}
        </div>
        
        {/* User Info */}
        <div className="mt-10">
          <h3 className="text-lg font-semibold">
            {user.firstName} {user.lastName}
          </h3>
          
          <p className="text-gray-600 text-sm mt-1">{user.headline || 'Professional'}</p>
          
          {/* Location and Industry */}
          <div className="mt-3 space-y-1">
            {distance !== undefined && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{distance} km away</span>
              </div>
            )}
            
            {user.industry && (
              <div className="flex items-center text-sm text-gray-600">
                <Briefcase className="w-4 h-4 mr-1" />
                <span>{user.industry}</span>
              </div>
            )}
            
            {user.mutualConnections > 0 && (
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-1" />
                <span>{user.mutualConnections} mutual connection{user.mutualConnections !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          
          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {user.skills.slice(0, 3).map((skill, index) => (
                  <span 
                    key={index} 
                    className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-700"
                  >
                    {typeof skill === 'string' ? skill : skill.name}
                  </span>
                ))}
                {user.skills.length > 3 && (
                  <span className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs text-gray-700">
                    +{user.skills.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-4 flex space-x-2">
            {connectionStatusButton()}
            
            <button
              onClick={onViewProfile}
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 transition"
            >
              View Profile
            </button>
            
            <button className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;