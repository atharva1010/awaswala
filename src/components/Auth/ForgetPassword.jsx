import React, { useState } from 'react';

const ForgetPasswordPage = ({ onBackToLogin }) => {
  const [step, setStep] = useState('sendOtp'); // sendOtp, verifyOtp, resetPassword
  const [otpData, setOtpData] = useState({ mobile: '', otp: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setOtpData({ ...otpData, [field]: e.target.value });
  };

  // ---------------- SEND OTP ----------------
  const handleSendOtp = async () => {
    if (!otpData.mobile) {
      setMessage('❌ Enter your mobile number!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/login/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: otpData.mobile.startsWith('+') ? otpData.mobile : `+91${otpData.mobile}` }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('✅ OTP sent to your mobile.');
        setStep('verifyOtp');
      } else {
        setMessage(result.message || '❌ Failed to send OTP.');
      }
    } catch (err) {
      console.error(err);
      setMessage('⚠️ Server error.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- VERIFY OTP ----------------
  const handleVerifyOtp = async () => {
    if (!otpData.otp) {
      setMessage('❌ Enter OTP!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/login/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: otpData.mobile.startsWith('+') ? otpData.mobile : `+91${otpData.mobile}`,
          otp: otpData.otp
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('✅ OTP verified! Set your new password.');
        setStep('resetPassword');
      } else {
        setMessage(result.message || '❌ OTP verification failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage('⚠️ Server error.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RESET PASSWORD ----------------
  const handleResetPassword = async () => {
    const { newPassword, confirmPassword, mobile } = otpData;
    if (!newPassword || !confirmPassword) {
      setMessage('❌ Fill all fields!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile.startsWith('+') ? mobile : `+91${mobile}`, newPassword }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage('✅ Password updated successfully! You can login now.');
        setOtpData({ mobile: '', otp: '', newPassword: '', confirmPassword: '' });
        setStep('sendOtp');
      } else {
        setMessage(result.message || '❌ Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setMessage('⚠️ Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f9fa' }}>
      <h1 style={{ fontSize: '28px', color: '#333', marginBottom: '10px' }}>Forget Password</h1>

      {message && <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '6px', textAlign: 'center', backgroundColor: message.includes('✅') ? '#f0f9f4' : '#fef2f2', color: message.includes('✅') ? '#0f766e' : '#dc2626', border: message.includes('✅') ? '1px solid #bbf7d0' : '1px solid #fecaca', width: '100%', maxWidth: '400px' }}>{message}</div>}

      {step === 'sendOtp' && (
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
          <input type="tel" placeholder="Mobile Number" value={otpData.mobile} onChange={handleChange('mobile')} style={inputStyle} />
          <button onClick={handleSendOtp} disabled={loading} style={buttonStyle}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
          <p onClick={onBackToLogin} style={{ fontSize: '14px', color: '#3b82f6', textAlign: 'center', cursor: 'pointer' }}>Back to Login</p>
        </div>
      )}

      {step === 'verifyOtp' && (
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
          <input type="text" placeholder="Enter OTP" value={otpData.otp} onChange={handleChange('otp')} style={inputStyle} />
          <button onClick={handleVerifyOtp} disabled={loading} style={buttonStyle}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
        </div>
      )}

      {step === 'resetPassword' && (
        <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
          <input type="password" placeholder="New Password" value={otpData.newPassword} onChange={handleChange('newPassword')} style={inputStyle} />
          <input type="password" placeholder="Confirm Password" value={otpData.confirmPassword} onChange={handleChange('confirmPassword')} style={inputStyle} />
          <button onClick={handleResetPassword} disabled={loading} style={buttonStyle}>{loading ? 'Updating...' : 'Update Password'}</button>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '16px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  boxSizing: 'border-box'
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  marginBottom: '16px'
};

export default ForgetPasswordPage;
