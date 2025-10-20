import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Shield } from 'lucide-react';

const Login = ({ onSwitchToSignup, onSwitchToForget, onSwitchToAgentLogin, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { login } = useAuth();

  useEffect(() => {
    const checkExistingTokens = () => {
      const token = localStorage.getItem('token');
      const agentToken = localStorage.getItem('agentToken');
      
      if (token) {
        setMessage('ℹ️ You are already logged in as user');
      } else if (agentToken) {
        setMessage('ℹ️ You are logged in as agent');
      }
    };

    checkExistingTokens();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (message) {
      setMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      localStorage.removeItem('agentToken');
      
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        setMessage('✅ Login successful! Redirecting...');
        
        setTimeout(() => {
          const token = localStorage.getItem('token');
          if (token) {
            console.log('🔑 User token saved successfully, redirecting to home');
            onLoginSuccess();
          } else {
            setMessage('❌ Login failed: Token not saved properly');
            setLoading(false);
          }
        }, 1000);
      } else {
        setMessage(`❌ ${result.message || 'Login failed'}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('❌ An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="login-card">
        {/* Header Section */}
        <div className="login-header">
          <div className="logo-section">
            <div className="logo-icon">
              <Shield size={32} />
            </div>
            <div className="logo-text">
              <h1>Welcome Back</h1>
              <p>Sign in to your AwasWala account</p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`message-alert ${message.includes('✅') || message.includes('ℹ️') ? 'success' : 'error'}`}>
            <div className="alert-icon">
              {message.includes('✅') ? '✓' : message.includes('ℹ️') ? 'ℹ' : '⚠'}
            </div>
            <span>{message}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} onKeyPress={handleKeyPress} className="login-form">
          {/* Email Field */}
          <div className="input-group">
            <div className="input-icon">
              <Mail size={20} />
            </div>
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-input"
            />
            <div className="input-border"></div>
          </div>

          {/* Password Field */}
          <div className="input-group">
            <div className="input-icon">
              <Lock size={20} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="form-input"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="password-toggle"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <div className="input-border"></div>
          </div>

          {/* Forgot Password */}
          <div className="forgot-password-section">
            <button
              type="button"
              onClick={onSwitchToForget}
              disabled={loading}
              className="forgot-password-btn"
            >
              Forgot your password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="login-btn"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="btn-content">
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} className={isHovered ? 'btn-arrow-hover' : ''} />
                </>
              )}
            </span>
            <div className="btn-shine"></div>
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span>or continue with</span>
        </div>

        {/* Alternative Options */}
        <div className="alternative-options">
          <button
            onClick={onSwitchToSignup}
            disabled={loading}
            className="alt-option-btn signup-btn"
          >
            <User size={18} />
            Create new account
          </button>

          <button
            onClick={onSwitchToAgentLogin}
            disabled={loading}
            className="alt-option-btn agent-btn"
          >
            <Shield size={18} />
            Agent Login
          </button>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 80px;
          height: 80px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 120px;
          height: 120px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .shape-3 {
          width: 60px;
          height: 60px;
          bottom: 20%;
          left: 20%;
          animation-delay: 4s;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.2);
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
          animation: slideUp 0.6s ease-out;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .logo-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #0ea5e9, #3b82f6);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 20px rgba(14, 165, 233, 0.3);
        }

        .logo-text h1 {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #1f2937, #374151);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-text p {
          margin: 8px 0 0 0;
          color: #6b7280;
          font-size: 16px;
        }

        .message-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
          animation: slideDown 0.3s ease-out;
        }

        .message-alert.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message-alert.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          z-index: 1;
          transition: color 0.2s;
        }

        .form-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border: 2px solid #f3f4f6;
          border-radius: 12px;
          font-size: 16px;
          background: #ffffff;
          transition: all 0.2s;
          position: relative;
          z-index: 2;
        }

        .form-input:focus {
          outline: none;
          border-color: #0ea5e9;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }

        .form-input:focus + .input-border {
          transform: scaleX(1);
        }

        .input-border {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #0ea5e9, #3b82f6);
          transform: scaleX(0);
          transition: transform 0.3s ease;
          border-radius: 0 0 12px 12px;
        }

        .password-toggle {
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

        .password-toggle:hover {
          color: #6b7280;
        }

        .forgot-password-section {
          text-align: right;
          margin-bottom: 8px;
        }

        .forgot-password-btn {
          background: none;
          border: none;
          color: #0ea5e9;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }

        .forgot-password-btn:hover {
          color: #0284c7;
          text-decoration: underline;
        }

        .login-btn {
          position: relative;
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, #0ea5e9, #3b82f6);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          z-index: 2;
        }

        .btn-arrow-hover {
          transform: translateX(4px);
          transition: transform 0.2s ease;
        }

        .btn-shine {
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

        .login-btn:hover .btn-shine {
          left: 100%;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
          color: #9ca3af;
          font-size: 14px;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        .divider span {
          padding: 0 16px;
        }

        .alternative-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .alt-option-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .alt-option-btn:hover:not(:disabled) {
          border-color: #0ea5e9;
          color: #0ea5e9;
          transform: translateY(-1px);
        }

        .alt-option-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 24px;
          text-align: center;
        }

        .login-footer p {
          color: #6b7280;
          font-size: 12px;
          margin: 0;
        }

        .login-footer a {
          color: #0ea5e9;
          text-decoration: none;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 480px) {
          .login-card {
            padding: 24px;
            margin: 20px;
          }

          .logo-text h1 {
            font-size: 24px;
          }

          .alternative-options {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;