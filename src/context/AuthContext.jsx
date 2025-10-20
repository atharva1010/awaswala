import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create Context
const AuthContext = createContext();

// Custom Hook for using AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Base URL for API
const API_BASE_URL = 'http://localhost:5000/api';

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token) {
      setLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      // Try different user info endpoints
      const endpoints = [
        `${API_BASE_URL}/users/me`,
        `${API_BASE_URL}/auth/me`,
        `${API_BASE_URL}/user/profile`
      ];

      let userData = null;
      
      for (const endpoint of endpoints) {
        try {
          const res = await axios.get(endpoint, {
            headers: { 
              Authorization: `Bearer ${token}` 
            }
          });
          
          if (res.data && res.data.user) {
            userData = res.data.user;
            break;
          } else if (res.data) {
            userData = res.data;
            break;
          }
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, error.message);
          continue;
        }
      }

      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // If stored user exists but no endpoint works, use stored data
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } else {
          handleAutoLogout();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      handleAutoLogout();
    } finally {
      setLoading(false);
    }
  };

  // Auto logout when token is invalid
  const handleAutoLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Login function with multiple endpoint attempts
  const login = async (email, password) => {
    try {
      // Try different login endpoints
      const endpoints = [
        `${API_BASE_URL}/auth/login`,
        `${API_BASE_URL}/users/login`,
        `${API_BASE_URL}/login`,
        `${API_BASE_URL}/user/login`
      ];

      let result = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying login endpoint: ${endpoint}`);
          const res = await axios.post(endpoint, {
            email,
            password
          });

          if (res.data) {
            result = res.data;
            console.log('Login successful at:', endpoint, result);
            break;
          }
        } catch (error) {
          console.log(`Login failed at ${endpoint}:`, error.message);
          continue;
        }
      }

      if (result) {
        const token = result.token || result.accessToken;
        const userData = result.user || result.data;
        
        if (token && userData) {
          // Store token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          setIsAuthenticated(true);
          
          return { 
            success: true, 
            message: 'Login successful!', 
            user: userData 
          };
        }
      }

      return { 
        success: false, 
        message: 'No valid login endpoint found. Please check your backend routes.' 
      };

    } catch (error) {
      console.error('Login failed:', error);
      
      // More specific error messages
      if (error.response) {
        if (error.response.status === 404) {
          return { 
            success: false, 
            message: 'Login endpoint not found. Please check backend routes.' 
          };
        } else if (error.response.status === 401) {
          return { 
            success: false, 
            message: 'Invalid email or password.' 
          };
        } else {
          return { 
            success: false, 
            message: error.response.data?.message || 'Login failed. Please try again.' 
          };
        }
      } else if (error.request) {
        return { 
          success: false, 
          message: 'Cannot connect to server. Please check if backend is running.' 
        };
      } else {
        return { 
          success: false, 
          message: 'Login failed. Please try again.' 
        };
      }
    }
  };

  // Register function with multiple endpoint attempts
  const register = async (userData) => {
    try {
      // Try different register endpoints
      const endpoints = [
        `${API_BASE_URL}/auth/register`,
        `${API_BASE_URL}/users/register`,
        `${API_BASE_URL}/register`,
        `${API_BASE_URL}/user/register`
      ];

      let result = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying register endpoint: ${endpoint}`);
          const res = await axios.post(endpoint, userData);

          if (res.data) {
            result = res.data;
            console.log('Registration successful at:', endpoint, result);
            break;
          }
        } catch (error) {
          console.log(`Registration failed at ${endpoint}:`, error.message);
          continue;
        }
      }

      if (result) {
        const token = result.token || result.accessToken;
        const userData = result.user || result.data;
        
        if (token && userData) {
          // Store token and user data
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));
          
          setUser(userData);
          setIsAuthenticated(true);
          
          return { 
            success: true, 
            message: 'Registration successful!', 
            user: userData 
          };
        }
      }

      return { 
        success: false, 
        message: 'No valid registration endpoint found. Please check your backend routes.' 
      };

    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  // Logout function
  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user profile
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Check if user has token (for protected routes)
  const hasToken = () => {
    return !!localStorage.getItem('token');
  };

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    getAuthHeaders,
    checkAuth,
    hasToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;