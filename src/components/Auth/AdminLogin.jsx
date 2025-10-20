import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, User, Globe } from 'lucide-react';
import axios from 'axios';

const AdminLogin = ({ 
  onSwitchToUserLogin, 
  onSwitchToAgentLogin,
  onLoginSuccess 
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');

  // URL tracking
  useEffect(() => {
    const fullUrl = window.location.href;
    setCurrentUrl(fullUrl);
    
    console.log('👑 Admin Login Page - URL Analysis:');
    console.log('📍 Full URL:', fullUrl);
    console.log('🔗 Hash:', window.location.hash);
    console.log('📱 Current View: admin-login');
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Attempting admin login...');
      
      const res = await axios.post('http://localhost:5000/api/admin/auth/login', {
        username: formData.username,
        password: formData.password
      });
      
      if (res.data.success) {
        console.log('✅ Admin login successful');
        
        // Save admin token and user data
        localStorage.setItem('adminToken', res.data.token);
        localStorage.setItem('adminUser', JSON.stringify(res.data.admin));
        
        // Use hash-based navigation
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          // Fallback: Direct hash navigation
          window.location.hash = 'admin';
        }
      }
    } catch (error) {
      console.error('❌ Admin login error:', error.response?.data);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      {/* Development URL Display - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="url-display-container">
          <div className="url-display">
            <Globe size={16} />
            <span className="url-label">Admin Login URL:</span>
            <span className="url-value">{currentUrl}</span>
          </div>
          <div className="url-debug-info">
            <span>View: <strong>admin-login</strong></span>
            <span> | Hash: <strong>{window.location.hash || '#none'}</strong></span>
          </div>
        </div>
      )}

      <div className="admin-login-card">
        <div className="login-header">
          <div className="logo">
            <Shield size={40} />
            <h1>Admin Portal</h1>
          </div>
          <p>Access the administration dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="username">
              <User size={18} />
              Admin Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your admin username"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Password
            </label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-content">
                <div className="spinner"></div>
                Signing In...
              </span>
            ) : (
              'Sign In as Admin'
            )}
          </button>
        </form>

        {/* Navigation Links */}
        <div className="navigation-links">
          {onSwitchToUserLogin && (
            <button 
              onClick={onSwitchToUserLogin}
              className="nav-link"
            >
              ← User Login
            </button>
          )}
          {onSwitchToAgentLogin && (
            <button 
              onClick={onSwitchToAgentLogin}
              className="nav-link"
            >
              Agent Login →
            </button>
          )}
        </div>

        <div className="login-footer">
          <p>⚠️ Restricted Access - Authorized Personnel Only</p>
        </div>
      </div>

      <style jsx>{`
        .admin-login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .admin-login-card {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
          margin-top: ${process.env.NODE_ENV === 'development' ? '60px' : '0'};
        }

        /* URL Display Styles - Development only */
        .url-display-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #1a1a1a;
          color: #00ff00;
          padding: 8px 15px;
          font-size: 12px;
          font-family: 'Monaco', 'Consolas', monospace;
          border-bottom: 2px solid #00ff00;
          z-index: 10000;
          text-align: center;
        }

        .url-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .url-label {
          font-weight: bold;
          color: #fff;
        }

        .url-value {
          color: #00ff00;
          word-break: break-all;
        }

        .url-debug-info {
          margin-top: 4px;
          font-size: 10px;
          color: #ccc;
          display: flex;
          justify-content: center;
          gap: 15px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .logo h1 {
          margin: 0;
          color: #1e293b;
          font-size: 24px;
          font-weight: 700;
        }

        .login-header p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        .form-group input {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
          font-family: inherit;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group input::placeholder {
          color: #9ca3af;
        }

        .password-input {
          position: relative;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .password-toggle:hover {
          background-color: #f3f4f6;
        }

        .login-btn {
          padding: 12px;
          background: #1e40af;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 10px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-btn:hover:not(:disabled) {
          background: #1e3a8a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 64, 175, 0.3);
        }

        .login-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .loading-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          border: 1px solid #fecaca;
          text-align: center;
        }

        .navigation-links {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .nav-link {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 14px;
          text-decoration: underline;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .nav-link:hover {
          color: #1d4ed8;
          background-color: #f8fafc;
        }

        .login-footer {
          margin-top: 20px;
          text-align: center;
        }

        .login-footer p {
          margin: 0;
          color: #ef4444;
          font-size: 12px;
          font-weight: 500;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .admin-login-card {
            padding: 30px 20px;
            margin: 20px;
          }

          .url-display-container {
            padding: 6px 10px;
            font-size: 10px;
          }
          
          .url-display {
            flex-direction: column;
            gap: 4px;
          }
          
          .url-debug-info {
            flex-direction: column;
            gap: 2px;
          }

          .navigation-links {
            flex-direction: column;
            gap: 10px;
            align-items: center;
          }

          .nav-link {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;