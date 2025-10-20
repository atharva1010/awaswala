import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

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
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const signup = async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const sendOTP = async (mobile) => {
    try {
      const response = await api.post('/auth/send-otp', { mobile });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const verifyOTP = async (mobile, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { mobile, otp });
      const { token, user } = response.data;
      
      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(user));
      setUser(user);
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
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