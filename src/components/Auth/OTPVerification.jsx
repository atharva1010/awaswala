import React, { useState, useRef, useEffect } from 'react';

const OTPVerification = ({ mobile, onVerify }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      alert('Please enter complete OTP');
      return;
    }

    setLoading(true);
    const success = await onVerify(otpValue);
    setLoading(false);
    
    if (!success) {
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    }
  };

  const handleResendOTP = async () => {
    // Implement resend OTP logic here
    alert('OTP resent!');
    setTimeLeft(120);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0].focus();
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Verify OTP</h2>
      <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
        OTP sent to {mobile}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Enter OTP</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              />
            ))}
          </div>
          
          <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
            OTP expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP & Login'}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '15px' }}>
        <a href="#" onClick={handleResendOTP} style={{ color: '#667eea', textDecoration: 'none' }}>
          Didn't receive OTP? Resend OTP
        </a>
      </div>
    </div>
  );
};

export default OTPVerification;