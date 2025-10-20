import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, MapPin, IdCard } from 'lucide-react';
import axios from 'axios';
import './Auth.css';

const AgentSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    aadharNumber: '',
    zone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

    // Validation
    if (formData.aadharNumber.length !== 12) {
      setError('Aadhar number must be 12 digits');
      setLoading(false);
      return;
    }

    if (formData.phone.length !== 10) {
      setError('Phone number must be 10 digits');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/agent/auth/signup', formData);
      
      if (res.data.success) {
        localStorage.setItem('agentToken', res.data.token);
        alert('Registration successful! Please wait for admin verification.');
        navigate('/agent/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <span className="logo-icon">🏠</span>
            <span className="logo-text">RentoLo Agent</span>
          </div>
          <h2>Create Agent Account</h2>
          <p>Join our network of verified agents</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <User size={20} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={20} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              {showPassword ? (
                <EyeOff size={20} onClick={() => setShowPassword(false)} className="eye-icon" />
              ) : (
                <Eye size={20} onClick={() => setShowPassword(true)} className="eye-icon" />
              )}
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min 6 characters)"
                minLength="6"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <div className="input-with-icon">
              <Phone size={20} />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit phone number"
                pattern="[0-9]{10}"
                maxLength="10"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Aadhar Number</label>
            <div className="input-with-icon">
              <IdCard size={20} />
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleChange}
                placeholder="Enter 12-digit Aadhar number"
                pattern="[0-9]{12}"
                maxLength="12"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Working Zone</label>
            <div className="input-with-icon">
              <MapPin size={20} />
              <select
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                required
              >
                <option value="">Select your zone</option>
                <option value="North Delhi">North Delhi</option>
                <option value="South Delhi">South Delhi</option>
                <option value="East Delhi">East Delhi</option>
                <option value="West Delhi">West Delhi</option>
                <option value="Central Delhi">Central Delhi</option>
                <option value="Gurgaon">Gurgaon</option>
                <option value="Noida">Noida</option>
                <option value="Faridabad">Faridabad</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Agent Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/agent/login" className="auth-link">
              Sign in here
            </Link>
          </p>
          <p>
            Are you a tenant?{' '}
            <Link to="/signup" className="auth-link">
              Sign up as tenant
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentSignup;