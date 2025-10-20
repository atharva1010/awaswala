import React, { useState, useEffect, useRef } from "react";
import { Menu, X, Upload, User, Settings, LogOut, Edit, Home, DollarSign, ChevronDown, ChevronUp, ZoomIn, X as CloseIcon, Calendar, TrendingUp } from "lucide-react";
import logo from "../assets/logo.png";
import axios from "axios";
import "./Landlord.css";

const Landlord = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState({
    Pending: [],
    Verified: [],
    Booked: [],
    Available: [],
    Rejected: [],
    Cancelled: [],
    Suspended: []
  });
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [user, setUser] = useState(null);
  const [editProfile, setEditProfile] = useState(false);
  const [roomsSubmenuOpen, setRoomsSubmenuOpen] = useState(false);
  const [earningModalOpen, setEarningModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageZoomOpen, setImageZoomOpen] = useState(false);
  
  const sidebarRef = useRef(null);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePic: ""
  });

  const [roomData, setRoomData] = useState({
    title: "",
    rent: "",
    address: "",
    city: "",
    state: "",
    pin: "",
    images: [],
    description: "",
  });

  // ---------------- Click outside to close sidebar ----------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ---------------- Fetch logged-in user ----------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        if (res.data.success) {
          setUser(res.data.user);
          setProfileData({
            name: res.data.user.name,
            email: res.data.user.email,
            phone: res.data.user.phone || "",
            profilePic: res.data.user.profilePic || ""
          });
          fetchRooms(res.data.user._id);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, []);

  // ---------------- Fetch rooms and categorize ----------------
  const fetchRooms = async (userKey) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/my-rooms/${userKey}`);
      if (res.data.success) {
        setRooms(res.data.rooms);

        const categorized = {
          Pending: [],
          Verified: [],
          Booked: [],
          Available: [],
          Rejected: [],
          Cancelled: [],
          Suspended: []
        };

        res.data.rooms.forEach(room => {
          if (categorized[room.status]) {
            categorized[room.status].push(room);
          }
        });

        setFilteredRooms(categorized);
      } else {
        setRooms([]);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err.response ? err.response.data : err);
      setRooms([]);
    }
  };

  // ---------------- Input change ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRoomData({ ...roomData, [name]: value });
  };

  // ---------------- Profile input change ----------------
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  // ---------------- Images select ----------------
  const handleImages = (e) => {
    setRoomData({ ...roomData, images: Array.from(e.target.files) });
  };

  // ---------------- Upload Room ----------------
  const handleUpload = async () => {
    if (!user) return alert("User not loaded yet");

    try {
      const { title, rent, address, city, state, pin, images, description } = roomData;

      if (!title || !rent || !address || !city || !state || !pin) {
        alert("Please fill all required fields");
        return;
      }

      if (!images || images.length < 2 || images.length > 10) {
        alert("Please upload min 2 and max 10 images");
        return;
      }

      const formDataBackend = new FormData();
      formDataBackend.append("title", title);
      formDataBackend.append("rent", rent);
      formDataBackend.append("address", address);
      formDataBackend.append("city", city);
      formDataBackend.append("state", state);
      formDataBackend.append("pin", pin);
      formDataBackend.append("description", description);
      formDataBackend.append("ownerEmail", user.email);

      images.forEach((img) => formDataBackend.append("images", img));

      const res = await axios.post("http://localhost:5000/api/rooms", formDataBackend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert("Room uploaded successfully!");
        setRoomData({
          title: "",
          rent: "",
          address: "",
          city: "",
          state: "",
          pin: "",
          images: [],
          description: "",
        });
        setUploadModalOpen(false);
        fetchRooms(user._id);
      }
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    }
  };

  // ---------------- Update Profile ----------------
  const handleUpdateProfile = async () => {
    try {
      const res = await axios.put(
        "http://localhost:5000/api/users/profile",
        profileData,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );
      if (res.data.success) {
        setUser(res.data.user);
        setEditProfile(false);
        alert("Profile updated successfully!");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    }
  };

  // ---------------- Logout ----------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // ---------------- Calculate Earnings ----------------
  const calculateEarnings = () => {
    const bookedRooms = filteredRooms.Booked;
    const totalEarnings = bookedRooms.reduce((sum, room) => sum + (parseInt(room.rent) || 0), 0);
    
    // Generate monthly data for chart
    const monthlyData = [
      { month: 'Jan', earnings: totalEarnings * 0.8 },
      { month: 'Feb', earnings: totalEarnings * 0.9 },
      { month: 'Mar', earnings: totalEarnings * 1.1 },
      { month: 'Apr', earnings: totalEarnings * 0.95 },
      { month: 'May', earnings: totalEarnings * 1.2 },
      { month: 'Jun', earnings: totalEarnings }
    ];

    return {
      totalEarnings,
      bookedCount: bookedRooms.length,
      monthlyData
    };
  };

  const earningsData = calculateEarnings();

  // ---------------- Image Navigation ----------------
  const nextImage = () => {
    if (selectedRoom) {
      setSelectedImageIndex((prev) => 
        prev === selectedRoom.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (selectedRoom) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? selectedRoom.images.length - 1 : prev - 1
      );
    }
  };

  if (!user) return <div className="loading">Loading...</div>;

  // ---------------- Filtered rooms to display ----------------
  const displayedRooms = selectedStatus ? filteredRooms[selectedStatus] : rooms;

  return (
    <div className="layout">
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
      >
        <div className="sidebar-header">
          <div className="user-profile-section">
            <div className="profile-image-container">
              <img 
                src={user.profilePic || "/default-avatar.png"} 
                alt="Profile" 
                className="profile-image" 
              />
              {editProfile && (
                <div className="edit-overlay">
                  <Edit size={20} color="white" />
                </div>
              )}
            </div>
            
            {editProfile ? (
              <div className="profile-form">
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="profile-input"
                  placeholder="Full Name"
                />
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="profile-input"
                  placeholder="Email"
                />
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="profile-input"
                  placeholder="Phone Number"
                />
                <div className="profile-actions">
                  <button onClick={handleUpdateProfile} className="save-btn">
                    Save
                  </button>
                  <button onClick={() => setEditProfile(false)} className="cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-info">
                <h3 className="user-name">{user.name}</h3>
                <p className="user-email">{user.email}</p>
                <p className="user-phone">{user.phone || "No phone number"}</p>
                <button 
                  onClick={() => setEditProfile(true)} 
                  className="edit-profile-btn"
                >
                  <Edit size={14} />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h4 className="nav-section-title">MAIN</h4>
            <button className="nav-item">
              <Home size={18} />
              Dashboard
            </button>
          </div>

          <div className="nav-section">
            <div 
              className="nav-section-header"
              onClick={() => setRoomsSubmenuOpen(!roomsSubmenuOpen)}
            >
              <h4 className="nav-section-title">YOUR ROOMS</h4>
              {roomsSubmenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            
            {roomsSubmenuOpen && (
              <div className="submenu-container">
                {Object.entries(filteredRooms).map(([status, roomsArr]) => (
                  <button 
                    key={status} 
                    className={`nav-item submenu-item ${selectedStatus === status ? 'active-nav-item' : ''}`}
                    onClick={() => {
                      setSelectedStatus(status);
                      setSidebarOpen(false);
                    }}
                  >
                    <div 
                      className="status-indicator"
                      style={{ backgroundColor: statusColors[status]?.backgroundColor || '#cbd5e0' }}
                    ></div>
                    {status} ({roomsArr.length})
                  </button>
                ))}
                <button 
                  className={`nav-item submenu-item ${!selectedStatus ? 'active-nav-item' : ''}`}
                  onClick={() => {
                    setSelectedStatus(null);
                    setSidebarOpen(false);
                  }}
                >
                  <div className="status-indicator"></div>
                  All Rooms ({rooms.length})
                </button>
              </div>
            )}
          </div>

          <div className="nav-section">
            <h4 className="nav-section-title">ACCOUNT</h4>
            <button 
              className="nav-item"
              onClick={() => {
                setEarningModalOpen(true);
                setSidebarOpen(false);
              }}
            >
              <DollarSign size={18} />
              Earning Estimate
            </button>
            <button className="nav-item">
              <Settings size={18} />
              Settings
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="menu-button"
            >
              {sidebarOpen ? <X size={26} color="white" /> : <Menu size={26} color="white" />}
            </button>
            <div className="logo-container">
              <img src={logo} alt="AwasWala" className="logo" />
            </div>
          </div>
          
          <div className="header-right">
            <button 
              onClick={() => setUploadModalOpen(true)} 
              className="upload-button"
            >
              <Upload size={20} />
              Upload Room
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          <div className="welcome-section">
            <h1 className="welcome-title">Welcome back, {user.name}!</h1>
            <p className="welcome-subtitle">Manage your properties and track your earnings</p>
          </div>

          {/* Stats Cards - 2 per row */}
          <div className="stats-grid">
            <div className="stat-card stat-card-total">
              <h3 className="stat-number">{rooms.length}</h3>
              <p className="stat-label">Total Rooms</p>
            </div>
            <div className="stat-card stat-card-booked">
              <h3 className="stat-number">{filteredRooms.Booked.length}</h3>
              <p className="stat-label">Booked</p>
            </div>
            <div className="stat-card stat-card-verified">
              <h3 className="stat-number">{filteredRooms.Verified.length}</h3>
              <p className="stat-label">Verified</p>
            </div>
            <div className="stat-card stat-card-pending">
              <h3 className="stat-number">{filteredRooms.Pending.length}</h3>
              <p className="stat-label">Pending</p>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="rooms-section">
            <div className="section-header">
              <h2 className="section-title">
                {selectedStatus ? `${selectedStatus} Rooms` : 'All Rooms'}
              </h2>
              <p className="section-subtitle">
                {displayedRooms.length} room{displayedRooms.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="rooms-grid">
              {displayedRooms.map((room) => (
                <div 
                  key={room.roomId} 
                  className="room-card"
                  onClick={() => {
                    setSelectedRoom(room);
                    setSelectedImageIndex(0);
                  }}
                >
                  <div className="room-image-container">
                    <img src={room.images[0]} alt="thumbnail" className="room-thumb" />
                    <div 
                      className="status-badge"
                      style={{ ...statusColors[room.status] }}
                    >
                      {room.status}
                    </div>
                  </div>
                  <div className="room-content">
                    <h4 className="room-title">{room.title}</h4>
                    <p className="room-rent">₹{room.rent}/month</p>
                    <p className="room-address">{room.city}, {room.state}</p>
                    <p className="room-id">ID: {room.roomId}</p>
                  </div>
                </div>
              ))}
            </div>

            {displayedRooms.length === 0 && (
              <div className="empty-state">
                <p className="empty-text">No rooms found</p>
                <button 
                  onClick={() => setUploadModalOpen(true)} 
                  className="upload-button"
                >
                  <Upload size={18} />
                  Upload Your First Room
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay" onClick={() => setUploadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Upload New Room</h2>
            <input type="text" placeholder="Room Title" name="title" value={roomData.title} onChange={handleChange} className="input-field" />
            <input type="number" placeholder="Rent" name="rent" value={roomData.rent} onChange={handleChange} className="input-field" />
            <input type="text" placeholder="Full Address" name="address" value={roomData.address} onChange={handleChange} className="input-field" />
            <input type="text" placeholder="City" name="city" value={roomData.city} onChange={handleChange} className="input-field" />
            <input type="text" placeholder="State" name="state" value={roomData.state} onChange={handleChange} className="input-field" />
            <input type="text" placeholder="Pin Code" name="pin" value={roomData.pin} onChange={handleChange} className="input-field" />
            <input type="file" multiple accept="image/*" onChange={handleImages} className="file-input" />
            <textarea placeholder="Description (optional)" name="description" value={roomData.description} onChange={handleChange} className="input-field textarea" />
            <div className="modal-actions">
              <button onClick={handleUpload} className="upload-btn">Upload Room</button>
              <button onClick={() => setUploadModalOpen(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Room Details Modal with Image Slider */}
      {selectedRoom && !imageZoomOpen && (
        <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
          <div className="modal-content room-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedRoom.title}</h2>
              <button onClick={() => setSelectedRoom(null)} className="close-button">
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="image-slider-container">
              <div className="main-image-container">
                <img 
                  src={selectedRoom.images[selectedImageIndex]} 
                  alt="room" 
                  className="main-image"
                  onClick={() => setImageZoomOpen(true)}
                />
                <button className="zoom-button" onClick={() => setImageZoomOpen(true)}>
                  <ZoomIn size={20} />
                </button>
                
                {selectedRoom.images.length > 1 && (
                  <>
                    <button className="nav-button nav-button-prev" onClick={prevImage}>
                      ‹
                    </button>
                    <button className="nav-button nav-button-next" onClick={nextImage}>
                      ›
                    </button>
                  </>
                )}
              </div>
              
              {selectedRoom.images.length > 1 && (
                <div className="thumbnail-container">
                  {selectedRoom.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`thumbnail-${index}`}
                      className={`thumbnail ${index === selectedImageIndex ? 'active-thumbnail' : ''}`}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="room-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <strong>Rent:</strong> ₹{selectedRoom.rent}/month
                </div>
                <div className="detail-item">
                  <strong>Status:</strong> 
                  <span 
                    className="status-text"
                    style={{ ...statusColors[selectedRoom.status] }}
                  >
                    {selectedRoom.status}
                  </span>
                </div>
                <div className="detail-item">
                  <strong>Room ID:</strong> {selectedRoom.roomId}
                </div>
                <div className="detail-item">
                  <strong>Address:</strong> {selectedRoom.address}, {selectedRoom.city}, {selectedRoom.state} - {selectedRoom.pin}
                </div>
              </div>
              <div className="description-box">
                <strong>Description:</strong> 
                <p>{selectedRoom.description || "No description provided"}</p>
              </div>
            </div>
            
            <button onClick={() => setSelectedRoom(null)} className="cancel-btn close-details-btn">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {imageZoomOpen && selectedRoom && (
        <div className="zoom-overlay" onClick={() => setImageZoomOpen(false)}>
          <div className="zoom-container" onClick={(e) => e.stopPropagation()}>
            <button className="close-zoom-button" onClick={() => setImageZoomOpen(false)}>
              <CloseIcon size={24} />
            </button>
            <img 
              src={selectedRoom.images[selectedImageIndex]} 
              alt="zoom" 
              className="zoomed-image"
            />
            {selectedRoom.images.length > 1 && (
              <>
                <button className="zoom-nav-button zoom-nav-button-prev" onClick={prevImage}>
                  ‹
                </button>
                <button className="zoom-nav-button zoom-nav-button-next" onClick={nextImage}>
                  ›
                </button>
              </>
            )}
            <div className="image-counter">
              {selectedImageIndex + 1} / {selectedRoom.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Earning Estimate Modal */}
      {earningModalOpen && (
        <div className="modal-overlay" onClick={() => setEarningModalOpen(false)}>
          <div className="modal-content earnings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <TrendingUp size={24} className="modal-title-icon" />
                Earnings Overview
              </h2>
              <button onClick={() => setEarningModalOpen(false)} className="close-button">
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="earnings-summary">
              <div className="earning-card">
                <div className="earning-icon">
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className="earning-amount">₹{earningsData.totalEarnings}</div>
                  <div className="earning-label">Total Earnings</div>
                </div>
              </div>
              <div className="earning-card">
                <div className="earning-icon">
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="earning-amount">{earningsData.bookedCount}</div>
                  <div className="earning-label">Booked Rooms</div>
                </div>
              </div>
            </div>

            <div className="chart-section">
              <h3 className="chart-title">Monthly Earnings Trend</h3>
              <div className="chart-container">
                {earningsData.monthlyData.map((month, index) => (
                  <div key={month.month} className="chart-bar-container">
                    <div className="chart-bar-wrapper">
                      <div 
                        className="chart-bar"
                        style={{
                          height: `${(month.earnings / earningsData.totalEarnings) * 100}%`,
                          backgroundColor: index === earningsData.monthlyData.length - 1 ? '#2563eb' : '#3b82f6'
                        }}
                      ></div>
                    </div>
                    <div className="chart-label">{month.month}</div>
                    <div className="chart-value">₹{Math.round(month.earnings)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="earning-details">
              <h3 className="detail-title">Booked Rooms Details</h3>
              {filteredRooms.Booked.map(room => (
                <div key={room.roomId} className="room-earning-item">
                  <div className="room-earning-info">
                    <strong>{room.title}</strong>
                    <span>₹{room.rent}/month</span>
                  </div>
                  <div className="room-earning-address">
                    {room.city}, {room.state}
                  </div>
                </div>
              ))}
              {filteredRooms.Booked.length === 0 && (
                <div className="no-earnings">No booked rooms yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Status colors configuration
const statusColors = {
  Pending: { backgroundColor: '#f59e0b', color: 'white' },
  Verified: { backgroundColor: '#10b981', color: 'white' },
  Booked: { backgroundColor: '#3b82f6', color: 'white' },
  Available: { backgroundColor: '#6b7280', color: 'white' },
  Rejected: { backgroundColor: '#ef8344ff', color: 'white' },
  Cancelled: { backgroudColor: '#e20707ff', color: 'white' },
  Suspended: { backgroundColor: '#6b7280', color: 'white' }
};

export default Landlord;