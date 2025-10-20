import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Clock,
  CheckCircle,
  XCircle,
  ChartLine,
  DollarSign,
  MapPin,
  Settings,
  LogOut,
  Upload,
  Eye,
  Check,
  Map,
  User,
  Phone,
  Mail,
  Loader,
  AlertCircle,
  Calendar,
  Info
} from "lucide-react";
import axios from "axios";
import "./Agent.css";

const Agent = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRooms, setPendingRooms] = useState([]);
  const [verifiedRooms, setVerifiedRooms] = useState([]);
  const [cancelledRooms, setCancelledRooms] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    verified: 0,
    cancelled: 0
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // File upload states
  const [aadharFile, setAadharFile] = useState(null);
  const [electricityBillFile, setElectricityBillFile] = useState(null);
  const [ownerPhotoFile, setOwnerPhotoFile] = useState(null);
  const [roomPhotos, setRoomPhotos] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState({
    aadhar: false,
    electricity: false,
    owner: false,
    room: false
  });

  const sidebarRef = useRef(null);

  // ✅ Enhanced logout function with smart redirect
  const handleLogout = () => {
    console.log('🚪 Agent logging out...');
    
    // Clear all agent-specific data
    localStorage.removeItem('agentToken');
    localStorage.removeItem('agentUser');
    
    console.log('🔄 Redirecting to Agent Login...');
    
    // Use the provided onLogout callback or fallback to hash navigation
    if (onLogout) {
      onLogout();
    } else {
      // Fallback: Direct hash navigation to agent login
      window.location.hash = 'agent-login';
    }
  };

  // Auto-logout on 401 error - Response Interceptor
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('🔐 401 Unauthorized - Logging out agent');
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Check authentication and fetch data
  useEffect(() => {
    const initializeAgent = async () => {
      // Prevent multiple initializations
      if (initialized) return;

      const agentToken = localStorage.getItem('agentToken');
      console.log('🔑 Agent Token Check:', agentToken ? 'Present' : 'Missing');

      if (!agentToken) {
        console.log('❌ No agent token found, redirecting to login');
        handleLogout();
        return;
      }

      try {
        setLoading(true);
        await fetchAgentData();
        setInitialized(true);
        console.log('✅ Agent dashboard initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing agent dashboard:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initializeAgent();
  }, [initialized]);

  // Fetch agent data
  const fetchAgentData = async () => {
    try {
      const agentToken = localStorage.getItem('agentToken');
      
      if (!agentToken) {
        throw new Error('No agent token');
      }

      console.log('🔄 Fetching agent data...');
      const res = await axios.get("http://localhost:5000/api/agent/auth/me", {
        headers: { Authorization: `Bearer ${agentToken}` }
      });
      
      console.log('✅ Agent data response:', res.data);
      
      if (res.data.success) {
        setUser(res.data.agent);
        await fetchRoomsData();
      } else {
        throw new Error('Failed to fetch agent data');
      }
    } catch (err) {
      console.error("❌ Error fetching agent data:", err);
      if (err.response?.status === 401 || err.message === 'No agent token') {
        handleLogout();
      }
      throw err;
    }
  };

  // Enhanced Fetch all rooms data with better filtering
  const fetchRoomsData = async () => {
    try {
      const agentToken = localStorage.getItem('agentToken');
      
      if (!agentToken) {
        handleLogout();
        return;
      }

      console.log('🔄 Fetching rooms data...');
      const res = await axios.get("http://localhost:5000/api/agent/rooms", {
        headers: { Authorization: `Bearer ${agentToken}` }
      });
      
      console.log('✅ Rooms data response:', res.data);
      
      if (res.data.success) {
        const rooms = res.data.rooms;
        
        // Enhanced room filtering with multiple possible status values
        const pending = rooms.filter(room => 
          room.status === "Pending" || 
          room.status === "pending" ||
          room.status === "pending verification"
        );
        
        const verified = rooms.filter(room => 
          room.status === "Verified" || 
          room.status === "verified" || 
          room.status === "Processed" ||
          room.status === "processed" ||
          room.status === "Approved" ||
          room.status === "approved" ||
          room.status === "Completed" ||
          room.status === "completed"
        );
        
        const cancelled = rooms.filter(room => 
          room.status === "Cancelled" || 
          room.status === "cancelled" || 
          room.status === "Rejected" ||
          room.status === "rejected" ||
          room.status === "Declined" ||
          room.status === "declined"
        );
        
        console.log('📊 Room Statistics:', {
          pending: pending.length,
          verified: verified.length,
          cancelled: cancelled.length,
          allRooms: rooms.length
        });
        
        // Log room details for debugging
        rooms.forEach(room => {
          console.log(`Room ${room._id}:`, {
            title: room.title,
            status: room.status,
            roomId: room.roomId
          });
        });
        
        setPendingRooms(pending);
        setVerifiedRooms(verified);
        setCancelledRooms(cancelled);
        
        setStats({
          pending: pending.length,
          verified: verified.length,
          cancelled: cancelled.length
        });
      }
    } catch (err) {
      console.error("❌ Error fetching rooms:", err);
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        alert("Error loading rooms data");
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRoomsData();
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!aadharFile) {
      errors.aadhar = 'Aadhar Card is required';
    }
    
    if (!electricityBillFile) {
      errors.electricity = 'Electricity Bill is required';
    }
    
    if (!ownerPhotoFile) {
      errors.owner = 'Owner Photo is required';
    }
    
    if (roomPhotos.length < 4) {
      errors.roomPhotos = `Minimum 4 room photos required (${4 - roomPhotos.length} more needed)`;
    } else if (roomPhotos.length > 8) {
      errors.roomPhotos = 'Maximum 8 room photos allowed';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle file uploads with loading states
  const handleFileUpload = (fileType, files) => {
    const file = files[0];
    if (!file) return;

    // File size validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    // File type validation
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    // Set uploading state
    setUploadingFiles(prev => ({ ...prev, [fileType]: true }));

    const reader = new FileReader();
    reader.onload = (e) => {
      setTimeout(() => {
        switch (fileType) {
          case 'aadhar':
            setAadharFile({
              file,
              preview: e.target.result
            });
            break;
          case 'electricity':
            setElectricityBillFile({
              file,
              preview: e.target.result
            });
            break;
          case 'owner':
            setOwnerPhotoFile({
              file,
              preview: e.target.result
            });
            break;
          case 'room':
            if (roomPhotos.length >= 8) {
              alert('Maximum 8 room photos allowed');
              setUploadingFiles(prev => ({ ...prev, [fileType]: false }));
              return;
            }
            setRoomPhotos(prev => [...prev, {
              file,
              preview: e.target.result,
              id: Date.now() + Math.random()
            }]);
            break;
        }
        setUploadingFiles(prev => ({ ...prev, [fileType]: false }));
        // Clear validation errors when file is uploaded
        setValidationErrors(prev => ({ ...prev, [fileType]: undefined }));
      }, 500); // Simulate upload delay
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded file
  const removeFile = (fileType, id = null) => {
    switch (fileType) {
      case 'aadhar':
        setAadharFile(null);
        break;
      case 'electricity':
        setElectricityBillFile(null);
        break;
      case 'owner':
        setOwnerPhotoFile(null);
        break;
      case 'room':
        setRoomPhotos(prev => prev.filter(photo => photo.id !== id));
        break;
    }
  };

  // Handle verification submission - FIXED
  const handleVerificationSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    try {
      setSubmittingVerification(true);
      const agentToken = localStorage.getItem('agentToken');
      
      if (!agentToken) {
        handleLogout();
        return;
      }

      const formData = new FormData();
      
      // Add files to form data
      if (aadharFile) formData.append('aadhar', aadharFile.file);
      if (electricityBillFile) formData.append('electricityBill', electricityBillFile.file);
      if (ownerPhotoFile) formData.append('ownerPhoto', ownerPhotoFile.file);
      roomPhotos.forEach((photo, index) => {
        formData.append(`roomPhotos`, photo.file);
      });
      
      // Add room ID
      formData.append('roomId', selectedRoom._id);
      
      console.log('🔄 Submitting verification for room:', selectedRoom._id);
      
      // Step 1: Submit verification documents
      const verificationResponse = await axios.post("http://localhost:5000/api/agent/verify-room", formData, {
        headers: {
          Authorization: `Bearer ${agentToken}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Verification documents submitted:', verificationResponse.data);
      
      // Step 2: Update room status to "Processed"
      console.log('🔄 Updating room status to Processed...');
      const statusResponse = await axios.put(
        `http://localhost:5000/api/agent/rooms/${selectedRoom._id}/status`,
        { status: "Processed" },
        { 
          headers: { 
            Authorization: `Bearer ${agentToken}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('✅ Room status updated:', statusResponse.data);
      
      setVerificationModalOpen(false);
      setSuccessModalOpen(true);
      
      // Reset file states
      setAadharFile(null);
      setElectricityBillFile(null);
      setOwnerPhotoFile(null);
      setRoomPhotos([]);
      setValidationErrors({});
      
      // Refresh data
      await fetchRoomsData();
      
    } catch (err) {
      console.error("❌ Error submitting verification:", err);
      
      if (err.response?.status === 401) {
        handleLogout();
      } else if (err.response?.status === 400) {
        // Handle validation errors
        const errorMessage = err.response.data?.message || 'Invalid request';
        alert(`Validation Error: ${errorMessage}`);
      } else if (err.response?.status === 404) {
        alert('Room not found. Please refresh and try again.');
      } else {
        alert("Error submitting verification. Please try again.");
      }
    } finally {
      setSubmittingVerification(false);
    }
  };

  // Handle room status update with better error handling
  const updateRoomStatus = async (roomId, status) => {
    try {
      setUpdatingStatus(roomId);
      const agentToken = localStorage.getItem('agentToken');
      
      if (!agentToken) {
        handleLogout();
        return;
      }

      console.log(`🔄 Updating room ${roomId} status to: ${status}`);
      
      const response = await axios.put(
        `http://localhost:5000/api/agent/rooms/${roomId}/status`,
        { status },
        { 
          headers: { 
            Authorization: `Bearer ${agentToken}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      console.log('✅ Room status updated successfully:', response.data);
      
      // Refresh data after successful update
      await fetchRoomsData();
      
      // Show success message
      if (status === "Cancelled") {
        alert('Room successfully cancelled!');
      } else if (status === "Pending") {
        alert('Room successfully restored to pending!');
      }
      
    } catch (err) {
      console.error("❌ Error updating room status:", err);
      
      if (err.response?.status === 401) {
        handleLogout();
      } else if (err.response?.status === 404) {
        alert("Room not found. Please refresh the page and try again.");
      } else if (err.response?.status === 500) {
        alert("Server error. Please try again later or contact support.");
      } else if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert("Error updating room status. Please try again.");
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status display text
  const getStatusDisplayText = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'verified': 'Verified',
      'cancelled': 'Cancelled',
      'processed': 'Processed',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'completed': 'Completed'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset validation errors when modal opens
  useEffect(() => {
    if (verificationModalOpen) {
      setValidationErrors({});
    }
  }, [verificationModalOpen]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading agent dashboard...</p>
        <p style={{ fontSize: '14px', color: '#666' }}>Please wait while we set up your dashboard</p>
      </div>
    );
  }

  const currentRooms = 
    activeTab === "pending" ? pendingRooms :
    activeTab === "verified" ? verifiedRooms :
    cancelledRooms;

  return (
    <div className="agent-layout">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`agent-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
      >
        <div className="sidebar-header">
          <div className="agent-profile-section">
            <div className="profile-image-container">
              <img
                src={user?.profilePic || "/default-avatar.png"}
                alt="Agent Profile"
                className="profile-image"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
            </div>
            <div className="profile-info">
              <h3 className="agent-name">{user?.name || "Agent"}</h3>
              <p className="agent-email">{user?.email}</p>
              <p className="agent-role">Verified Agent</p>
              <p className="agent-zone">{user?.zone || "Zone not set"}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h4 className="nav-section-title">MAIN</h4>
            <button 
              className={`nav-item ${activeTab === "pending" ? "active-nav-item" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={18} />
              Pending for Verification
              {stats.pending > 0 && <span className="badge">{stats.pending}</span>}
            </button>
            <button 
              className={`nav-item ${activeTab === "verified" ? "active-nav-item" : ""}`}
              onClick={() => setActiveTab("verified")}
            >
              <CheckCircle size={18} />
              Verified Rooms
              {stats.verified > 0 && <span className="badge verified-badge">{stats.verified}</span>}
            </button>
            <button 
              className={`nav-item ${activeTab === "cancelled" ? "active-nav-item" : ""}`}
              onClick={() => setActiveTab("cancelled")}
            >
              <XCircle size={18} />
              Cancelled Rooms
              {stats.cancelled > 0 && <span className="badge cancelled-badge">{stats.cancelled}</span>}
            </button>
          </div>

          <div className="nav-section">
            <h4 className="nav-section-title">ACCOUNT</h4>
            <button className="nav-item">
              <ChartLine size={18} />
              Earning Estimate
            </button>
            <button className="nav-item">
              <DollarSign size={18} />
              Weekly Payout
            </button>
            <button className="nav-item">
              <MapPin size={18} />
              Your Zone
            </button>
            <button className="nav-item">
              <Settings size={18} />
              Settings
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          {/* ✅ Updated Logout Button */}
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="agent-main-content">
        {/* Header */}
        <header className="agent-header">
          <div className="header-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="menu-button"
            >
              {sidebarOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
            <div className="logo-container">
              <img 
                alt="AwasWala" 
                className="logo" 
                src="/src/assets/logo.png"
                onError={(e) => {
                  console.error('Logo failed to load, using fallback');
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="logo-fallback" style={{display: 'none'}}>
                <span className="logo-icon">🏠</span>
                <span className="logo-text">AwasWala Agent</span>
              </div>
            </div>
          </div>
          
          <div className="header-right">
            <button 
              onClick={handleRefresh}
              className="refresh-btn"
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader size={20} className="spinner" />
              ) : (
                "🔄 Refresh"
              )}
            </button>
            <div className="user-avatar">
              <img 
                src={user?.profilePic || "/default-avatar.png"} 
                alt="Agent" 
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
            </div>
          </div>
        </header>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon pending">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <h3>{stats.pending}</h3>
                <p>Pending Verifications</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon verified">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{stats.verified}</h3>
                <p>Verified Rooms</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon cancelled">
                <XCircle size={24} />
              </div>
              <div className="stat-info">
                <h3>{stats.cancelled}</h3>
                <p>Cancelled Rooms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="rooms-section">
          <div className="section-header">
            <h2 className="section-title">
              {activeTab === "pending" && "Pending for Verification"}
              {activeTab === "verified" && "Verified Rooms"}
              {activeTab === "cancelled" && "Cancelled Rooms"}
              <span className="room-count">({currentRooms.length})</span>
            </h2>
            
            <div className="filter-options">
              <select className="sort-select">
                <option>Sort by: Newest First</option>
                <option>Sort by: Oldest First</option>
                <option>Sort by: Rent Price</option>
              </select>
            </div>
          </div>

          {refreshing ? (
            <div className="loading-state">
              <Loader size={32} className="spinner" />
              <p>Refreshing data...</p>
            </div>
          ) : currentRooms.length > 0 ? (
            <div className="rooms-grid">
              {currentRooms.map((room) => (
                <div key={room._id} className="room-card">
                  <div className="room-image-container">
                    <img
                      src={room.images?.[0] || "/no-image.png"}
                      alt={room.title}
                      className="room-thumb"
                    />
                    <div className={`status-badge ${room.status.toLowerCase()}`}>
                      {getStatusDisplayText(room.status)}
                    </div>
                  </div>
                  
                  <div className="room-content">
                    <div className="room-id">ID: {room.roomId || room._id.slice(-8).toUpperCase()}</div>
                    <h3 className="room-title">{room.title}</h3>
                    
                    <div className="room-details">
                      <div className="room-detail">
                        <label>Owner</label>
                        <span>{room.owner?.name || "N/A"}</span>
                      </div>
                      <div className="room-detail">
                        <label>Rent</label>
                        <span>₹{room.rent}/month</span>
                      </div>
                      {(activeTab === "verified" || activeTab === "cancelled") && (
                        <div className="room-detail">
                          <label>Status</label>
                          <span className={`status-text ${room.status.toLowerCase()}`}>
                            {getStatusDisplayText(room.status)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="room-location">
                      <MapPin size={14} />
                      <span>{room.city}, {room.state}</span>
                    </div>
                    
                    {/* Additional information for verified rooms */}
                    {activeTab === "verified" && (
                      <div className="room-additional-info">
                        <div className="info-item">
                          <CheckCircle size={14} />
                          <span>Verified</span>
                          {room.verifiedAt && (
                            <span className="info-date">
                              on {formatDate(room.verifiedAt)}
                            </span>
                          )}
                        </div>
                        {room.processedAt && (
                          <div className="info-item">
                            <Calendar size={14} />
                            <span>Processed on {formatDate(room.processedAt)}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Additional information for cancelled rooms */}
                    {activeTab === "cancelled" && (
                      <div className="room-additional-info">
                        <div className="info-item">
                          <XCircle size={14} />
                          <span>Cancelled</span>
                          {room.cancelledAt && (
                            <span className="info-date">
                              on {formatDate(room.cancelledAt)}
                            </span>
                          )}
                        </div>
                        {room.cancellationReason && (
                          <div className="info-item">
                            <Info size={14} />
                            <span>Reason: {room.cancellationReason}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="room-actions">
                      <button 
                        className="btn btn-outline"
                        onClick={() => setSelectedRoom(room)}
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                      
                      {activeTab === "pending" && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedRoom(room);
                            setVerificationModalOpen(true);
                          }}
                        >
                          <Check size={16} />
                          Proceed for Verification
                        </button>
                      )}
                      
                      {activeTab === "verified" && (
                        <button 
                          className="btn btn-outline btn-danger"
                          onClick={() => updateRoomStatus(room._id, "Cancelled")}
                          disabled={updatingStatus === room._id}
                        >
                          {updatingStatus === room._id ? (
                            <Loader size={16} className="spinner" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          {updatingStatus === room._id ? "Cancelling..." : "Cancel Room"}
                        </button>
                      )}
                      
                      {activeTab === "cancelled" && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => updateRoomStatus(room._id, "Pending")}
                          disabled={updatingStatus === room._id}
                        >
                          {updatingStatus === room._id ? (
                            <Loader size={16} className="spinner" />
                          ) : (
                            <Clock size={16} />
                          )}
                          {updatingStatus === room._id ? "Restoring..." : "Restore to Pending"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                {activeTab === "pending" && <Clock size={48} />}
                {activeTab === "verified" && <CheckCircle size={48} />}
                {activeTab === "cancelled" && <XCircle size={48} />}
              </div>
              <h3>No rooms found</h3>
              <p>
                {activeTab === "pending" && "No pending verifications at the moment"}
                {activeTab === "verified" && "No verified rooms found"}
                {activeTab === "cancelled" && "No cancelled rooms found"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {verificationModalOpen && selectedRoom && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Room Verification - {selectedRoom.roomId || selectedRoom._id.slice(-8).toUpperCase()}</h2>
              <button 
                className="close-btn"
                onClick={() => setVerificationModalOpen(false)}
                disabled={submittingVerification}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Room ID</label>
                  <input 
                    type="text" 
                    value={selectedRoom.roomId || selectedRoom._id.slice(-8).toUpperCase()} 
                    readOnly 
                  />
                </div>
                
                <div className="form-group">
                  <label>Title</label>
                  <input 
                    type="text" 
                    value={selectedRoom.title} 
                    readOnly 
                  />
                </div>
                
                <div className="form-group">
                  <label>Owner Name</label>
                  <input 
                    type="text" 
                    value={selectedRoom.owner?.name || "N/A"} 
                    readOnly 
                  />
                </div>
                
                <div className="form-group">
                  <label>Rent Price</label>
                  <input 
                    type="text" 
                    value={`₹${selectedRoom.rent}/month`} 
                    readOnly 
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Full Address</label>
                  <textarea 
                    value={selectedRoom.address} 
                    readOnly 
                    rows="3"
                  />
                </div>
                
                <div className="form-group">
                  <label>Contact No.</label>
                  <input 
                    type="text" 
                    value={selectedRoom.owner?.phone || "N/A"} 
                    readOnly 
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={selectedRoom.owner?.email || "N/A"} 
                    readOnly 
                  />
                </div>
              </div>

              <div className="documents-section">
                <h3>KYC Documents <span className="required-star">*</span></h3>
                <p className="documents-note">All documents are mandatory for verification</p>
                
                {/* Aadhar Card */}
                <div className="file-upload-group">
                  <label>Aadhar Card <span className="required">*</span></label>
                  <div className="file-upload">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileUpload('aadhar', e.target.files)}
                      disabled={submittingVerification}
                    />
                    <div className={`file-upload-label ${validationErrors.aadhar ? 'error' : ''}`}>
                      {uploadingFiles.aadhar ? (
                        <Loader size={18} className="spinner" />
                      ) : (
                        <Upload size={18} />
                      )}
                      <span>
                        {uploadingFiles.aadhar ? "Uploading..." : "Click to upload Aadhar Card"}
                      </span>
                    </div>
                  </div>
                  {aadharFile && (
                    <div className="file-preview">
                      <img src={aadharFile.preview} alt="Aadhar preview" />
                      <button 
                        onClick={() => removeFile('aadhar')}
                        disabled={submittingVerification}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {validationErrors.aadhar && (
                    <div className="validation-error">
                      <AlertCircle size={14} />
                      {validationErrors.aadhar}
                    </div>
                  )}
                </div>

                {/* Electricity Bill */}
                <div className="file-upload-group">
                  <label>Electricity Bill <span className="required">*</span></label>
                  <div className="file-upload">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => handleFileUpload('electricity', e.target.files)}
                      disabled={submittingVerification}
                    />
                    <div className={`file-upload-label ${validationErrors.electricity ? 'error' : ''}`}>
                      {uploadingFiles.electricity ? (
                        <Loader size={18} className="spinner" />
                      ) : (
                        <Upload size={18} />
                      )}
                      <span>
                        {uploadingFiles.electricity ? "Uploading..." : "Click to upload Electricity Bill"}
                      </span>
                    </div>
                  </div>
                  {electricityBillFile && (
                    <div className="file-preview">
                      <img src={electricityBillFile.preview} alt="Electricity bill preview" />
                      <button 
                        onClick={() => removeFile('electricity')}
                        disabled={submittingVerification}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {validationErrors.electricity && (
                    <div className="validation-error">
                      <AlertCircle size={14} />
                      {validationErrors.electricity}
                    </div>
                  )}
                </div>

                {/* Owner Photo */}
                <div className="file-upload-group">
                  <label>Owner Photo <span className="required">*</span></label>
                  <div className="file-upload">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => handleFileUpload('owner', e.target.files)}
                      disabled={submittingVerification}
                    />
                    <div className={`file-upload-label ${validationErrors.owner ? 'error' : ''}`}>
                      {uploadingFiles.owner ? (
                        <Loader size={18} className="spinner" />
                      ) : (
                        <Upload size={18} />
                      )}
                      <span>
                        {uploadingFiles.owner ? "Uploading..." : "Click to upload Owner Photo"}
                      </span>
                    </div>
                  </div>
                  {ownerPhotoFile && (
                    <div className="file-preview">
                      <img src={ownerPhotoFile.preview} alt="Owner photo preview" />
                      <button 
                        onClick={() => removeFile('owner')}
                        disabled={submittingVerification}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {validationErrors.owner && (
                    <div className="validation-error">
                      <AlertCircle size={14} />
                      {validationErrors.owner}
                    </div>
                  )}
                </div>

                {/* Room Photos */}
                <div className="file-upload-group">
                  <label>Room Photos <span className="required">*</span></label>
                  <div className="photos-info">
                    <span className="photos-count">
                      {roomPhotos.length}/8 photos uploaded
                      {roomPhotos.length < 4 && (
                        <span className="photos-warning">
                          ({4 - roomPhotos.length} more required)
                        </span>
                      )}
                    </span>
                    <span className="photos-requirement">Minimum 4, Maximum 8 photos</span>
                  </div>
                  <div className="file-upload">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png"
                      multiple
                      onChange={(e) => handleFileUpload('room', e.target.files)}
                      disabled={submittingVerification || roomPhotos.length >= 8}
                    />
                    <div className={`file-upload-label ${validationErrors.roomPhotos ? 'error' : ''}`}>
                      {uploadingFiles.room ? (
                        <Loader size={18} className="spinner" />
                      ) : (
                        <Upload size={18} />
                      )}
                      <span>
                        {uploadingFiles.room ? "Uploading..." : 
                         roomPhotos.length >= 8 ? "Maximum 8 photos reached" : 
                         "Click to upload Room Photos"}
                      </span>
                    </div>
                  </div>
                  <div className="photos-preview">
                    {roomPhotos.map(photo => (
                      <div key={photo.id} className="file-preview">
                        <img src={photo.preview} alt="Room photo preview" />
                        <button 
                          onClick={() => removeFile('room', photo.id)}
                          disabled={submittingVerification}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  {validationErrors.roomPhotos && (
                    <div className="validation-error">
                      <AlertCircle size={14} />
                      {validationErrors.roomPhotos}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setVerificationModalOpen(false)}
                disabled={submittingVerification}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleVerificationSubmit}
                disabled={submittingVerification}
              >
                {submittingVerification ? (
                  <>
                    <Loader size={16} className="spinner" />
                    Submitting Verification...
                  </>
                ) : (
                  "Submit Verification"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <div className="success-content">
              <div className="success-icon">
                <Check size={32} />
              </div>
              <h3>Verification Submitted Successfully!</h3>
              <p>Room status has been updated to <strong>Processed</strong></p>
              <p>Your verification request is now under admin review.</p>
              <p>Please contact admin at <strong>+91 9999999999</strong> for any queries.</p>
              <button 
                className="btn btn-primary"
                onClick={() => setSuccessModalOpen(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agent;