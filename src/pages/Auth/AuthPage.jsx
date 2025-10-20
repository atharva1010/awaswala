import React, { useState } from 'react';
import Signup from '../../components/Auth/Signup';
import Login from '../../components/Auth/Login';
import './AuthPage.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(false);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left-panel">
          <div className="app-icon">
            <i className="fas fa-lock"></i>
          </div>
          <h2 className="app-title">AwasWala - Property Management</h2>
          <p className="app-description">
            Manage your properties efficiently as a landlord or find your perfect home as a tenant.
          </p>
        </div>
        
        <div className="auth-right-panel">
          {isLogin ? (
            <Login onSwitchToSignup={() => setIsLogin(false)} />
          ) : (
            <Signup onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;