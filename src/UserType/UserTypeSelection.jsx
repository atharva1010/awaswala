import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';

const UserTypeSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUserTypeSelect = (userType) => {
    localStorage.setItem('userType', userType);
    navigate(`/${userType}`);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left-panel">
          <div className="app-icon">
            <i className="fas fa-user-check"></i>
          </div>
          <h2 className="app-title">Choose Your Role</h2>
          <p className="app-description">
            Select how you want to use AwasWala platform
          </p>
        </div>
        
        <div className="auth-right-panel">
          <div className="form-container">
            <div style={{ 
              background: '#e3f2fd', 
              color: '#1565c0', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '30px', 
              textAlign: 'center' 
            }}>
              <i className="fas fa-check-circle"></i> 
              Welcome, {user?.name}! Login Successful
            </div>
            
            <h2 className="form-title">You Are...</h2>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
              Please select your role to continue
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                style={{
                  width: '100%',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '15px'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                onClick={() => handleUserTypeSelect('landlord')}
              >
                <i className="fas fa-building"></i>
                <span>LandLord</span>
              </button>
              
              <button 
                style={{
                  width: '100%',
                  padding: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '15px'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-3px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                onClick={() => handleUserTypeSelect('tenant')}
              >
                <i className="fas fa-home"></i>
                <span>Tenant</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;