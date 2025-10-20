// AgentLogin.jsx - Updated URL tracking
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Globe, Navigation } from 'lucide-react';
import axios from 'axios';
import './Auth.css';

const AgentLogin = ({ 
  onSwitchToAgentSignup, 
  onSwitchToUserLogin, 
  onSwitchToAdminLogin,
  onLoginSuccess 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlHistory, setUrlHistory] = useState([]);

  // Enhanced URL tracking with hash routing
  useEffect(() => {
    const updateUrlInfo = () => {
      const fullUrl = window.location.href;
      const hash = window.location.hash;
      
      setCurrentUrl(fullUrl);
      
      // URL history maintain karo
      setUrlHistory(prev => {
        const newHistory = [...prev, {
          url: fullUrl,
          hash: hash,
          timestamp: new Date().toLocaleTimeString(),
          view: 'agent-login'
        }];
        // Last 5 URLs hi rakho
        return newHistory.slice(-5);
      });

      // Console logging for debugging
      console.log('🔐 Agent Login Page - URL Analysis:');
      console.log('📍 Full URL:', fullUrl);
      console.log('🔗 Hash:', hash || 'No hash');
      console.log('📱 Current View: agent-login');
    };

    // Initial call
    updateUrlInfo();

    // Hash change pe bhi update karo
    const handleHashChange = () => {
      console.log('🔄 Hash changed detected in AgentLogin');
      updateUrlInfo();
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Test function - Check karo URL update ho raha hai ya nahi
  const testURLUpdate = () => {
    console.log('🧪 Testing URL Update:');
    console.log('Current URL:', window.location.href);
    console.log('Current Hash:', window.location.hash);
    console.log('Expected Hash: #agent-login');
  };

  useEffect(() => {
    testURLUpdate();
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

    try {
      console.log('🔄 Attempting agent login from:', currentUrl);
      const res = await axios.post('http://localhost:5000/api/agent/auth/login', formData);
      
      if (res.data.success) {
        console.log('✅ Agent login successful:', res.data.agent.email);
        localStorage.setItem('agentToken', res.data.token);
        
        // ✅ URL update karo agent dashboard ke liye
        window.location.hash = 'agent';
        
        // Success callback call karo
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (err) {
      console.error('❌ Agent login error:', err.response?.data);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Enhanced URL Display */}
      {process.env.NODE_ENV === 'development' && (
        <div className="url-display-container">
          <div className="url-display">
            <Globe size={16} />
            <span className="url-label">Agent Login URL:</span>
            <span className="url-value">{currentUrl}</span>
          </div>
          <div className="url-debug-info">
            <span>Hash: <strong>{window.location.hash || 'None'}</strong></span>
            <span> | View: <strong>agent-login</strong></span>
            <span> | Port: {window.location.port}</span>
          </div>
          
          {/* URL Test Button */}
          <button 
            onClick={testURLUpdate}
            className="url-test-btn"
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              marginTop: '5px'
            }}
          >
            Test URL Update
          </button>
          
          {/* URL History */}
          <details className="url-history">
            <summary>URL History ({urlHistory.length})</summary>
            <div className="history-list">
              {urlHistory.slice().reverse().map((item, index) => (
                <div key={index} className="history-item">
                  <span className="time">[{item.timestamp}]</span>
                  <span className="url">{item.url}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">🏠</span>
            <span className="logo-text">AwasWala Agent</span>
          </div>
          <h2>Agent Login</h2>
          <p>Access your agent dashboard</p>
          
          {/* Current URL info inside card bhi */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              background: '#f8f9fa', 
              padding: '8px', 
              borderRadius: '4px', 
              marginTop: '10px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <Navigation size={12} style={{ display: 'inline', marginRight: '5px' }} />
              URL Hash: <strong>{window.location.hash || '#none'}</strong>
            </div>
          )}
        </div>

        {/* Rest of your existing form code... */}
        {/* ... */}
      </div>
    </div>
  );
};

export default AgentLogin;