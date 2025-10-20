import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Shield, ArrowRight, Building2, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';

const AgentLogin = ({ onSwitchToAgentSignup, onSwitchToUserLogin, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkExistingTokens = () => {
      const token = localStorage.getItem('token');
      const agentToken = localStorage.getItem('agentToken');
      
      if (token) {
        setError('⚠️ You are currently logged in as user. Please logout first.');
      }
    };

    checkExistingTokens();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error || success) {
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Attempting agent login with:', formData.email);
      
      // Clear any existing user tokens
      localStorage.removeItem('token');
      
      const res = await axios.post('http://localhost:5000/api/agent/auth/login', formData);
      
      console.log('✅ Agent login response:', res.data);
      
      if (res.data.success && res.data.token) {
        // Verify that the agent is verified before allowing login
        if (res.data.agent.isVerified !== true) {
          throw new Error('Your agent account is not yet verified. Please wait for admin approval.');
        }

        localStorage.setItem('agentToken', res.data.token);
        localStorage.setItem('agentData', JSON.stringify(res.data.agent));
        console.log('🔑 Agent token and data saved successfully');
        
        setSuccess('✅ Login successful! Redirecting to dashboard...');

        setTimeout(() => {
          const savedToken = localStorage.getItem('agentToken');
          if (savedToken && onLoginSuccess) {
            onLoginSuccess();
          } else {
            setError('Login failed: Token not saved. Please try again.');
            setLoading(false);
          }
        }, 1500);

      } else {
        throw new Error(res.data.message || 'Invalid response from server');
      }
    } catch (err) {
      console.error('❌ Agent login error:', err);
      
      // Clear tokens on error
      localStorage.removeItem('agentToken');
      localStorage.removeItem('agentData');
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response) {
        const serverError = err.response.data;
        
        // Handle specific backend validation errors
        if (serverError.message?.includes('not verified') || serverError.message?.includes('pending')) {
          errorMessage = 'Your agent account is pending verification. Please wait for admin approval.';
        } else if (serverError.message?.includes('not found')) {
          errorMessage = 'No agent account found with this email. Please sign up first.';
        } else {
          errorMessage = serverError.message || `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message || 'An unexpected error occurred.';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && formData.email && formData.password) {
      handleSubmit(e);
    }
  };

  const isLoginAllowed = () => {
    return formData.email && formData.password;
  };

  return (
    <div className="agent-login-container">
      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="agent-login-card">
        {/* Header Section */}
        <div className="agent-login-header">
          <div className="agent-logo-section">
            <div className="agent-logo-icon">
              <Building2 size={32} />
            </div>
            <div className="agent-logo-text">
              <h1>Agent Portal</h1>
              <p>Access your professional dashboard</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="agent-message error">
            <div className="message-icon">⚠</div>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="agent-message success">
            <div className="message-icon">✓</div>
            <span>{success}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} onKeyPress={handleKeyPress} className="agent-login-form">
          {/* Email Field */}
          <div className="agent-input-group">
            <div className="agent-input-icon">
              <Mail size={20} />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your registered email"
              required
              disabled={loading}
              autoComplete="email"
              className="agent-form-input"
            />
            <div className="agent-input-border"></div>
          </div>

          {/* Password Field */}
          <div className="agent-input-group">
            <div className="agent-input-icon">
              <Lock size={20} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
              autoComplete="current-password"
              className="agent-form-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="agent-password-toggle"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <div className="agent-input-border"></div>
          </div>

          {/* Login Button - FIXED VISIBILITY */}
          <button
            type="submit"
            disabled={loading || !isLoginAllowed()}
            className="agent-login-btn"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="agent-btn-content">
              {loading ? (
                <>
                  <div className="agent-spinner"></div>
                  Signing In...
                </>
              ) : (
                <>
                  Login to Dashboard
                  <ArrowRight size={18} className={isHovered ? 'agent-btn-arrow-hover' : ''} />
                </>
              )}
            </span>
            <div className="agent-btn-shine"></div>
          </button>
        </form>

        {/* Verification Info */}
        <div className="verification-info">
          <div className="info-item">
            <Shield size={16} />
            <span>Only verified agents can login</span>
          </div>
          <div className="info-item">
            <CheckCircle size={16} />
            <span>Admin verification required</span>
          </div>
          <div className="info-item">
            <Clock size={16} />
            <span>24-48 hours verification time</span>
          </div>
        </div>

        {/* Alternative Options */}
        <div className="agent-alternative-options">
          <button
            onClick={onSwitchToAgentSignup}
            disabled={loading}
            className="agent-alt-option-btn signup-btn"
          >
            <Shield size={18} />
            Become an Agent
          </button>

          <button
            onClick={onSwitchToUserLogin}
            disabled={loading}
            className="agent-alt-option-btn user-btn"
          >
            <Mail size={18} />
            User Login
          </button>
        </div>

        {/* Footer */}
        <div className="agent-login-footer">
          <p>Secure agent portal • Professional tools • Real-time analytics</p>
        </div>
      </div>

      <style jsx>{`
        .agent-login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
          position: relative;
          overflow: hidden;
        }

        .background-animation {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: agent-float 8s ease-in-out infinite;
        }

        .shape-1 {
          width: 100px;
          height: 100px;
          top: 15%;
          left: 15%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 150px;
          height: 150px;
          top: 65%;
          right: 15%;
          animation-delay: 3s;
        }

        .shape-3 {
          width: 80px;
          height: 80px;
          bottom: 25%;
          left: 25%;
          animation-delay: 6s;
        }

        .agent-login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 24px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.2);
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
          animation: agent-slideUp 0.6s ease-out;
        }

        .agent-login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .agent-logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .agent-logo-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #1e40af, #3730a3);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 10px 25px rgba(30, 64, 175, 0.3);
        }

        .agent-logo-text h1 {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #1e40af, #3730a3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .agent-logo-text p {
          margin: 8px 0 0 0;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        }

        .agent-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
          animation: agent-slideDown 0.3s ease-out;
        }

        .agent-message.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .agent-message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .message-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
        }

        .agent-login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .agent-input-group {
          position: relative;
        }

        .agent-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          z-index: 1;
          transition: color 0.2s;
        }

        .agent-form-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border: 2px solid #f3f4f6;
          border-radius: 12px;
          font-size: 16px;
          background: #ffffff;
          transition: all 0.2s;
          position: relative;
          z-index: 2;
          font-weight: 500;
        }

        .agent-form-input:focus {
          outline: none;
          border-color: #1e40af;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
        }

        .agent-form-input:focus + .agent-input-border {
          transform: scaleX(1);
        }

        .agent-input-border {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #1e40af, #3730a3);
          transform: scaleX(0);
          transition: transform 0.3s ease;
          border-radius: 0 0 12px 12px;
        }

        .agent-password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
          z-index: 2;
        }

        .agent-password-toggle:hover {
          color: #6b7280;
        }

        /* ✅ LOGIN BUTTON - FIXED STYLES */
        .agent-login-btn {
          position: relative;
          width: 100%;
          padding: 18px 24px;
          background: linear-gradient(135deg, #1e40af, #3730a3);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3);
          margin-top: 10px;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        .agent-login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(30, 64, 175, 0.4);
        }

        .agent-login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .agent-login-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          background: #9ca3af;
        }

        .agent-btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          z-index: 2;
          font-size: 15px;
        }

        .agent-btn-arrow-hover {
          transform: translateX(4px);
          transition: transform 0.2s ease;
        }

        .agent-btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s ease;
        }

        .agent-login-btn:hover .agent-btn-shine {
          left: 100%;
        }

        .agent-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: agent-spin 1s linear infinite;
        }

        /* Verification Info */
        .verification-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 20px 0;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
        }

        .info-item svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .agent-alternative-options {
          display: flex;
          gap: 12px;
          margin: 24px 0;
        }

        .agent-alt-option-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .agent-alt-option-btn:hover:not(:disabled) {
          border-color: #1e40af;
          color: #1e40af;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .agent-alt-option-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .agent-login-footer {
          margin-top: 24px;
          text-align: center;
        }

        .agent-login-footer p {
          color: #6b7280;
          font-size: 12px;
          margin: 0;
          font-weight: 500;
        }

        @keyframes agent-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(180deg);
          }
        }

        @keyframes agent-slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes agent-slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes agent-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 480px) {
          .agent-login-card {
            padding: 24px;
            margin: 20px;
          }

          .agent-logo-text h1 {
            font-size: 24px;
          }

          .agent-alternative-options {
            flex-direction: column;
          }

          .agent-logo-icon {
            width: 60px;
            height: 60px;
          }
        }
      `}</style>
    </div>
  );
};

export default AgentLogin;