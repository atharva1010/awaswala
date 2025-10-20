import React, { useState, useEffect } from 'react';
import { 
  Eye, EyeOff, User, Mail, Phone, MapPin, IdCard, 
  Camera, Upload, X, ArrowRight, Shield, Building2,
  Key, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import axios from 'axios';

const AgentSignup = ({ onSwitchToAgentLogin, onSwitchToUserSignup, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    aadharNumber: '',
    zone: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [isHovered, setIsHovered] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);

  useEffect(() => {
    const errors = {};
    
    if (formData.name && formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone must be 10 digits';
    }
    
    if (formData.aadharNumber && !/^\d{12}$/.test(formData.aadharNumber)) {
      errors.aadharNumber = 'Aadhar must be 12 digits';
    }
    
    setValidationErrors(errors);
  }, [formData]);

  // Check application status when email changes
  useEffect(() => {
    if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
      checkApplicationStatus(formData.email);
    }
  }, [formData.email]);

  const checkApplicationStatus = async (email) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/agent/application-status/${email}`);
      if (res.data.success) {
        setApplicationStatus(res.data.application);
      }
    } catch (error) {
      // Agent not found - this is normal for new applications
      setApplicationStatus(null);
    }
  };

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setError('Please select JPEG, PNG, or WebP image');
      return;
    }

    if (file.size > maxSize) {
      setError('Image size should be less than 5MB');
      return;
    }

    setProfilePic(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfilePicPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePic = () => {
    setProfilePic(null);
    setProfilePicPreview('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'phone' || name === 'aadharNumber') {
      processedValue = value.replace(/\D/g, '');
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      errors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.aadharNumber) {
      errors.aadharNumber = 'Aadhar number is required';
    } else if (!/^\d{12}$/.test(formData.aadharNumber)) {
      errors.aadharNumber = 'Aadhar number must be 12 digits';
    }
    
    if (!formData.zone) {
      errors.zone = 'Please select your working zone';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      setError('Please fix the form errors');
      return;
    }

    // Check if application already exists and is pending
    if (applicationStatus && applicationStatus.status === 'pending') {
      setLoading(false);
      setError('You already have a pending application with this email. Please wait for admin approval.');
      return;
    }

    try {
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      if (profilePic) {
        submitData.append('profilePic', profilePic);
      }
      
      const res = await axios.post('http://localhost:5000/api/agent/auth/signup', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        // Don't save token - wait for admin approval
        setSuccess('✅ Application submitted successfully! Your account will be activated after admin approval. You will receive an email notification once approved.');
        
        // Form clear karein
        setFormData({ name: '', email: '', password: '', phone: '', aadharNumber: '', zone: '' });
        setProfilePic(null);
        setProfilePicPreview('');
        setApplicationStatus(res.data.agent);
        
        // Auto-redirect nahi karenge
        setTimeout(() => {
          if (onSignupSuccess) {
            onSignupSuccess();
          }
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Agent signup error:', err);
      
      if (err.response) {
        const serverError = err.response.data;
        setError(serverError.message || `Registration failed: ${err.response.status}`);
        
        if (serverError.errors) {
          const fieldErrors = {};
          serverError.errors.forEach(error => {
            fieldErrors[error.path] = error.msg;
          });
          setValidationErrors(fieldErrors);
        }
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.name && 
           formData.email && 
           formData.password && 
           formData.password.length >= 6 &&
           formData.phone && 
           formData.phone.length === 10 &&
           formData.aadharNumber && 
           formData.aadharNumber.length === 12 &&
           formData.zone &&
           Object.keys(validationErrors).length === 0;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && isFormValid()) {
      handleSubmit(e);
    }
  };

  const getStatusMessage = () => {
    if (!applicationStatus) return null;

    switch (applicationStatus.status) {
      case 'pending':
        return {
          icon: <Clock size={20} />,
          message: 'Your application is under review',
          description: 'We will notify you once approved',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'approved':
        return {
          icon: <CheckCircle size={20} />,
          message: 'Application approved!',
          description: 'You can now login to your account',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: <AlertCircle size={20} />,
          message: 'Application rejected',
          description: applicationStatus.rejectionReason || 'Please contact admin for details',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="agent-signup-container">
      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="agent-signup-card">
        {/* Header Section */}
        <div className="agent-signup-header">
          <div className="agent-logo-section">
            <div className="agent-logo-icon">
              <Shield size={32} />
            </div>
            <div className="agent-logo-text">
              <h1>Join Our Team</h1>
              <p>Become a verified AwasWala agent</p>
            </div>
          </div>
        </div>

        {/* Application Status */}
        {statusInfo && (
          <div className={`application-status ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
            <div className={`status-icon ${statusInfo.color}`}>
              {statusInfo.icon}
            </div>
            <div className="status-content">
              <h3 className={`status-title ${statusInfo.color}`}>
                {statusInfo.message}
              </h3>
              <p className="status-description">
                {statusInfo.description}
              </p>
              {applicationStatus?.appliedAt && (
                <p className="status-date">
                  Applied on: {new Date(applicationStatus.appliedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="agent-message error">
            <div className="message-icon">⚠</div>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="agent-message success">
            <div className="message-icon">✓</div>
            <span>{success}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} onKeyPress={handleKeyPress} className="agent-signup-form">
          {/* Profile Picture Upload */}
          <div className="agent-profile-upload">
            <div className="profile-preview-container">
              {profilePicPreview ? (
                <div className="profile-preview-with-remove">
                  <img src={profilePicPreview} alt="Profile preview" className="profile-preview-img" />
                  <button 
                    type="button" 
                    onClick={removeProfilePic}
                    className="remove-profile-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="profile-upload-area">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleProfilePicUpload}
                    className="profile-input"
                    disabled={loading}
                  />
                  <div className="upload-placeholder">
                    <Camera size={24} />
                    <span>Add Photo</span>
                  </div>
                </label>
              )}
            </div>
            <div className="upload-info">
              <p className="upload-title">Profile Picture</p>
              <p className="upload-subtitle">Optional • Max 5MB</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="agent-form-grid">
            {/* Name Field */}
            <div className="agent-input-group">
              <div className="agent-input-icon">
                <User size={20} />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                required
                disabled={loading || (applicationStatus && applicationStatus.status === 'pending')}
                className={`agent-form-input ${validationErrors.name ? 'input-error' : ''}`}
              />
              {validationErrors.name && (
                <span className="agent-field-error">{validationErrors.name}</span>
              )}
            </div>

            {/* Email Field */}
            <div className="agent-input-group">
              <div className="agent-input-icon">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                required
                disabled={loading || (applicationStatus && applicationStatus.status === 'pending')}
                className={`agent-form-input ${validationErrors.email ? 'input-error' : ''}`}
              />
              {validationErrors.email && (
                <span className="agent-field-error">{validationErrors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="agent-input-group">
              <div className="agent-input-icon">
                <Key size={20} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password (min 6 characters)"
                required
                disabled={loading || (applicationStatus && applicationStatus.status === 'pending')}
                className={`agent-form-input ${validationErrors.password ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="agent-password-toggle"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {validationErrors.password && (
                <span className="agent-field-error">{validationErrors.password}</span>
              )}
            </div>

            {/* Phone Field */}
            <div className="agent-input-group">
              <div className="agent-input-icon">
                <Phone size={20} />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number (10 digits)"
                maxLength="10"
                required
                disabled={loading || (applicationStatus && applicationStatus.status === 'pending')}
                className={`agent-form-input ${validationErrors.phone ? 'input-error' : ''}`}
              />
              {validationErrors.phone && (
                <span className="agent-field-error">{validationErrors.phone}</span>
              )}
            </div>

            {/* Aadhar Field */}
            <div className="agent-input-group">
              <div className="agent-input-icon">
                <IdCard size={20} />
              </div>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleChange}
                placeholder="Aadhar Number (12 digits)"
                maxLength="12"
                required
                disabled={loading || (applicationStatus && applicationStatus.status === 'pending')}
                className={`agent-form-input ${validationErrors.aadharNumber ? 'input-error' : ''}`}
              />
              {validationErrors.aadharNumber && (
                <span className="agent-field-error">{validationErrors.aadharNumber}</span>
              )}
            </div>

            {/* Zone Field */}
            <div className="agent-input-group">
              <div className="agent-input-icon">
                <MapPin size={20} />
              </div>
              <select
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                required
                disabled={loading || (applicationStatus && applicationStatus.status === 'pending')}
                className={`agent-form-input ${validationErrors.zone ? 'input-error' : ''}`}
              >
                <option value="">Select Working Zone</option>
                <option value="North Delhi">North Delhi</option>
                <option value="South Delhi">South Delhi</option>
                <option value="East Delhi">East Delhi</option>
                <option value="West Delhi">West Delhi</option>
                <option value="Central Delhi">Central Delhi</option>
                <option value="Gurgaon">Gurgaon</option>
                <option value="Noida">Noida</option>
                <option value="Faridabad">Faridabad</option>
              </select>
              {validationErrors.zone && (
                <span className="agent-field-error">{validationErrors.zone}</span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !isFormValid() || (applicationStatus && applicationStatus.status === 'pending')}
            className="agent-signup-btn"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="agent-btn-content">
              {loading ? (
                <>
                  <div className="agent-spinner"></div>
                  Submitting Application...
                </>
              ) : applicationStatus && applicationStatus.status === 'pending' ? (
                <>
                  <Clock size={18} />
                  Application Pending
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight size={18} className={isHovered ? 'agent-btn-arrow-hover' : ''} />
                </>
              )}
            </span>
            <div className="agent-btn-shine"></div>
          </button>
        </form>

        {/* Application Info */}
        <div className="application-info">
          <div className="info-item">
            <Shield size={16} />
            <span>Admin approval required</span>
          </div>
          <div className="info-item">
            <Clock size={16} />
            <span>24-48 hours processing time</span>
          </div>
          <div className="info-item">
            <Mail size={16} />
            <span>Email notification on approval</span>
          </div>
        </div>

        {/* Alternative Options */}
        <div className="agent-signup-footer">
          <p>Already have an agent account?{' '}
            <button onClick={onSwitchToAgentLogin} className="agent-footer-link">
              Sign in here
            </button>
          </p>
          <p className="footer-note">
            After approval, you can login and access the agent dashboard
          </p>
        </div>
      </div>

      <style jsx>{`
        .agent-signup-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
          position: relative;
          overflow: hidden;
        }

        .background-animation {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: agent-float 8s ease-in-out infinite;
        }

        .shape-1 {
          width: 120px;
          height: 120px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 80px;
          height: 80px;
          top: 70%;
          right: 15%;
          animation-delay: 3s;
        }

        .shape-3 {
          width: 100px;
          height: 100px;
          bottom: 15%;
          left: 20%;
          animation-delay: 6s;
        }

        .agent-signup-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 24px;
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.2);
          width: 100%;
          max-width: 500px;
          position: relative;
          z-index: 1;
          animation: agent-slideUp 0.6s ease-out;
        }

        .agent-signup-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .agent-logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .agent-logo-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #1e40af, #3730a3);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 10px 25px rgba(30, 64, 175, 0.3);
        }

        .agent-logo-text h1 {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #1e40af, #3730a3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .agent-logo-text p {
          margin: 8px 0 0 0;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        }

        /* Application Status */
        .application-status {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid;
          animation: agent-slideDown 0.3s ease-out;
        }

        .status-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .status-content {
          flex: 1;
        }

        .status-title {
          font-weight: 600;
          font-size: 14px;
          margin: 0 0 4px 0;
        }

        .status-description {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 4px 0;
        }

        .status-date {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .agent-message {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
          animation: agent-slideDown 0.3s ease-out;
        }

        .agent-message.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .agent-message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .message-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
        }

        .agent-signup-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Profile Upload */
        .agent-profile-upload {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 16px;
          border: 2px dashed #e2e8f0;
        }

        .profile-preview-container {
          flex-shrink: 0;
        }

        .profile-preview-with-remove {
          position: relative;
          display: inline-block;
        }

        .profile-preview-img {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          object-fit: cover;
          border: 3px solid #1e40af;
        }

        .remove-profile-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 24px;
          height: 24px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .profile-upload-area {
          cursor: pointer;
        }

        .profile-input {
          display: none;
        }

        .upload-placeholder {
          width: 80px;
          height: 80px;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.2s;
        }

        .upload-placeholder:hover {
          border-color: #1e40af;
          color: #1e40af;
        }

        .upload-info {
          flex: 1;
        }

        .upload-title {
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .upload-subtitle {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }

        /* Form Grid */
        .agent-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .agent-input-group {
          position: relative;
        }

        .agent-input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          z-index: 1;
          transition: color 0.2s;
        }

        .agent-form-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border: 2px solid #f1f5f9;
          border-radius: 12px;
          font-size: 15px;
          background: #ffffff;
          transition: all 0.2s;
          position: relative;
          z-index: 2;
          font-weight: 500;
        }

        .agent-form-input:focus {
          outline: none;
          border-color: #1e40af;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
        }

        .agent-form-input.input-error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .agent-password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
          z-index: 2;
        }

        .agent-password-toggle:hover {
          color: #6b7280;
        }

        .agent-field-error {
          color: #ef4444;
          font-size: 12px;
          margin-top: 4px;
          display: block;
          font-weight: 500;
        }

        /* Signup Button */
        .agent-signup-btn {
          position: relative;
          width: 100%;
          padding: 18px 24px;
          background: linear-gradient(135deg, #1e40af, #3730a3);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(30, 64, 175, 0.3);
          margin-top: 10px;
        }

        .agent-signup-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(30, 64, 175, 0.4);
        }

        .agent-signup-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .agent-signup-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          background: #9ca3af;
        }

        .agent-btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          z-index: 2;
          font-size: 15px;
        }

        .agent-btn-arrow-hover {
          transform: translateX(4px);
          transition: transform 0.2s ease;
        }

        .agent-btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s ease;
        }

        .agent-signup-btn:hover .agent-btn-shine {
          left: 100%;
        }

        .agent-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: agent-spin 1s linear infinite;
        }

        /* Application Info */
        .application-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 20px 0;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
        }

        .info-item svg {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        /* Footer */
        .agent-signup-footer {
          margin-top: 24px;
          text-align: center;
        }

        .agent-signup-footer p {
          color: #6b7280;
          font-size: 14px;
          margin: 0 0 8px 0;
        }

        .footer-note {
          font-size: 12px !important;
          color: #9ca3af !important;
          font-style: italic;
        }

        .agent-footer-link {
          background: none;
          border: none;
          color: #1e40af;
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
        }

        .agent-footer-link:hover {
          color: #3730a3;
        }

        /* Animations */
        @keyframes agent-float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-25px) rotate(180deg);
          }
        }

        @keyframes agent-slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes agent-slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes agent-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 480px) {
          .agent-signup-card {
            padding: 24px;
            margin: 20px;
          }

          .agent-logo-text h1 {
            font-size: 24px;
          }

          .agent-profile-upload {
            flex-direction: column;
            text-align: center;
          }

          .agent-form-grid {
            grid-template-columns: 1fr;
          }

          .application-info {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AgentSignup;