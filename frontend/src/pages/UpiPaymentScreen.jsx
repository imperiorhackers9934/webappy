// components/payment/UpiPaymentScreen.jsx
import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Copy, CheckCircle, Smartphone, RefreshCw, Link as LinkIcon, AlertCircle } from 'lucide-react';
import ticketService from '../services/ticketService';

const UpiPaymentScreen = ({ 
  paymentData,
  bookingId,
  onSuccess,
  onCancel
}) => {
  const [copied, setCopied] = useState(false);
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
  
  // Get payment link from different possible sources
  const getPaymentLink = () => {
    // Try all possible locations where the payment link might be
    return paymentData?.paymentLink || 
           paymentData?.upiData?.paymentLink || 
           (paymentData?.cfOrderId && 
            `https://${process.env.NODE_ENV === 'production' ? 'payments.cashfree.com' : 'sandbox.cashfree.com'}/pg/orders/${paymentData.cfOrderId || paymentData.orderId}`);
  };
  
  // Copy payment link to clipboard
  const copyPaymentLink = () => {
    const link = getPaymentLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };
  
  // Open direct payment
  const openDirectPayment = () => {
    // Try to open payment page
    const link = getPaymentLink();
    if (link) {
      window.open(link, '_blank');
      setPaymentAttempted(true);
    } else {
      // If no link is available, tell the user to proceed with verification
      setStatusMessage('Payment link not available. Please use the "I\'ve Completed the Payment" button if you\'ve already paid using a UPI app.');
    }
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
          <p className="text-sm mt-1">If you have completed the payment through your UPI app, please click the button below to verify.</p>
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
      <h2 className="text-xl font-bold text-center mb-4">Complete Your UPI Payment</h2>
      
      <div className="text-center mb-6">
        <div className="text-sm text-gray-500 mb-1">Payment expires in</div>
        <div className="text-xl font-medium text-orange-600">{formatTime(countdown)}</div>
      </div>
      
      {/* Main payment methods */}
      <div className="space-y-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-md">
          <p className="text-sm">
            To pay for your order, follow one of these methods:
          </p>
          <ol className="list-decimal list-inside mt-2 text-sm space-y-1">
            <li>Click the <b>Open Payment Page</b> button below to pay using any UPI app</li>
            <li>Or use your UPI app to scan a QR code at the Cashfree payment page</li>
            <li>After completing payment, click <b>I've Completed the Payment</b></li>
          </ol>
        </div>
        
        <button
          type="button"
          onClick={openDirectPayment}
          className="w-full flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
        >
          <Smartphone className="w-5 h-5 mr-2" />
          Open Payment Page
        </button>
        
        <button
          type="button"
          onClick={verifyPayment}
          className="w-full flex items-center justify-center bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700"
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
      </div>
      
      {/* Order ID info */}
      <div className="border-t border-gray-200 pt-4 text-sm text-gray-600">
        <p>Order ID: {paymentData?.orderId || localStorage.getItem('pendingOrderId') || 'Not available'}</p>
        <p className="mt-1">If you've already paid using your UPI app, click "I've Completed the Payment" above.</p>
      </div>
    </div>
  );
};

export default UpiPaymentScreen;
