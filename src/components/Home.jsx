import React from 'react';
import './Home.css';

const Home = ({ onNavigate, user, onLogout }) => {
  return (
    <div className="home-container">
      
      {/* Simple Header */}
      <div className="home-header">
        <button onClick={onLogout} className="logout-button">
          🚪 Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="home-content">
        <div className="welcome-section">
          <h1>Welcome to AwasWala 🏠</h1>
          <p className="welcome-subtitle">
            {user ? `Hello, ${user.name}!` : 'Property Management Made Easy'}
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card" onClick={() => onNavigate('tenant')}>
            <div className="feature-icon">👤</div>
            <h3>Tenant</h3>
            <p>Browse and book verified rooms</p>
            <button className="feature-button">Enter as Tenant</button>
          </div>

          <div className="feature-card" onClick={() => onNavigate('landlord')}>
            <div className="feature-icon">🏢</div>
            <h3>Landlord</h3>
            <p>List and manage your properties</p>
            <button className="feature-button">Enter as Landlord</button>
          </div>

          <div className="feature-card" onClick={() => onNavigate('agent-login')}>
            <div className="feature-icon">🔐</div>
            <h3>Agent</h3>
            <p>Verify rooms and manage properties</p>
            <button className="feature-button">Agent Login</button>
          </div>
        </div>

        {/* Agent Signup Option */}
        <div className="agent-signup-section">
          <p>
            Are you an agent? {' '}
            <button 
              onClick={() => onNavigate('agent-signup')}
              className="agent-signup-link"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;