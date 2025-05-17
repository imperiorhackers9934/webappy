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
  const [paymentLinkOpened, setPaymentLinkOpened] = useState(false);
  const [qrError, setQrError] = useState(false);
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
    
    // Log payment data for debugging
    console.log('UPI Payment Data:', paymentData);
    
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
      if (!paymentData?.orderId) {
        console.error('Missing order ID for payment status check');
        return;
      }
      
      const result = await ticketService.checkUpiPaymentStatus(paymentData.orderId);
      
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
      
      if (!paymentData?.orderId) {
        throw new Error('Missing order ID for payment verification');
      }
      
      const result = await ticketService.verifyUpiPayment({
        orderId: paymentData.orderId,
        bookingId
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
  
  // Copy payment link to clipboard
  const copyPaymentLink = () => {
    if (getPaymentLink()) {
      navigator.clipboard.writeText(getPaymentLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };
  
  // Helper to get the best available payment link
  const getPaymentLink = () => {
    // Try different possible places where the payment link might be stored
    return paymentData?.paymentLink || 
           paymentData?.upiData?.paymentLink ||
           (paymentData?.upiData?.upiUrl && !paymentData?.upiData?.upiUrl.startsWith('upi://') ? paymentData.upiData.upiUrl : null);
  };
  
  // Open payment page
  const openPaymentPage = () => {
    const paymentLink = getPaymentLink();
    
    if (paymentLink) {
      setPaymentLinkOpened(true);
      window.open(paymentLink, '_blank');
    } else {
      setStatusMessage('Payment link not available. Please try the "I\'ve Completed the Payment" button below or try another payment method.');
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
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-center mb-4">Complete Your UPI Payment</h2>
      
      <div className="text-center mb-6">
        <div className="text-sm text-gray-500 mb-1">Payment expires in</div>
        <div className="text-xl font-medium text-orange-600">{formatTime(countdown)}</div>
      </div>
      
      {/* QR Code Section */}
      {getPaymentLink() ? (
        <div className="flex flex-col items-center mb-6">
          <div className="bg-orange-50 p-3 rounded-lg mb-4">
            <QRCode 
              value={getPaymentLink()}
              size={200} 
              level="H" 
              renderAs="svg"
              includeMargin={true}
              onError={() => setQrError(true)}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Scan this QR code with any UPI app to pay
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center mb-6 bg-orange-50 p-4 rounded-lg">
          <AlertCircle className="w-10 h-10 text-orange-500 mb-2" />
          <p className="text-sm text-orange-700 text-center">
            QR code not available. Please use the payment button below.
          </p>
        </div>
      )}
      
      {/* Information Message */}
      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md mb-6">
        <p className="text-sm">
          Click the button below to open the payment page. You can complete your payment using any UPI app.
        </p>
      </div>
      
      {/* Action Buttons */}
      <div className="space-y-4 mb-6">
        <button
          type="button"
          onClick={openPaymentPage}
          className="w-full flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
        >
          <Smartphone className="w-5 h-5 mr-2" />
          Open Payment Page
        </button>
        
        {getPaymentLink() && (
          <div className="relative flex items-center mt-3">
            <input
              type="text"
              value={getPaymentLink()}
              readOnly
              className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 pr-10 text-sm"
            />
            <button
              type="button"
              onClick={copyPaymentLink}
              className="absolute right-2 text-gray-500 hover:text-gray-700"
              title="Copy payment link"
            >
              {copied ? 
                <CheckCircle className="w-5 h-5 text-green-500" /> : 
                <Copy className="w-5 h-5" />
              }
            </button>
          </div>
        )}
      </div>
      
      {/* Payment Verification */}
      <div className="border-t border-gray-200 pt-4">
        {statusMessage && (
          <div className={`text-sm text-center mb-3 ${
            statusMessage.includes('successful') ? 'text-green-600' : 'text-orange-600'
          }`}>
            {statusMessage}
          </div>
        )}
        
        {paymentLinkOpened && (
          <div className="text-sm text-center mb-3 text-gray-600">
            Once you've completed payment, click the button below to verify.
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
      
      {/* Debug Information Section (if in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500">Debug Info</summary>
            <div className="mt-2 bg-gray-100 p-2 rounded">
              <div>Order ID: {paymentData?.orderId || 'Not available'}</div>
              <div>Booking ID: {bookingId || 'Not available'}</div>
              <div>Has payment link: {getPaymentLink() ? 'Yes' : 'No'}</div>
              <div>PaymentData keys: {paymentData ? Object.keys(paymentData).join(', ') : 'None'}</div>
              {paymentData?.upiData && (
                <div>UpiData keys: {Object.keys(paymentData.upiData).join(', ')}</div>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default UpiPaymentScreen;
