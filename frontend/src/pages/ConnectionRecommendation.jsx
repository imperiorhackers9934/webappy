import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Check, X } from 'lucide-react';
import api from '../services/api';

const ConnectionRequestPage = () => {
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConnectionRequests = async () => {
      try {
        setLoading(true);
        const response = await api.getConnectionRequests();
        console.log('Response:', response);
        setConnectionRequests(response.requests || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching connection requests:', err);
        setLoading(false);
        setError('Failed to load connection requests');
        
        // Load mock data when API fails
        const mockData = [
          {
            _id: 'req1',
            sender: {
              _id: 'user1',
              firstName: 'Jane',
              lastName: 'Smith',
              headline: 'Senior Developer at Tech Co',
              company: 'Tech Co',
              profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg'
            },
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
              profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg'
            },
            message: 'We worked together on the marketing project. Would love to connect!',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        setConnectionRequests(mockData);
      }
    };
    
    fetchConnectionRequests();
  }, []);

  const handleAccept = async (userId) => {
    try {
      await api.acceptConnection(userId);
      setConnectionRequests(prev => prev.filter(req => req.sender._id !== userId));
    } catch (err) {
      console.error('Error accepting connection:', err);
      // Remove from UI anyway for demo purposes
      setConnectionRequests(prev => prev.filter(req => req.sender._id !== userId));
    }
  };

  const handleDecline = async (userId) => {
    try {
      await api.declineConnection(userId);
      setConnectionRequests(prev => prev.filter(req => req.sender._id !== userId));
    } catch (err) {
      console.error('Error declining connection:', err);
      // Remove from UI anyway for demo purposes
      setConnectionRequests(prev => prev.filter(req => req.sender._id !== userId));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/network" className="text-blue-600 hover:underline flex items-center">
          <ChevronLeft size={16} className="mr-1" /> Back to Network
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
          <h1 className="text-xl font-bold">Connection Requests</h1>
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p>Loading connection requests...</p>
        </div>
      ) : error && connectionRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : connectionRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="mb-2">You don't have any connection requests at the moment.</p>
          <Link 
            to="/discover" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
          >
            Find People to Connect
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectionRequests.map((request) => (
            <div key={request._id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4">
                <div className="flex items-start">
                  <img 
                    src={request.sender.profilePicture || '/default-avatar.png'} 
                    alt={`${request.sender.firstName} ${request.sender.lastName}`}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="font-semibold">
                      {request.sender.firstName} {request.sender.lastName}
                    </h3>
                    {request.sender.headline && (
                      <p className="text-sm text-gray-600">{request.sender.headline}</p>
                    )}
                    {request.sender.company && (
                      <p className="text-sm text-gray-600">{request.sender.company}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Sent {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {request.message && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm border border-gray-100">
                    <p>{request.message}</p>
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleAccept(request.sender._id)}
                    className="flex-1 flex justify-center items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Check size={16} className="mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(request.sender._id)}
                    className="flex-1 flex justify-center items-center px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <X size={16} className="mr-1" />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConnectionRequestPage;
