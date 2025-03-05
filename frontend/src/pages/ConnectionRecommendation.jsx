import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, X, Check, ChevronLeft, Clock, Briefcase, MapPin, Users, RefreshCw } from 'lucide-react';
import api from '../services/api';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';

const ConnectionRequestPage = () => {
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingIds, setProcessingIds] = useState(new Set());

  const fetchConnectionRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching connection requests...');
      
      // Check if method exists
      if (typeof api.getConnectionRequests !== 'function') {
        console.error('api.getConnectionRequests is not a function');
        
        // Fallback method if direct method doesn't exist
        // Try to use the network service directly
        if (api.networkService && typeof api.networkService.getConnectionRequests === 'function') {
          console.log('Using networkService.getConnectionRequests instead');
          const response = await api.networkService.getConnectionRequests();
          handleResponse(response);
          return;
        }
        
        throw new Error('Connection requests API not available');
      }
      
      const response = await api.getConnectionRequests();
      handleResponse(response);
    } catch (err) {
      console.error('Error fetching connection requests:', err);
      setError('Failed to load connection requests data. ' + (err.message || ''));
      setLoading(false);
      
      // Uncomment this for development/testing when API is not ready
      // console.log('Loading mock data for development');
      // setConnectionRequests(getMockConnectionRequests());
      // setLoading(false);
    }
  };
  
  const handleResponse = (response) => {
    console.log('Connection requests response:', response);
    
    // Check if we have the expected response structure
    if (response && typeof response === 'object') {
      // Handle different possible response structures
      const requests = response.requests || response.connectionRequests || response.data || [];
      console.log('Parsed requests:', requests);
      setConnectionRequests(Array.isArray(requests) ? requests : []);
    } else {
      console.error('Unexpected response format:', response);
      setConnectionRequests([]);
    }
    
    setLoading(false);
  };
  
  const getMockConnectionRequests = () => {
    return [
      {
        _id: 'req1',
        sender: {
          _id: 'user1',
          firstName: 'Jane',
          lastName: 'Smith',
          headline: 'Senior Developer at Tech Co',
          company: 'Tech Co',
          location: 'San Francisco, CA',
          profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg',
          mutualConnections: 12
        },
        message: 'I saw your work on the React project and would love to connect!',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        _id: 'req2',
        sender: {
          _id: 'user2',
          firstName: 'Michael',
          lastName: 'Johnson',
          headline: 'Product Manager',
          company: 'Innovation Inc',
          location: 'Boston, MA',
          profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
          mutualConnections: 5
        },
        message: null,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  };

  useEffect(() => {
    fetchConnectionRequests();
  }, []);

  const handleAccept = async (userId) => {
    try {
      setProcessingIds(prev => new Set([...prev, userId]));
      await api.acceptConnection(userId);
      setConnectionRequests(prev => prev.filter(request => request.sender._id !== userId));
      setProcessingIds(prev => {
        const updated = new Set([...prev]);
        updated.delete(userId);
        return updated;
      });
    } catch (err) {
      console.error('Error accepting connection:', err);
      setError('Failed to accept connection');
      setProcessingIds(prev => {
        const updated = new Set([...prev]);
        updated.delete(userId);
        return updated;
      });
    }
  };

  const handleDecline = async (userId) => {
    try {
      setProcessingIds(prev => new Set([...prev, userId]));
      await api.declineConnection(userId);
      setConnectionRequests(prev => prev.filter(request => request.sender._id !== userId));
      setProcessingIds(prev => {
        const updated = new Set([...prev]);
        updated.delete(userId);
        return updated;
      });
    } catch (err) {
      console.error('Error declining connection:', err);
      setError('Failed to decline connection');
      setProcessingIds(prev => {
        const updated = new Set([...prev]);
        updated.delete(userId);
        return updated;
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <Loader message="Loading connection requests..." />;

  // For testing - uncomment to use mock data if API is not ready
  // useEffect(() => {
  //   const mockConnectionRequests = [
  //     {
  //       _id: 'req1',
  //       sender: {
  //         _id: 'user1',
  //         firstName: 'Jane',
  //         lastName: 'Smith',
  //         headline: 'Senior Developer at Tech Co',
  //         company: 'Tech Co',
  //         location: 'San Francisco, CA',
  //         profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg',
  //         mutualConnections: 12
  //       },
  //       message: 'I saw your work on the React project and would love to connect!',
  //       createdAt: new Date(Date.now() - 3600000).toISOString()
  //     },
  //     {
  //       _id: 'req2',
  //       sender: {
  //         _id: 'user2',
  //         firstName: 'Michael',
  //         lastName: 'Johnson',
  //         headline: 'Product Manager',
  //         company: 'Innovation Inc',
  //         location: 'Boston, MA',
  //         profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
  //         mutualConnections: 5
  //       },
  //       message: null,
  //       createdAt: new Date(Date.now() - 86400000).toISOString()
  //     }
  //   ];
  //   setConnectionRequests(mockConnectionRequests);
  //   setLoading(false);
  // }, []);

  const handleRetry = () => {
    setError('');
    setLoading(true);
    fetchConnectionRequests();
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/network" className="text-blue-600 hover:underline flex items-center">
            <ChevronLeft size={16} className="mr-1" /> Back to Network
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <EmptyState
              icon={<AlertCircle size={48} className="text-red-500" />}
              title="Something Went Wrong"
              description={error || "We couldn't load your connection requests. Please try again."}
              action={
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <RefreshCw size={16} className="mr-2" /> Try Again
                </button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  if (!connectionRequests.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/network" className="text-blue-600 hover:underline flex items-center">
            <ChevronLeft size={16} className="mr-1" /> Back to Network
          </Link>
        </div>
        
        <EmptyState
          icon={<UserPlus size={48} />}
          title="No Connection Requests"
          description="You don't have any pending connection requests at the moment."
          action={
            <Link 
              to="/discover" 
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Find People to Connect
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/network" className="text-blue-600 hover:underline flex items-center">
          <ChevronLeft size={16} className="mr-1" /> Back to Network
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <h1 className="text-2xl font-bold mb-2 flex items-center">
            <UserPlus className="mr-2" size={24} />
            Connection Requests
          </h1>
          <p className="text-blue-100">
            {connectionRequests.length} pending request{connectionRequests.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectionRequests.map((request) => (
          <div key={request._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start">
                <img 
                  src={request.sender.profilePicture || '/default-avatar.png'} 
                  alt={`${request.sender.firstName} ${request.sender.lastName}`}
                  className="w-16 h-16 rounded-full object-cover mr-4"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    <Link to={`/profile/${request.sender._id}`} className="hover:text-blue-600">
                      {request.sender.firstName} {request.sender.lastName}
                    </Link>
                  </h3>
                  {request.sender.headline && (
                    <p className="text-gray-600">{request.sender.headline}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {request.sender.company && (
                  <div className="flex items-center">
                    <Briefcase className="mr-2" size={16} />
                    <span>{request.sender.company}</span>
                  </div>
                )}
                {request.sender.location && (
                  <div className="flex items-center">
                    <MapPin className="mr-2" size={16} />
                    <span>{request.sender.location}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="mr-2" size={16} />
                  <span>Sent {formatDate(request.createdAt)}</span>
                </div>
                {request.sender.mutualConnections && (
                  <div className="flex items-center">
                    <Users className="mr-2" size={16} />
                    <span>{request.sender.mutualConnections} mutual connection{request.sender.mutualConnections !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {request.message && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-gray-700 text-sm">{request.message}</p>
                </div>
              )}

              <div className="mt-5 flex space-x-3">
                <button
                  onClick={() => handleAccept(request.sender._id)}
                  disabled={processingIds.has(request.sender._id)}
                  className="flex-1 flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={16} className="mr-1" />
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(request.sender._id)}
                  disabled={processingIds.has(request.sender._id)}
                  className="flex-1 flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={16} className="mr-1" />
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionRequestPage;
