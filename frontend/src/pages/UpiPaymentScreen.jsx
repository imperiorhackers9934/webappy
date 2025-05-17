// components/payment/UpiPaymentScreen.jsx
import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import ticketService from '../services/ticketService';

const UpiPaymentScreen = ({ 
  paymentData,
  bookingId,
  onSuccess,
  onCancel
}) => {
  const [verifying, setVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [paymentAttempted, setPaymentAttempted] = useState(false);
  const intervalRef = useRef(null);
  const pollingRef = useRef(null);
  
  // Start countdown and payment status polling on mount
  useEffect(() => {
    // Start countdown timer
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start payment status polling
    startPolling();
    
    // Log debug info
    console.log('UPI Payment Data:', paymentData);
    console.log('Booking ID:', bookingId);
    
    // Clean up on unmount
    return () => {
      clearInterval(intervalRef.current);
      clearInterval(pollingRef.current);
    };
  }, []);
  
  // Handle payment verification
  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    
    // Poll payment status every 5 seconds
    pollingRef.current = setInterval(async () => {
      try {
        await checkPaymentStatus();
      } catch (error) {
        console.error('Payment status polling error:', error);
      }
    }, 5000);
  };
  
  // Check payment status
  const checkPaymentStatus = async () => {
    try {
      // Make sure we have an order ID to check
      const orderId = paymentData?.orderId || localStorage.getItem('pendingOrderId');
      
      if (!orderId) {
        console.error('Missing order ID for payment status check');
        return;
      }
      
      const result = await ticketService.checkUpiPaymentStatus(orderId);
      
      if (result.success && result.status === 'PAYMENT_SUCCESS') {
        clearInterval(pollingRef.current);
        setStatusMessage('Payment successful! Redirecting...');
        
        // Delay to show success message
        setTimeout(() => onSuccess(result), 2000);
      }
    } catch (error) {
      console.error('Payment status check error:', error);
    }
  };
  
  // Manually verify payment
  const verifyPayment = async () => {
    try {
      setVerifying(true);
      setStatusMessage('Verifying payment...');
      
      // Get order ID from paymentData or localStorage
      const orderId = paymentData?.orderId || localStorage.getItem('pendingOrderId');
      const currentBookingId = bookingId || localStorage.getItem('pendingBookingId');
      
      if (!orderId) {
        throw new Error('Missing order ID for payment verification');
      }
      
      // Set payment attempted flag to show different UI
      setPaymentAttempted(true);
      
      const result = await ticketService.verifyUpiPayment({
        orderId: orderId,
        bookingId: currentBookingId
      });
      
      if (result.success && result.status === 'PAYMENT_SUCCESS') {
        setStatusMessage('Payment successful! Redirecting...');
        setTimeout(() => onSuccess(result), 2000);
      } else {
        setStatusMessage('Payment not confirmed yet. If you have completed the payment, please wait a moment and try again.');
        setVerifying(false);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatusMessage(error.message || 'Verification failed. Please try again.');
      setVerifying(false);
    }
  };
  
  // Format countdown time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Mark payment as attempted when the payment button is clicked
  const handlePayButtonClick = () => {
    setPaymentAttempted(true);
  };
  
  // Handle expired case
  if (countdown <= 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
        <div className="text-center py-6">
          <div className="text-red-600 mb-4 font-bold">Payment session expired</div>
          <p className="text-gray-600 mb-4">
            The payment session has expired. Please restart the booking process.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="bg-orange-600 text-white py-2 px-6 rounded-md hover:bg-orange-700"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }
  
  // Already paid UI
  if (paymentAttempted) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-center mb-4">Verify Your Payment</h2>
        
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md mb-6">
          <p className="font-medium">Payment Initiated</p>
          <p className="text-sm mt-1">If you have completed the payment through Cashfree, please click the button below to verify.</p>
        </div>
        
        {statusMessage && (
          <div className={`text-sm text-center mb-4 ${
            statusMessage.includes('successful') ? 'text-green-600' : 'text-orange-600'
          }`}>
            {statusMessage}
          </div>
        )}
        
        <button
          type="button"
          onClick={verifyPayment}
          disabled={verifying}
          className={`w-full flex items-center justify-center py-3 px-4 rounded-md ${
            verifying 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-orange-600 hover:bg-orange-700 text-white'
          }`}
        >
          {verifying ? (
            <>
              <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
              Verifying Payment...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5 mr-2" />
              I've Completed the Payment
            </>
          )}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          className="w-full text-gray-600 py-2 px-4 mt-3 text-sm hover:text-orange-600"
        >
          Cancel and Try Another Payment Method
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-center mb-4">Complete Your Payment</h2>
      
      <div className="text-center mb-6">
        <div className="text-sm text-gray-500 mb-1">Payment expires in</div>
        <div className="text-xl font-medium text-orange-600">{formatTime(countdown)}</div>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md mb-6">
        <p className="text-sm">
          Click the payment button below to complete your payment. After payment, click the "I've Completed the Payment" button to verify.
        </p>
      </div>
      
      {/* Custom Cashfree Payment Button */}
      <div className="mb-6 flex justify-center" onClick={handlePayButtonClick}>
        <form>
          <a href="https://payments.cashfree.com/forms/bytebattle-earlybird" target="_parent">
            <div className="button-container" style={{ background: '#000' }}>
              <div>
                <img src="https://cashfree-checkoutcartimages-prod.cashfree.com/MeetKatsE8ikokg8hr90_prod.jpg" alt="logo" className="logo-container" />
              </div>
              <div className="text-container">
                <div style={{ fontFamily: 'Arial', color: '#fff', marginBottom: '5px', fontSize: '14px' }}>
                  Pay Now
                </div>
                <div style={{ fontFamily: 'Arial', color: '#fff', fontSize: '10px' }}>
                  <span>Powered By Cashfree</span>
                  <img src="https://cashfreelogo.cashfree.com/cashfreepayments/logosvgs/Group_4355.svg" alt="logo" className="seconday-logo-container" />
                </div>
              </div>
            </div>
          </a>
          <style jsx="true">{`
            .button-container {
              border: 1px solid black;
              border-radius: 15px;
              display: flex;
              padding: 10px;
              width: fit-content;
              cursor: pointer;
            }
            .text-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-left: 10px;
              justify-content: center;
              margin-right: 10px;
            }
            .logo-container {
              width: 40px;
              height: 40px;
            }
            .seconday-logo-container {
              width: 16px;
              height: 16px;
              vertical-align: middle;
            }
            a {
              text-decoration: none;
            }
          `}</style>
        </form>
      </div>
      
      {/* Verification button */}
      <button
        type="button"
        onClick={verifyPayment}
        className="w-full flex items-center justify-center bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 mb-3"
      >
        <RefreshCw className="w-5 h-5 mr-2" />
        I've Completed the Payment
      </button>
      
      <button
        type="button"
        onClick={onCancel}
        className="w-full text-gray-500 py-2 px-4 text-sm hover:text-orange-600 border border-gray-200 rounded-md"
      >
        Cancel and Try Another Payment Method
      </button>
      
      {/* Order info */}
      <div className="border-t border-gray-200 pt-4 mt-6 text-sm text-gray-600">
        <p>Order ID: {paymentData?.orderId || localStorage.getItem('pendingOrderId') || 'Not available'}</p>
        <p className="mt-1">After completing payment, click "I've Completed the Payment" button above.</p>
      </div>
    </div>
  );
};

export default UpiPaymentScreen;
