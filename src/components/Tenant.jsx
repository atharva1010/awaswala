import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Search,
  User,
  Bookmark,
  Bell,
  Settings,
  LogOut,
  Home,
  Heart,
  MapPin,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import "./Tenant.css";

const Tenant = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const sidebarRef = useRef(null);

  // ---------------- Click outside to close sidebar ----------------
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

  // ---------------- Fetch logged-in user ----------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        if (res.data.success) {
          setUser(res.data.user);
          fetchVerifiedRooms();
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ---------------- Fetch verified rooms ----------------
  const fetchVerifiedRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/rooms");
      if (res.data.success) {
        const verifiedRooms = res.data.rooms.filter(
          (room) => room.status === "Verified"
        );
        setRooms(verifiedRooms);
        setFilteredRooms(verifiedRooms);
      } else {
        setRooms([]);
        setFilteredRooms([]);
      }
    } catch (err) {
      console.error("Error fetching verified rooms:", err);
      setRooms([]);
      setFilteredRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Search functionality ----------------
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter(
        (room) =>
          room.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.pin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  }, [searchTerm, rooms]);

  // ---------------- Toggle Favorite ----------------
  const toggleFavorite = (roomId) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(roomId)) {
        newFavorites.delete(roomId);
      } else {
        newFavorites.add(roomId);
      }
      return newFavorites;
    });
  };

  // ---------------- Book Room ----------------
  const handleBookNow = async (room) => {
    try {
      alert(
        `Booking confirmed for ${room.title}!\nRent: ₹${room.rent}/month\nLocation: ${room.city}, ${room.state} - ${room.pin}`
      );
      console.log("Booking room:", {
        roomId: room._id,
        tenantId: user._id,
        rent: room.rent,
      });
    } catch (err) {
      console.error("Booking error:", err);
    }
  };

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

  // ---------------- Logout ----------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  if (!user) return <div className="loading">Loading...</div>;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading verified rooms...</p>
      </div>
    );
  }

  return (
    <div className="tenant-layout">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`tenant-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
      >
        <div className="sidebar-header">
          <div className="user-profile-section">
            <div className="profile-image-container">
              <img
                src={user.profilePic || "/default-avatar.png"}
                alt="Profile"
                className="profile-image"
              />
            </div>
            <div className="profile-info">
              <h3 className="user-name">{user.name}</h3>
              <p className="user-email">{user.email}</p>
              <p className="user-phone">{user.phone || "No phone number"}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h4 className="nav-section-title">MAIN</h4>
            <button className="nav-item active-nav-item">
              <Home size={18} />
              Browse Rooms
            </button>
          </div>

          <div className="nav-section">
            <h4 className="nav-section-title">ACCOUNT</h4>
            <button className="nav-item">
              <User size={18} />
              Profile
            </button>
            <button className="nav-item">
              <Bookmark size={18} />
              My Bookings
            </button>
            <button className="nav-item">
              <Heart size={18} />
              Favorites ({favorites.size})
            </button>
            <button className="nav-item">
              <Bell size={18} />
              Notifications
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
      <div className="tenant-main-content">
        {/* Header */}
        <header className="tenant-header">
          <div className="header-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="menu-button"
            >
              {sidebarOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
            <div className="logo-container">
              <span className="logo-icon">🏠</span>
              <span className="logo-text">AwasWala</span>
            </div>
          </div>

          <div className="header-right">
            <div className="notification-bell">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </div>
            <div className="user-avatar">
              <img src={user.profilePic || "/default-avatar.png"} alt="User" />
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by location, title, city, PIN code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All Rooms
            </button>
            <button
              className={`filter-tab ${
                activeFilter === "favorites" ? "active" : ""
              }`}
              onClick={() => setActiveFilter("favorites")}
            >
              Favorites
            </button>
            <button
              className={`filter-tab ${
                activeFilter === "budget" ? "active" : ""
              }`}
              onClick={() => setActiveFilter("budget")}
            >
              Budget Friendly
            </button>
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="rooms-section">
          <div className="section-header">
            <h2 className="section-title">
              Available Rooms ({filteredRooms.length})
            </h2>
            <div className="sort-options">
              <select className="sort-select">
                <option>Sort by: Recommended</option>
                <option>Sort by: Price Low to High</option>
                <option>Sort by: Price High to Low</option>
                <option>Sort by: Newest First</option>
              </select>
            </div>
          </div>

          {filteredRooms.length > 0 ? (
            <div className="rooms-grid">
              {filteredRooms.map((room) => (
                <div
                  key={room._id}
                  className="room-card"
                  onClick={() => {
                    setSelectedRoom(room);
                    setSelectedImageIndex(0);
                  }}
                >
                  <div className="room-image-container">
                    <img
                      src={room.images?.[0] || "/no-image.png"}
                      alt="thumbnail"
                      className="room-thumb"
                    />
                    <button
                      className={`favorite-btn ${
                        favorites.has(room._id) ? "favorited" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(room._id);
                      }}
                    >
                      <Heart
                        size={18}
                        fill={favorites.has(room._id) ? "currentColor" : "none"}
                      />
                    </button>
                    <div className="status-badge verified">
                      <Star size={12} fill="currentColor" />
                      {room.status}
                    </div>
                  </div>

                  {/* --- GRID CONTENT: Only Title, Rent, Address + PIN --- */}
                  <div className="room-content">
                    <h4 className="room-title">{room.title}</h4>
                    <p className="room-rent">₹{room.rent}/month</p>
                    <p className="room-address">
                      {room.address}, {room.city}, {room.state} - {room.pin}
                    </p>
                    <button
                      className="book-now-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookNow(room);
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <h3>No rooms found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Room Detail Modal */}
      {selectedRoom && (
        <div className="room-details-modal">
          <div className="modal-content">
            <button
              className="close-btn"
              onClick={() => setSelectedRoom(null)}
            >
              <X size={24} />
            </button>

            {/* Image Slider */}
            <div className="room-image-slider">
              <button className="nav-btn left" onClick={prevImage}>
                <ChevronLeft size={24} />
              </button>
              <img
                src={selectedRoom.images?.[selectedImageIndex] || "/no-image.png"}
                alt="room"
                className="room-detail-image"
              />
              <button className="nav-btn right" onClick={nextImage}>
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="image-counter">
              {selectedImageIndex + 1}/{selectedRoom.images?.length || 1}
            </div>

            {/* Room Info */}
            <div className="room-detail-info">
              <div className="room-header">
                <h2>{selectedRoom.title}</h2>
                <p className="rent">₹{selectedRoom.rent}/month</p>
              </div>

              <div className="location-info">
                <MapPin size={16} />
                <span>
                  {selectedRoom.city}, {selectedRoom.state} - {selectedRoom.pin}
                </span>
              </div>

              <p className="address">{selectedRoom.address}, {selectedRoom.pin}</p>

              <div className="description">
                <h3>Description</h3>
                <p>{selectedRoom.description}</p>
              </div>

              <div className="status">
                Status: <span className="verified-status">{selectedRoom.status}</span>
              </div>

              <div className="room-actions">
                <button
                  className={`favorite-btn large ${
                    favorites.has(selectedRoom._id) ? "favorited" : ""
                  }`}
                  onClick={() => toggleFavorite(selectedRoom._id)}
                >
                  <Heart
                    size={18}
                    fill={
                      favorites.has(selectedRoom._id) ? "currentColor" : "none"
                    }
                  />{" "}
                  {favorites.has(selectedRoom._id) ? "Unfavorite" : "Favorite"}
                </button>

                <button
                  className="book-now-btn large"
                  onClick={() => handleBookNow(selectedRoom)}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenant;
