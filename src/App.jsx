import React, { useState, useEffect } from 'react';
import SignupPage from './components/Auth/Signup.jsx';
import LoginPage from './components/Auth/Login.jsx';
import ForgetPassword from './components/Auth/ForgetPassword.jsx';
import AgentSignup from './components/Auth/AgentSignup.jsx';
import AgentLogin from './components/Auth/AgentLogin.jsx';
import AdminLogin from './components/Auth/AdminLogin.jsx';
import Home from './components/Home.jsx';
import Tenant from './components/Tenant';
import Landlord from './components/Landlord.jsx'; 
import Agent from './components/Agent';
import AdminDashboard from './components/AdminDashboard.jsx';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Main App Content Component
function AppContent() {
  const [currentView, setCurrentView] = useState('login');
  const [lastUserType, setLastUserType] = useState('user');
  const { user, isAuthenticated, loading, logout } = useAuth();

  // ✅ FIXED: Enhanced Hash-based Routing Setup
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      console.log('🔗 Hash changed to:', hash);
      
      const validViews = [
        'login', 'signup', 'agent-login', 'agent-signup', 
        'admin-login', 'home', 'agent', 'admin', 'landlord', 
        'tenant', 'forget'
      ];
      
      if (hash && validViews.includes(hash)) {
        console.log('🔄 Setting current view from URL hash:', hash);
        setCurrentView(hash);
      } else if (!hash) {
        // Default to login if no hash
        setCurrentView('login');
        window.location.hash = 'login';
      }
    };

    // ✅ FIXED: Better initial hash handling
    const initialHash = window.location.hash.replace('#', '');
    console.log('🔍 Initial hash detected:', initialHash);
    
    if (initialHash && initialHash !== currentView) {
      console.log('🔄 Setting initial view from URL:', initialHash);
      setCurrentView(initialHash);
    } else if (!initialHash) {
      console.log('🔍 No hash found, setting default to login');
      setCurrentView('login');
      window.location.hash = 'login';
    }

    // ✅ FIXED: Add event listener for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []); // ✅ REMOVED: currentView dependency to prevent loops

  // ✅ FIXED: Navigation function with proper hash update
  const navigateTo = (view, userType = 'user') => {
    console.log('🚀 Navigating to:', view, 'User Type:', userType);
    console.log('📍 Previous view:', currentView);
    
    // Track user type for smart redirects
    if (['admin', 'agent', 'home'].includes(view)) {
      setLastUserType(userType);
    }
    
    // ✅ FIXED: Set hash first, then update state
    window.location.hash = view;
    setCurrentView(view);
    
    console.log('✅ Navigation complete - Hash:', window.location.hash, 'View:', view);
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem('token');
      const agentToken = localStorage.getItem('agentToken');
      const adminToken = localStorage.getItem('adminToken');

      console.log('🔄 Checking authentication status...');
      console.log('Current View:', currentView);
      console.log('User Token:', token ? 'Present' : 'Missing');
      console.log('Agent Token:', agentToken ? 'Present' : 'Missing');
      console.log('Admin Token:', adminToken ? 'Present' : 'Missing');

      if (loading) return;

      // ✅ FIXED: Don't redirect if we're already on an auth page
      const isOnAuthPage = ['login', 'signup', 'agent-login', 'agent-signup', 'admin-login', 'forget'].includes(currentView);
      
      if (adminToken && !isOnAuthPage) {
        console.log('👑 Admin token found, redirecting to admin dashboard...');
        navigateTo('admin', 'admin');
      }
      else if (agentToken && !isAuthenticated && !isOnAuthPage) {
        console.log('🔑 Agent token found, redirecting to agent dashboard...');
        navigateTo('agent', 'agent');
      }
      else if (token && isAuthenticated && user && !isOnAuthPage) {
        console.log('👤 User authenticated, redirecting to home...');
        navigateTo('home', 'user');
      }
      else if (!token && !agentToken && !adminToken && currentView === 'home') {
        console.log('❌ No tokens found, redirecting to login...');
        navigateTo('login');
      }
    };

    checkAuthentication();
  }, [isAuthenticated, loading, user, currentView]);

  // ✅ FIXED: Enhanced Smart Logout Function
  const handleLogout = (userType = lastUserType) => {
    console.log('🚪 Logging out user type:', userType);
    
    // Saare tokens clear karo
    localStorage.removeItem('token');
    localStorage.removeItem('agentToken');
    localStorage.removeItem('adminToken');
    
    // Auth context ko bhi logout karo
    logout();
    
    // ✅ FIXED: Smart redirect based on user type
    let redirectView = 'login';
    
    switch(userType) {
      case 'admin':
        redirectView = 'admin-login';
        console.log('🔄 Redirecting to Admin Login');
        break;
      case 'agent':
        redirectView = 'agent-login';
        console.log('🔄 Redirecting to Agent Login');
        break;
      case 'user':
      default:
        redirectView = 'login';
        console.log('🔄 Redirecting to User Login');
        break;
    }
    
    // ✅ FIXED: Use navigateTo for consistent hash update
    navigateTo(redirectView);
    
    console.log('✅ Logout successful, redirected to:', redirectView);
  };

  // Loading component
  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Debug current view and URL
  console.log('📱 Current View:', currentView);
  console.log('🌐 Current URL:', window.location.href);
  console.log('🔗 Current Hash:', window.location.hash);
  console.log('👤 Last User Type:', lastUserType);

  return (
    <div className={`app ${currentView === 'home' ? 'app-home' : ''} ${currentView === 'agent' ? 'app-agent' : ''} ${currentView === 'admin' ? 'app-admin' : ''}`}>
      
      {/* Main Content */}
      <div className="app-content">
        {/* ✅ FIXED: All view conditions with proper hash mapping */}
        {currentView === 'signup' && (
          <SignupPage 
            onSwitchToLogin={() => navigateTo('login')}
            onSwitchToAgentSignup={() => navigateTo('agent-signup')}
            onSwitchToAdminLogin={() => navigateTo('admin-login')}
          />
        )}

        {currentView === 'login' && (
          <LoginPage
            onSwitchToSignup={() => navigateTo('signup')}
            onSwitchToForget={() => navigateTo('forget')}
            onSwitchToAgentLogin={() => navigateTo('agent-login')}
            onSwitchToAdminLogin={() => navigateTo('admin-login')}
            onLoginSuccess={() => navigateTo('home', 'user')}
          />
        )}

        {currentView === 'forget' && (
          <ForgetPassword onSwitchToLogin={() => navigateTo('login')} />
        )}

        {currentView === 'agent-signup' && (
          <AgentSignup 
            onSwitchToAgentLogin={() => navigateTo('agent-login')}
            onSwitchToUserSignup={() => navigateTo('signup')}
            onSignupSuccess={() => {
              console.log('✅ Agent signup success, redirecting to login...');
              navigateTo('agent-login');
            }}
          />
        )}

        {/* ✅ FIXED: Agent Login View */}
        {currentView === 'agent-login' && (
          <AgentLogin
            onSwitchToAgentSignup={() => navigateTo('agent-signup')}
            onSwitchToUserLogin={() => navigateTo('login')}
            onSwitchToAdminLogin={() => navigateTo('admin-login')}
            onLoginSuccess={() => {
              console.log('✅ Agent login success callback triggered');
              setTimeout(() => {
                navigateTo('agent', 'agent');
              }, 100);
            }}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin
            onSwitchToUserLogin={() => navigateTo('login')}
            onSwitchToAgentLogin={() => navigateTo('agent-login')}
            onLoginSuccess={() => {
              console.log('✅ Admin login success callback triggered');
              setTimeout(() => {
                navigateTo('admin', 'admin');
              }, 100);
            }}
          />
        )}

        {currentView === 'home' && (
          <Home 
            onNavigate={navigateTo} 
            user={user}
            onLogout={() => handleLogout('user')}
          />
        )}

        {currentView === 'tenant' && <Tenant />}
        
        {currentView === 'landlord' && <Landlord />}
        
        {/* Agent Dashboard */}
        {currentView === 'agent' && (
          <Agent 
            onLogout={() => handleLogout('agent')}
          />
        )}

        {/* Admin Dashboard */}
        {currentView === 'admin' && (
          <div className="admin-fullscreen-container">
            <AdminDashboard 
              onLogout={() => handleLogout('admin')}
            />
          </div>
        )}
      </div>

      {/* Auth Footer Links */}
      {(currentView === 'signup' || currentView === 'login' || currentView === 'agent-signup' || currentView === 'agent-login' || currentView === 'admin-login') && (
        <div className="auth-footer-links">
          {currentView === 'signup' && (
            <p className="auth-footer-text">
              Already have an account?{' '}
              <button 
                onClick={() => navigateTo('login')}
                className="auth-footer-link"
              >
                Login here
              </button>
            </p>
          )}
          
          {currentView === 'login' && (
            <p className="auth-footer-text">
              Don't have an account?{' '}
              <button 
                onClick={() => navigateTo('signup')}
                className="auth-footer-link"
              >
                Sign up here
              </button>
            </p>
          )}
          
          {currentView === 'agent-signup' && (
            <p className="auth-footer-text">
              Already have an agent account?{' '}
              <button 
                onClick={() => navigateTo('agent-login')}
                className="auth-footer-link"
              >
                Login here
              </button>
            </p>
          )}
          
          {currentView === 'agent-login' && (
            <p className="auth-footer-text">
              Don't have an agent account?{' '}
              <button 
                onClick={() => navigateTo('agent-signup')}
                className="auth-footer-link"
              >
                Sign up here
              </button>
            </p>
          )}

          {currentView === 'admin-login' && (
            <p className="auth-footer-text">
              <button 
                onClick={() => navigateTo('login')}
                className="auth-footer-link"
              >
                ← Back to User Login
              </button>
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .app {
          width: 100%;
          min-height: 100vh;
          transition: all 0.3s ease;
        }

        .admin-fullscreen-container {
          width: 100vw;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          background: #f8fafc;
          overflow: hidden;
        }

        .app-content {
          width: 100%;
          min-height: 100vh;
        }

        .auth-footer-links {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
        }

        .auth-footer-text {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }

        .auth-footer-link {
          background: none;
          border: none;
          color: #007bff;
          cursor: pointer;
          text-decoration: underline;
          font-size: 14px;
        }

        .auth-footer-link:hover {
          color: #0056b3;
        }

        .app-home {
          background: #f8f9fa;
        }

        .app-agent {
          background: #f0f8ff;
        }

        .app-admin {
          background: #f8fafc;
        }

        .app-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .app-loading .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;