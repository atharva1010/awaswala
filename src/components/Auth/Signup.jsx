import React, { useState } from 'react';
import { Eye, EyeOff, User, Phone, Mail, MapPin, Camera, Lock, ArrowRight } from 'lucide-react';

const SignupPage = ({ onSwitchToLogin }) => {
  const [signupData, setSignupData] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    confirmPassword: ''
  });
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const handleInputChange = (field) => (e) => {
    setSignupData({ ...signupData, [field]: e.target.value });
    if (message) setMessage('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setMessage('❌ Please select JPEG, PNG, or WebP image');
      return;
    }

    if (file.size > maxSize) {
      setMessage('❌ Image size should be less than 5MB');
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

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!signupData.name || !signupData.mobile || !signupData.email || !signupData.password || !signupData.confirmPassword) {
      setMessage('❌ All required fields must be filled!');
      setLoading(false);
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setMessage('❌ Passwords do not match!');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      for (let key in signupData) formData.append(key, signupData[key]);
      if (profilePic) formData.append('profilePic', profilePic);

      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage('✅ Signup successful! You can now login.');
        setSignupData({
          name: '',
          mobile: '',
          email: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          password: '',
          confirmPassword: ''
        });
        setProfilePic(null);
        setProfilePicPreview('');
      } else {
        setMessage(result.message || '❌ Signup failed.');
      }
    } catch (err) {
      console.error('Signup Error:', err);
      setMessage('⚠️ Network or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="signup-card">
        {/* Header Section */}
        <div className="signup-header">
          <div className="logo-section">
            <div className="logo-icon">
              <User size={32} />
            </div>
            <div className="logo-text">
              <h1>Join AwasWala</h1>
              <p>Create your account to get started</p>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`message-alert ${message.includes('✅') ? 'success' : 'error'}`}>
            <div className="alert-icon">
              {message.includes('✅') ? '✓' : '⚠'}
            </div>
            <span>{message}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignupSubmit} className="signup-form">
          {/* Profile Picture Upload */}
          <div className="profile-upload-section">
            <div className="profile-preview">
              {profilePicPreview ? (
                <div className="profile-with-remove">
                  <img src={profilePicPreview} alt="Profile preview" className="profile-image" />
                  <button 
                    type="button" 
                    onClick={removeProfilePic}
                    className="remove-profile-btn"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="upload-area">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="file-input"
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

          {/* Form Grid */}
          <div className="form-grid">
            {/* Name Field */}
            <div className="input-group">
              <div className="input-icon">
                <User size={20} />
              </div>
              <input
                type="text"
                placeholder="Full Name *"
                value={signupData.name}
                onChange={handleInputChange('name')}
                required
                disabled={loading}
                className="form-input"
              />
              <div className="input-border"></div>
            </div>

            {/* Mobile Field */}
            <div className="input-group">
              <div className="input-icon">
                <Phone size={20} />
              </div>
              <input
                type="tel"
                placeholder="Mobile Number *"
                value={signupData.mobile}
                onChange={handleInputChange('mobile')}
                maxLength="10"
                required
                disabled={loading}
                className="form-input"
              />
              <div className="input-border"></div>
            </div>

            {/* Email Field */}
            <div className="input-group">
              <div className="input-icon">
                <Mail size={20} />
              </div>
              <input
                type="email"
                placeholder="Email Address *"
                value={signupData.email}
                onChange={handleInputChange('email')}
                required
                disabled={loading}
                className="form-input"
              />
              <div className="input-border"></div>
            </div>

            {/* Address Field */}
            <div className="input-group full-width">
              <div className="input-icon">
                <MapPin size={20} />
              </div>
              <textarea
                placeholder="Full Address"
                value={signupData.address}
                onChange={handleInputChange('address')}
                rows={2}
                disabled={loading}
                className="form-input"
              />
              <div className="input-border"></div>
            </div>

            {/* City Field */}
            <div className="input-group">
              <input
                type="text"
                placeholder="City"
                value={signupData.city}
                onChange={handleInputChange('city')}
                disabled={loading}
                className="form-input"
              />
              <div className="input-border"></div>
            </div>

            {/* State Field */}
            <div className="input-group">
              <input
                type="text"
                placeholder="State"
                value={signupData.state}
                onChange={handleInputChange('state')}
                disabled={loading}
                className="form-input"
              />
              <div className="input-border"></div>
            </div>

            {/* Pincode Field */}
            <div className="input-group">
              <input
                type="text"
                placeholder="Pincode"
                value={signupData.pincode}
                onChange={handleInputChange('pincode')}
                disabled={loading}
                className="form-input"
              />
              <div className="input-border"></div>
            </div>

            {/* Password Field */}
            <div className="input-group">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password *"
                value={signupData.password}
                onChange={handleInputChange('password')}
                required
                disabled={loading}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <div className="input-border"></div>
            </div>

            {/* Confirm Password Field */}
            <div className="input-group">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password *"
                value={signupData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                required
                disabled={loading}
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <div className="input-border"></div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="signup-btn"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="btn-content">
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} className={isHovered ? 'btn-arrow-hover' : ''} />
                </>
              )}
            </span>
            <div className="btn-shine"></div>
          </button>
        </form>

        {/* Footer */}
        <div className="signup-footer">
          <p>Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="footer-link">
              Sign in here
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .signup-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 100px;
          height: 100px;
          top: 15%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 150px;
          height: 150px;
          top: 65%;
          right: 10%;
          animation-delay: 2s;
        }

        .shape-3 {
          width: 80px;
          height: 80px;
          bottom: 20%;
          left: 20%;
          animation-delay: 4s;
        }

        .signup-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          padding: 40px;
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.2);
          width: 100%;
          max-width: 500px;
          position: relative;
          z-index: 1;
          animation: slideUp 0.6s ease-out;
        }

        .signup-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .logo-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .logo-text h1 {
          margin: 0;
          color: #1f2937;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-text p {
          margin: 8px 0 0 0;
          color: #6b7280;
          font-size: 16px;
        }

        .message-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
          animation: slideDown 0.3s ease-out;
        }

        .message-alert.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .message-alert.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Profile Upload */
        .profile-upload-section {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 16px;
          border: 2px dashed #e2e8f0;
        }

        .profile-preview {
          flex-shrink: 0;
        }

        .profile-with-remove {
          position: relative;
          display: inline-block;
        }

        .profile-image {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          object-fit: cover;
          border: 3px solid #667eea;
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
          font-size: 14px;
          font-weight: bold;
        }

        .upload-area {
          cursor: pointer;
        }

        .file-input {
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
          border-color: #667eea;
          color: #667eea;
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
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-group {
          position: relative;
        }

        .input-group.full-width {
          grid-column: 1 / -1;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          z-index: 1;
          transition: color 0.2s;
        }

        .form-input {
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
          resize: vertical;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .input-border {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transform: scaleX(0);
          transition: transform 0.3s ease;
          border-radius: 0 0 12px 12px;
        }

        .form-input:focus + .input-border {
          transform: scaleX(1);
        }

        .password-toggle {
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

        .password-toggle:hover {
          color: #6b7280;
        }

        /* Signup Button */
        .signup-btn {
          position: relative;
          width: 100%;
          padding: 18px 24px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
          margin-top: 10px;
        }

        .signup-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
        }

        .signup-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .signup-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          z-index: 2;
          font-size: 15px;
        }

        .btn-arrow-hover {
          transform: translateX(4px);
          transition: transform 0.2s ease;
        }

        .btn-shine {
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

        .signup-btn:hover .btn-shine {
          left: 100%;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Footer */
        .signup-footer {
          margin-top: 24px;
          text-align: center;
        }

        .signup-footer p {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }

        .footer-link {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-weight: 600;
          text-decoration: underline;
        }

        .footer-link:hover {
          color: #764ba2;
        }

        /* Animations */
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .signup-card {
            padding: 24px;
            margin: 20px;
          }

          .logo-text h1 {
            font-size: 24px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .profile-upload-section {
            flex-direction: column;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .signup-container {
            padding: 10px;
          }
          
          .signup-card {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default SignupPage;