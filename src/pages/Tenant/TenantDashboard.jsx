import React from 'react';
import { useAuth } from '../../services/auth';

const TenantDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', background: 'white', borderRadius: '15px', padding: '20px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1>Tenant Dashboard</h1>
          <button onClick={logout} style={{ padding: '10px 20px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Logout
          </button>
        </header>
        
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Welcome, {user?.name}!</h2>
          <p>Tenant features coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default TenantDashboard;