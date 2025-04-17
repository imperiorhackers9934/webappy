import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ticketService from '../services/ticketService';

const CheckInPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State management
  const [verificationCode, setVerificationCode] = useState(searchParams.get('code') || '');
  const [scannerActive, setScannerActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [attendeeInfo, setAttendeeInfo] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    remaining: 0
  });

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  
  // Stream reference for cleanup
  const streamRef = useRef(null);

  useEffect(() => {
    if (searchParams.get('code')) {
      // If code is provided in URL, focus on the submit button
      handleVerifyTicket();
    } else {
      // Otherwise focus on the input field
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
    
    // Fetch recent check-ins and stats on mount
    fetchEventStats();
    fetchRecentCheckIns();
    
    // Cleanup function for camera
    return () => {
      stopScanner();
    };
  }, []);

  const fetchEventStats = async () => {
    try {
      const statsData = await ticketService.getEventBookingStats(eventId);
      setStats({
        total: statsData.totalTickets || 0,
        checkedIn: statsData.checkedIn || 0,
        remaining: (statsData.totalTickets || 0) - (statsData.checkedIn || 0)
      });
    } catch (err) {
      console.error('Failed to fetch event stats:', err);
      // Don't show error for stats, just log it
    }
  };

  const fetchRecentCheckIns = async () => {
    try {
      // We'll use the getEventTickets method with specific filters
      const result = await ticketService.getEventTickets(eventId, {
        checkInStatus: 'true',
        limit: 5,
        sortBy: 'checkInTime',
        sortOrder: 'desc'
      });
      
      setRecentCheckIns(result.tickets || []);
    } catch (err) {
      console.error('Failed to fetch recent check-ins:', err);
      // Don't show error for recent check-ins, just log it
    }
  };

  const handleVerifyTicket = async (e) => {
    if (e) e.preventDefault();
    
    if (!verificationCode.trim()) {
      setError('Please enter a verification code');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    setAttendeeInfo(null);
    
    try {
      // Verify ticket by code
      const result = await ticketService.verifyTicketByCode(eventId, verificationCode.trim());
      
      // If the ticket exists but hasn't been checked in
      if (result && result.ticket) {
        setAttendeeInfo(result.ticket);
        
        if (result.ticket.isCheckedIn) {
          // Already checked in
          setError(`Ticket already checked in at ${new Date(result.ticket.checkInTime).toLocaleString()}`);
        } else {
          // Ready for check-in
          setSuccess('Ticket verified! Ready for check-in.');
        }
      } else {
        setError('Invalid ticket code. Please check and try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    // Check for either id or _id in the attendeeInfo object
    const ticketId = attendeeInfo?._id || attendeeInfo?.id;
    
    if (!attendeeInfo || !ticketId) {
      setError('No valid ticket to check in');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Use the ticketId variable which contains whichever ID is available
      await ticketService.checkInTicket(ticketId, {
        verificationCode: verificationCode.trim()
      });
      
      // Update UI with success
      setSuccess(`Successfully checked in ${attendeeInfo.attendeeName || 'attendee'}`);
      
      // Clear form and reset
      setVerificationCode('');
      setAttendeeInfo(null);
      
      // Refresh stats and recent check-ins
      fetchEventStats();
      fetchRecentCheckIns();
      
      // Focus back on the input field
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (err) {
      console.error('Check-in error:', err);
      setError(err.message || 'Failed to check in ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    try {
      setError(null);
      
      const constraints = {
        video: { facingMode: 'environment' }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScannerActive(true);
        
        // Start scanning for QR codes
        requestAnimationFrame(scanQRCode);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please check permissions and try again.');
      setScannerActive(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setScannerActive(false);
  };

  const scanQRCode = () => {
    if (!scannerActive || !videoRef.current || !canvasRef.current) {
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Here you would typically use a QR code library to detect codes
      // For example, with jsQR or similar library:
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      // if (code) {
      //   setVerificationCode(code.data);
      //   handleVerifyTicket();
      //   stopScanner();
      // }
      
      // Since we can't directly import jsQR here, this is a placeholder
      // In a real implementation, you would add the QR scanning logic here
    }
    
    if (scannerActive) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const toggleScanner = () => {
    if (scannerActive) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Event Check-In</h1>
        <div className="space-x-2">
          <button 
            onClick={() => navigate(`/events/${eventId}/attendees`)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Manage Attendees
          </button>
          <button 
            onClick={() => navigate(`/events/${eventId}/tickets`)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Manage Tickets
          </button>
        </div>
      </div>
      
      {/* Check-in Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500">Total Tickets</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500">Checked In</h3>
          <p className="text-2xl font-bold">{stats.checkedIn}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-gray-500">Remaining</h3>
          <p className="text-2xl font-bold">{stats.remaining}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Check-in Form */}
        <div className="flex flex-col">
          <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Ticket Verification</h2>
            
            <form onSubmit={handleVerifyTicket} className="mb-4">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="verificationCode">
                  Ticket Code
                </label>
                <div className="flex">
                  <input
                    ref={inputRef}
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Enter ticket code"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={toggleScanner}
                    className={`px-4 py-2 ${
                      scannerActive 
                        ? 'bg-red-500 hover:bg-red-700' 
                        : 'bg-green-500 hover:bg-green-700'
                    } text-white font-bold rounded-r`}
                  >
                    {scannerActive ? 'Stop Scan' : 'Scan QR'}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  disabled={loading || !verificationCode.trim()}
                >
                  {loading ? 'Verifying...' : 'Verify Ticket'}
                </button>
              </div>
            </form>
            
            {/* Scanner */}
            {scannerActive && (
              <div className="mb-4">
                <div className="relative">
                  <video 
                    ref={videoRef}
                    className="w-full h-64 object-cover rounded"
                    autoPlay
                    playsInline
                    muted
                  ></video>
                  <canvas ref={canvasRef} className="hidden"></canvas>
                  <div className="absolute inset-0 border-2 border-green-500 pointer-events-none"></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Position the QR code within the frame to scan
                </p>
              </div>
            )}
            
            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                <p>{error}</p>
              </div>
            )}
            
            {/* Success Display */}
            {success && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
                <p>{success}</p>
              </div>
            )}
          </div>
          
          {/* Attendee Information */}
          {attendeeInfo && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-xl font-semibold mb-4">Attendee Information</h2>
              
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{attendeeInfo.attendeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{attendeeInfo.attendeeEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ticket Type</p>
                    <p className="font-semibold">{attendeeInfo.ticketType?.name || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-semibold ${attendeeInfo.isCheckedIn ? 'text-green-600' : 'text-yellow-600'}`}>
                      {attendeeInfo.isCheckedIn ? 'Checked In' : 'Not Checked In'}
                    </p>
                  </div>
                </div>
              </div>
              
              {!attendeeInfo.isCheckedIn && (
                <div className="flex justify-end">
                  <button
                    onClick={handleCheckIn}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Check In Attendee'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Right Column: Recent Check-ins */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Check-ins</h2>
          
          {recentCheckIns.length === 0 ? (
            <p className="text-gray-600">No recent check-ins</p>
          ) : (
            <div className="overflow-y-auto max-h-96">
              {recentCheckIns.map((attendee) => (
                <div key={attendee.id} className="border-b py-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{attendee.attendeeName}</p>
                      <p className="text-sm text-gray-600">{attendee.attendeeEmail}</p>
                      <p className="text-xs text-gray-500">
                        {attendee.ticketType?.name || 'Standard Ticket'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">Checked In</p>
                      <p className="text-xs text-gray-500">
                        {formatTime(attendee.checkInTime)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => navigate(`/events/${eventId}/attendees?checkInStatus=true`)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All Check-ins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;