import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing authentication
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Mock API calls for demonstration
  const signup = async (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate successful signup
        resolve({ 
          success: true, 
          message: 'User registered successfully' 
        });
      }, 1500);
    });
  };

  const sendOTP = async (mobile) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (mobile.length === 10) {
          resolve({ 
            success: true, 
            message: 'OTP sent successfully' 
          });
        } else {
          reject({ message: 'Invalid mobile number' });
        }
      }, 1000);
    });
  };

  const verifyOTP = async (mobile, otp) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (otp === '123456') { // Mock OTP for testing
          const user = {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            mobile: mobile,
            profilePic: null
          };
          
          localStorage.setItem('authToken', 'mock-jwt-token');
          localStorage.setItem('userData', JSON.stringify(user));
          setUser(user);
          
          resolve({ 
            success: true, 
            token: 'mock-jwt-token',
            user: user
          });
        } else {
          reject({ message: 'Invalid OTP' });
        }
      }, 1000);
    });
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    signup,
    sendOTP,
    verifyOTP,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};