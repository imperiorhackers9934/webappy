// PaymentResponsePage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ticketService from '../services/ticketService';

const PaymentResponsePage = () => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Parse query params
        const params = new URLSearchParams(location.search);
        const transactionId = params.get('transactionId');
        
        if (!transactionId) {
          setStatus('error');
          setMessage('Invalid transaction ID');
          return;
        }
        
        // Check payment status
        const response = await ticketService.checkPaymentStatus(transactionId);
        
        if (response.status === 'PAYMENT_SUCCESS') {
          setStatus('success');
          // Navigate to booking confirmation
          if (response.bookingId) {
            navigate(`/tickets/confirmation/${response.bookingId}`);
          } else {
            navigate('/tickets');
          }
        } else {
          setStatus('error');
          setMessage(response.message || 'Payment was not successful');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
        setMessage('Failed to verify payment. Please contact support.');
      }
    };
    
    checkPaymentStatus();
  }, [location, navigate]);
  
  // Render appropriate UI based on status
  if (status === 'loading') {
    return <div>Verifying payment...</div>;
  }
  
  if (status === 'error') {
    return (
      <div>
        <h1>Payment Failed</h1>
        <p>{message}</p>
        <button onClick={() => navigate('/tickets')}>View My Tickets</button>
      </div>
    );
  }
  
  return <div>Processing your payment...</div>;
};

export default PaymentResponsePage;
