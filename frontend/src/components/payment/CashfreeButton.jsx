import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Smartphone, 
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'https://new-backend-w86d.onrender.com';

const CashfreePayment = ({ 
  amount, 
  bookingId, 
  eventName,
  onSuccess,
  onFailure,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [cashfree, setCashfree] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Get auth context to access the token
  const { token } = useAuth();

  // Initialize Cashfree SDK on component mount
  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        // Using dynamic import to load Cashfree SDK
        const { load } = await import('@cashfreepayments/cashfree-js');
        const cashfreeInstance = await load({
          mode: "production" // Change to "production" for live payments
        });
        setCashfree(cashfreeInstance);
        console.log('Cashfree SDK initialized');
      } catch (error) {
        console.error('Error initializing Cashfree SDK:', error);
        setError('Payment service initialization failed. Please try again later.');
      }
    };

    initializeCashfree();
  }, []);

  // Function to refresh the auth token
  const refreshAuthToken = async () => {
    try {
      const refreshToken = localStorage.getItem('@refresh_token');
      if (!refreshToken) throw new Error('No refresh token available');

      console.log('Attempting to refresh the auth token');
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      
      if (data && data.token) {
        console.log('Token refreshed successfully');
        localStorage.setItem('@auth_token', data.token);
        
        if (data.refreshToken) {
          localStorage.setItem('@refresh_token', data.refreshToken);
        }
        
        return data.token;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  };

  // Function to create a payment order
  const createPaymentOrder = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Get the auth token
      let authToken = localStorage.getItem('@auth_token') || token;
      console.log('Current auth token:', authToken ? 'Present' : 'Missing');
  
      // Validate bookingId
      if (!bookingId || bookingId === 'pending') {
        throw new Error('Invalid booking ID. Please complete the booking first.');
      }
      
      // Get user data for customer details
      const userData = JSON.parse(localStorage.getItem('@user_data') || '{}');
  
      // Make API call with complete customer details
      let response = await fetch(`${API_BASE_URL}/api/payments/cashfree/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify({
          amount,
          bookingId,
          eventName,
          // CRITICAL: Add these explicitly
          customerPhone: userData.phone || '9999999999', // Default phone is required by Cashfree
          customerEmail: userData.email || '',
          customerName: userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'Customer'
        }),
      });

      // If unauthorized, try to refresh the token and retry
      if (response.status === 401) {
        console.log('Token expired, attempting to refresh...');
        try {
          // Refresh token
          const newToken = await refreshAuthToken();
          
          // Retry the request with the new token
          response = await fetch(`${API_BASE_URL}/api/payments/cashfree/initiate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
            },
            body: JSON.stringify({
              amount,
              bookingId,
              eventName: eventName || 'Event Tickets',
            }),
          });
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Your session has expired. Please log in again.');
        }
      }

      // Parse the response
      const data = await response.json();

      // Check if the response contains an error message
      if (data.error) {
        throw new Error(data.error || data.message || 'Failed to create payment order');
      }

      // Check if the order was created successfully
      if (data && data.success && data.orderToken) {
        setOrderId(data.orderId);
        return data;
      } else {
        throw new Error(data.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Error creating payment order:', error);
      setError(error.message || 'Failed to initialize payment. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Function to verify payment status
  const verifyPayment = async (orderId) => {
    try {
      setIsVerifying(true);
      console.log(`Verifying payment for order ${orderId}`);
      
      // Get the auth token
      const authToken = localStorage.getItem('@auth_token') || token;
      
      const response = await fetch(`${API_BASE_URL}/api/payments/cashfree/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
        body: JSON.stringify({
          orderId
        }),
      });

      const data = await response.json();
      console.log('Verification response:', data);

      if (data && data.success) {
        return data;
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle payment initiation
  const handlePayment = async () => {
    if (!cashfree) {
      setError('Payment service not initialized. Please refresh the page.');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Step 1: Create payment order
      const orderData = await createPaymentOrder();
      
      if (!orderData.orderToken) {
        throw new Error('Payment session ID not received');
      }
      
      // Store order details in localStorage for retrieval after redirect
      localStorage.setItem('pendingOrderId', orderData.orderId);
      localStorage.setItem('pendingBookingId', bookingId);
      localStorage.setItem('cashfreeOrderToken', orderData.orderToken);
      
      // Step 2: Initialize Cashfree checkout
      const checkoutOptions = {
        paymentSessionId: orderData.orderToken,
        redirectTarget: "_self", // Change this to _self to avoid modal issues
        onSuccess: async (data) => {
          console.log('Payment success callback', data);
          
          try {
            // Step 3: Verify payment after success
            const verificationResult = await verifyPayment(orderData.orderId);
            
            // Clean up localStorage
            localStorage.removeItem('pendingOrderId');
            localStorage.removeItem('pendingBookingId');
            localStorage.removeItem('cashfreeOrderToken');
            
            if (verificationResult.status === 'PAYMENT_SUCCESS') {
              onSuccess(verificationResult);
            } else {
              onFailure(verificationResult);
            }
          } catch (error) {
            onFailure({ error: error.message });
          }
          
          setProcessingPayment(false);
        },
        onFailure: (data) => {
          console.log('Payment failure callback', data);
          setProcessingPayment(false);
          onFailure(data);
        },
        onClose: () => {
          console.log('Payment modal closed');
          setProcessingPayment(false);
          onCancel();
        }
      };
      
      // Launch the Cashfree checkout
      await cashfree.checkout(checkoutOptions);
      
    } catch (error) {
      console.error('Payment flow error:', error);
      setError(error.message || 'Payment initialization failed');
      setProcessingPayment(false);
      onFailure({ error: error.message });
    }
  };

  // Check for pending payment on component mount
  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      const pendingBookingId = localStorage.getItem('pendingBookingId');
      
      if (pendingOrderId && pendingBookingId === bookingId) {
        try {
          setLoading(true);
          const verificationResult = await verifyPayment(pendingOrderId);
          
          if (verificationResult.status === 'PAYMENT_SUCCESS') {
            // Clean up localStorage
            localStorage.removeItem('pendingOrderId');
            localStorage.removeItem('pendingBookingId');
            localStorage.removeItem('cashfreeOrderToken');
            
            onSuccess(verificationResult);
          }
        } catch (error) {
          console.error('Error checking pending payment:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkPendingPayment();
  }, [bookingId, onSuccess]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Secure Payment</h2>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      
      <div className="border border-gray-200 rounded-md p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">₹{amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Booking ID:</span>
          <span className="text-gray-800">{bookingId && bookingId !== 'pending' ? 
            bookingId.substring(0, 8) + '...' : 'Pending'}</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={handlePayment}
          disabled={loading || !cashfree || processingPayment || bookingId === 'pending' || isVerifying}
          className={`w-full flex items-center justify-center py-3 rounded-md text-white ${
            loading || !cashfree || processingPayment || bookingId === 'pending' || isVerifying
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {loading || processingPayment || isVerifying ? (
            <>
              <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay Securely with Cashfree
            </>
          )}
        </button>
        
        <button
          onClick={onCancel}
          disabled={loading || processingPayment || isVerifying}
          className="w-full text-center py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel Payment
        </button>
      </div>
      
      <div className="mt-6 text-center">
        <div className="flex justify-center space-x-4 mb-3">
          <img src="/api/placeholder/40/25" alt="Visa" className="h-6" />
          <img src="/api/placeholder/40/25" alt="Mastercard" className="h-6" />
          <img src="/api/placeholder/40/25" alt="UPI" className="h-6" />
          <img src="/api/placeholder/40/25" alt="Netbanking" className="h-6" />
        </div>
        <p className="text-xs text-gray-500">
          Secured by Cashfree Payment Gateway
        </p>
      </div>
    </div>
  );
};

export default CashfreePayment;
