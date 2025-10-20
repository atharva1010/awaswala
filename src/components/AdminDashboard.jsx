import React, { useState, useEffect } from 'react';
import { 
  Users, Building, Shield, UserCheck, UserX, Home, 
  BarChart3, Settings, LogOut, Search, Filter,
  CheckCircle, XCircle, Clock, MoreVertical,
  Eye, Edit, Trash2, Download, RefreshCw,
  Save, Bell, User, Lock, Globe, Mail,
  ChevronLeft, ChevronRight, Phone, MapPin, Calendar
} from 'lucide-react';
import axios from 'axios';

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [agents, setAgents] = useState([]);
  const [landlords, setLandlords] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [rooms, setRooms] = useState([]);
  
  // Pagination states for all sections
  const [currentTenantPage, setCurrentTenantPage] = useState(1);
  const [currentAgentPage, setCurrentAgentPage] = useState(1);
  const [currentLandlordPage, setCurrentLandlordPage] = useState(1);
  const [currentPropertyPage, setCurrentPropertyPage] = useState(1);
  const [currentVerificationPage, setCurrentVerificationPage] = useState(1);
  
  const [itemsPerPage] = useState(10);
  
  // Search and filter states
  const [tenantSearchTerm, setTenantSearchTerm] = useState('');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [landlordSearchTerm, setLandlordSearchTerm] = useState('');
  const [propertySearchTerm, setPropertySearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [verificationSearchTerm, setVerificationSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');

  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    autoApprove: false,
    verificationRequired: true,
    maxPropertiesPerLandlord: 10,
    sessionTimeout: 30
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchDashboardData();
    loadSettings();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        agentsRes,
        landlordsRes,
        tenantsRes,
        verificationsRes,
        roomsRes
      ] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/agents'),
        axios.get('http://localhost:5000/api/admin/users?role=landlord'),
        axios.get('http://localhost:5000/api/admin/users?role=tenant'),
        axios.get('http://localhost:5000/api/admin/verifications'),
        axios.get('http://localhost:5000/api/admin/rooms')
      ]);

      if (agentsRes.data.success) setAgents(agentsRes.data.agents);
      if (landlordsRes.data.success) setLandlords(landlordsRes.data.users);
      if (tenantsRes.data.success) setTenants(tenantsRes.data.users);
      if (verificationsRes.data.success) setVerifications(verificationsRes.data.verifications);
      if (roomsRes.data.success) setRooms(roomsRes.data.rooms);

      setStats({
        totalAgents: agentsRes.data.agents?.length || 0,
        pendingAgents: agentsRes.data.agents?.filter(a => a.status === 'pending').length || 0,
        totalLandlords: landlordsRes.data.users?.length || 0,
        totalTenants: tenantsRes.data.users?.length || 0,
        pendingVerifications: verificationsRes.data.verifications?.filter(v => v.status === 'Submitted').length || 0,
        totalRooms: roomsRes.data.rooms?.length || 0,
        verifiedRooms: roomsRes.data.rooms?.filter(r => r.status === 'Verified').length || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load settings from localStorage
  const loadSettings = () => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
  };

  // Handle settings change
  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✅ Enhanced Logout function with smart redirect
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      console.log('🚪 Admin logging out...');
      
      // Clear admin authentication data
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminSettings');
      
      console.log('🔄 Redirecting to Admin Login...');
      
      // Use the provided onLogout callback or fallback to hash navigation
      if (onLogout) {
        onLogout();
      } else {
        // Fallback: Direct hash navigation to admin login
        window.location.hash = 'admin-login';
      }
    }
  };

  // Agent Management Functions
  const approveAgent = async (agentId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/agents/${agentId}/approve`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error approving agent:', error);
    }
  };

  const rejectAgent = async (agentId, reason) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/agents/${agentId}/reject`, { reason });
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error rejecting agent:', error);
    }
  };

  const suspendAgent = async (agentId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/agents/${agentId}/suspend`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error suspending agent:', error);
    }
  };

  const deleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    
    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/agents/${agentId}`);
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  // Tenant Management Functions
  const deleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to delete this tenant?')) return;
    
    try {
      const res = await axios.delete(`http://localhost:5000/api/admin/users/${tenantId}`);
      if (res.data.success) {
        fetchDashboardData();
        alert('Tenant deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      alert('Error deleting tenant');
    }
  };

  const suspendTenant = async (tenantId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/users/${tenantId}/suspend`);
      if (res.data.success) {
        fetchDashboardData();
        alert('Tenant suspended successfully!');
      }
    } catch (error) {
      console.error('Error suspending tenant:', error);
      alert('Error suspending tenant');
    }
  };

  const activateTenant = async (tenantId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/users/${tenantId}/activate`);
      if (res.data.success) {
        fetchDashboardData();
        alert('Tenant activated successfully!');
      }
    } catch (error) {
      console.error('Error activating tenant:', error);
      alert('Error activating tenant');
    }
  };

  // Verification Management Functions
  const approveVerification = async (verificationId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/verifications/${verificationId}/status`, {
        status: 'Approved'
      });
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error approving verification:', error);
    }
  };

  const rejectVerification = async (verificationId, reviewNotes) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/verifications/${verificationId}/status`, {
        status: 'Rejected',
        reviewNotes
      });
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
    }
  };

  // Room Management Functions
  const updateRoomStatus = async (roomId, status) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/admin/rooms/${roomId}/status`, { status });
      if (res.data.success) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  };

  // ✅ Generic Pagination Component
  const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const paginate = (pageNumber) => {
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        onPageChange(pageNumber);
      }
    };

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      return pages;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="pagination-controls">
        <div className="pagination-info">
          Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </div>
        <div className="pagination-buttons">
          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          {getPageNumbers().map(page => (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => paginate(page)}
            >
              {page}
            </button>
          ))}
          
          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  // ✅ Tenants Management Component with Pagination
  const renderTenantsManagement = () => {
    // Filter tenants based on search and filter
    const filteredTenants = tenants.filter(tenant => {
      const matchesSearch = tenant.name?.toLowerCase().includes(tenantSearchTerm.toLowerCase()) ||
                           tenant.email?.toLowerCase().includes(tenantSearchTerm.toLowerCase()) ||
                           tenant.mobile?.includes(tenantSearchTerm);
      
      const matchesFilter = tenantFilter === 'all' || 
                           (tenantFilter === 'active' && tenant.isActive !== false) ||
                           (tenantFilter === 'inactive' && tenant.isActive === false);
      
      return matchesSearch && matchesFilter;
    });

    // Pagination calculations
    const indexOfLastTenant = currentTenantPage * itemsPerPage;
    const indexOfFirstTenant = indexOfLastTenant - itemsPerPage;
    const currentTenants = filteredTenants.slice(indexOfFirstTenant, indexOfLastTenant);

    return (
      <div className="management-section">
        <div className="section-header">
          <h2>Tenants Management ({filteredTenants.length})</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search tenants..." 
                value={tenantSearchTerm}
                onChange={(e) => {
                  setTenantSearchTerm(e.target.value);
                  setCurrentTenantPage(1);
                }}
              />
            </div>
            <select 
              className="filter-select"
              value={tenantFilter}
              onChange={(e) => {
                setTenantFilter(e.target.value);
                setCurrentTenantPage(1);
              }}
            >
              <option value="all">All Tenants</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="btn-primary" onClick={fetchDashboardData}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Joined Date</th>
                <th>Status</th>
                <th>Properties Booked</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentTenants.length > 0 ? (
                currentTenants.map(tenant => (
                  <tr key={tenant._id}>
                    <td>
                      <div className="user-info">
                        <div className="avatar-placeholder">
                          {tenant.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="user-name">{tenant.name || 'N/A'}</div>
                          <div className="user-email">{tenant.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="phone">
                          <Phone size={14} />
                          {tenant.mobile || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="location-info">
                        <MapPin size={14} />
                        {tenant.city || 'Not specified'}, {tenant.state || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={14} />
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${tenant.isActive === false ? 'rejected' : 'approved'}`}>
                        {tenant.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <span className="properties-count">
                        {rooms.filter(room => room.tenantId === tenant._id).length}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-info" title="View Details">
                          <Eye size={14} />
                        </button>
                        <button className="btn-warning" title="Edit Tenant">
                          <Edit size={14} />
                        </button>
                        {tenant.isActive !== false ? (
                          <button 
                            className="btn-danger"
                            onClick={() => suspendTenant(tenant._id)}
                            title="Suspend Tenant"
                          >
                            <UserX size={14} />
                          </button>
                        ) : (
                          <button 
                            className="btn-success"
                            onClick={() => activateTenant(tenant._id)}
                            title="Activate Tenant"
                          >
                            <UserCheck size={14} />
                          </button>
                        )}
                        <button 
                          className="btn-danger"
                          onClick={() => deleteTenant(tenant._id)}
                          title="Delete Tenant"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    <div className="no-data-content">
                      <UserX size={48} />
                      <p>No tenants found</p>
                      <span>Try adjusting your search or filter criteria</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentTenantPage}
          totalItems={filteredTenants.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentTenantPage}
        />
      </div>
    );
  };

  // ✅ Agent Management Component with Pagination
  const renderAgentsManagement = () => {
    // Filter agents based on search and filter
    const filteredAgents = agents.filter(agent => {
      const matchesSearch = agent.name?.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
                           agent.email?.toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
                           agent.phone?.includes(agentSearchTerm);
      
      const matchesFilter = agentFilter === 'all' || 
                           (agentFilter === 'pending' && agent.status === 'pending') ||
                           (agentFilter === 'approved' && agent.status === 'approved') ||
                           (agentFilter === 'rejected' && agent.status === 'rejected');
      
      return matchesSearch && matchesFilter;
    });

    // Pagination calculations
    const indexOfLastAgent = currentAgentPage * itemsPerPage;
    const indexOfFirstAgent = indexOfLastAgent - itemsPerPage;
    const currentAgents = filteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);

    return (
      <div className="management-section">
        <div className="section-header">
          <h2>Agent Management ({filteredAgents.length})</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search agents..." 
                value={agentSearchTerm}
                onChange={(e) => {
                  setAgentSearchTerm(e.target.value);
                  setCurrentAgentPage(1);
                }}
              />
            </div>
            <select 
              className="filter-select"
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setCurrentAgentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="btn-primary" onClick={fetchDashboardData}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Contact</th>
                <th>Zone</th>
                <th>Status</th>
                <th>Applied On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAgents.length > 0 ? (
                currentAgents.map(agent => (
                  <tr key={agent._id}>
                    <td>
                      <div className="user-info">
                        <div className="avatar-placeholder">
                          {agent.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="user-name">{agent.name}</div>
                          <div className="user-email">{agent.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{agent.phone}</td>
                    <td>{agent.zone}</td>
                    <td>
                      <span className={`status-badge ${agent.status}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td>{new Date(agent.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        {agent.status === 'pending' && (
                          <>
                            <button 
                              className="btn-success"
                              onClick={() => approveAgent(agent._id)}
                            >
                              <CheckCircle size={14} />
                              Approve
                            </button>
                            <button 
                              className="btn-danger"
                              onClick={() => rejectAgent(agent._id, 'Not meeting requirements')}
                            >
                              <XCircle size={14} />
                              Reject
                            </button>
                          </>
                        )}
                        {agent.status === 'approved' && (
                          <button 
                            className="btn-warning"
                            onClick={() => suspendAgent(agent._id)}
                          >
                            <UserX size={14} />
                            Suspend
                          </button>
                        )}
                        <button 
                          className="btn-danger"
                          onClick={() => deleteAgent(agent._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="no-data-content">
                      <Users size={48} />
                      <p>No agents found</p>
                      <span>Try adjusting your search or filter criteria</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentAgentPage}
          totalItems={filteredAgents.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentAgentPage}
        />
      </div>
    );
  };

  // ✅ Verifications Management Component with Pagination
  const renderVerificationsManagement = () => {
    // Filter verifications based on search and filter
    const filteredVerifications = verifications.filter(verification => {
      const matchesSearch = verification.roomTitle?.toLowerCase().includes(verificationSearchTerm.toLowerCase()) ||
                           verification.agentName?.toLowerCase().includes(verificationSearchTerm.toLowerCase()) ||
                           verification.roomLocation?.toLowerCase().includes(verificationSearchTerm.toLowerCase());
      
      const matchesFilter = verificationFilter === 'all' || 
                           (verificationFilter === 'submitted' && verification.status === 'Submitted') ||
                           (verificationFilter === 'approved' && verification.status === 'Approved') ||
                           (verificationFilter === 'rejected' && verification.status === 'Rejected');
      
      return matchesSearch && matchesFilter;
    });

    // Pagination calculations
    const indexOfLastVerification = currentVerificationPage * itemsPerPage;
    const indexOfFirstVerification = indexOfLastVerification - itemsPerPage;
    const currentVerifications = filteredVerifications.slice(indexOfFirstVerification, indexOfLastVerification);

    return (
      <div className="management-section">
        <div className="section-header">
          <h2>Property Verifications ({filteredVerifications.length})</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search verifications..." 
                value={verificationSearchTerm}
                onChange={(e) => {
                  setVerificationSearchTerm(e.target.value);
                  setCurrentVerificationPage(1);
                }}
              />
            </div>
            <select 
              className="filter-select"
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setCurrentVerificationPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <button className="btn-primary" onClick={fetchDashboardData}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="verifications-container">
          <div className="verifications-grid">
            {currentVerifications.length > 0 ? (
              currentVerifications.map(verification => (
                <div key={verification._id} className="verification-card">
                  <div className="verification-header">
                    <div className="property-info">
                      <h4>{verification.roomTitle}</h4>
                      <p>Room ID: {verification.roomNumber}</p>
                      <p>Rent: ₹{verification.roomRent}/month</p>
                      <p>Location: {verification.roomLocation}</p>
                    </div>
                    <span className={`status-badge ${verification.status}`}>
                      {verification.status}
                    </span>
                  </div>

                  <div className="agent-info">
                    <h5>Agent Information</h5>
                    <p><strong>Name:</strong> {verification.agentName}</p>
                    <p><strong>Email:</strong> {verification.agentEmail}</p>
                    <p><strong>Phone:</strong> {verification.agentPhone}</p>
                    <p><strong>Zone:</strong> {verification.agentZone}</p>
                  </div>

                  <div className="verification-documents">
                    <h5>Submitted Documents</h5>
                    <div className="documents-grid">
                      <a href={verification.aadharDoc} target="_blank" rel="noopener noreferrer">
                        Aadhar Card
                      </a>
                      <a href={verification.electricityBillDoc} target="_blank" rel="noopener noreferrer">
                        Electricity Bill
                      </a>
                      <a href={verification.ownerPhoto} target="_blank" rel="noopener noreferrer">
                        Owner Photo
                      </a>
                      <span>Room Photos ({verification.roomPhotos?.length || 0})</span>
                    </div>
                  </div>

                  {verification.reviewNotes && (
                    <div className="review-notes">
                      <strong>Review Notes:</strong> {verification.reviewNotes}
                    </div>
                  )}

                  <div className="verification-actions">
                    {verification.status === 'Submitted' && (
                      <>
                        <button 
                          className="btn-success"
                          onClick={() => approveVerification(verification._id)}
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button 
                          className="btn-danger"
                          onClick={() => rejectVerification(verification._id, 'Documents not clear')}
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </>
                    )}
                    <button className="btn-info">
                      <Eye size={14} />
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">
                <div className="no-data-content">
                  <Shield size={48} />
                  <p>No verifications found</p>
                  <span>Try adjusting your search or filter criteria</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentVerificationPage}
          totalItems={filteredVerifications.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentVerificationPage}
        />
      </div>
    );
  };

  // ✅ Properties Management Component with Pagination
  const renderPropertiesManagement = () => {
    // Filter properties based on search and filter
    const filteredProperties = rooms.filter(room => {
      const matchesSearch = room.title?.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
                           room.owner?.name?.toLowerCase().includes(propertySearchTerm.toLowerCase()) ||
                           room.city?.toLowerCase().includes(propertySearchTerm.toLowerCase());
      
      const matchesFilter = propertyFilter === 'all' || 
                           (propertyFilter === 'pending' && room.status === 'Pending') ||
                           (propertyFilter === 'verified' && room.status === 'Verified') ||
                           (propertyFilter === 'cancelled' && room.status === 'Cancelled');
      
      return matchesSearch && matchesFilter;
    });

    // Pagination calculations
    const indexOfLastProperty = currentPropertyPage * itemsPerPage;
    const indexOfFirstProperty = indexOfLastProperty - itemsPerPage;
    const currentProperties = filteredProperties.slice(indexOfFirstProperty, indexOfLastProperty);

    return (
      <div className="management-section">
        <div className="section-header">
          <h2>Properties Management ({filteredProperties.length})</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search properties..." 
                value={propertySearchTerm}
                onChange={(e) => {
                  setPropertySearchTerm(e.target.value);
                  setCurrentPropertyPage(1);
                }}
              />
            </div>
            <select 
              className="filter-select"
              value={propertyFilter}
              onChange={(e) => {
                setPropertyFilter(e.target.value);
                setCurrentPropertyPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn-primary" onClick={fetchDashboardData}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Owner</th>
                <th>Rent</th>
                <th>Location</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProperties.length > 0 ? (
                currentProperties.map(room => (
                  <tr key={room._id}>
                    <td>
                      <div className="user-info">
                        <div>
                          <div className="user-name">{room.title}</div>
                          <div className="user-email">ID: {room.roomId}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="avatar-placeholder">
                          {room.owner?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="user-name">{room.owner?.name}</div>
                          <div className="user-email">{room.owner?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>₹{room.rent}/month</td>
                    <td>{room.city}, {room.state}</td>
                    <td>
                      <span className={`status-badge ${room.status.toLowerCase()}`}>
                        {room.status}
                      </span>
                    </td>
                    <td>{new Date(room.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-info">
                          <Eye size={14} />
                        </button>
                        {room.status !== 'Verified' && (
                          <button 
                            className="btn-success"
                            onClick={() => updateRoomStatus(room._id, 'Verified')}
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        {room.status !== 'Cancelled' && (
                          <button 
                            className="btn-danger"
                            onClick={() => updateRoomStatus(room._id, 'Cancelled')}
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    <div className="no-data-content">
                      <Building size={48} />
                      <p>No properties found</p>
                      <span>Try adjusting your search or filter criteria</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPropertyPage}
          totalItems={filteredProperties.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPropertyPage}
        />
      </div>
    );
  };

  // ✅ Landlords Management Component with Pagination
  const renderLandlordsManagement = () => {
    // Filter landlords based on search
    const filteredLandlords = landlords.filter(landlord => 
      landlord.name?.toLowerCase().includes(landlordSearchTerm.toLowerCase()) ||
      landlord.email?.toLowerCase().includes(landlordSearchTerm.toLowerCase()) ||
      landlord.mobile?.includes(landlordSearchTerm)
    );

    // Pagination calculations
    const indexOfLastLandlord = currentLandlordPage * itemsPerPage;
    const indexOfFirstLandlord = indexOfLastLandlord - itemsPerPage;
    const currentLandlords = filteredLandlords.slice(indexOfFirstLandlord, indexOfLastLandlord);

    return (
      <div className="management-section">
        <div className="section-header">
          <h2>Landlords Management ({filteredLandlords.length})</h2>
          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search landlords..." 
                value={landlordSearchTerm}
                onChange={(e) => {
                  setLandlordSearchTerm(e.target.value);
                  setCurrentLandlordPage(1);
                }}
              />
            </div>
            <button className="btn-primary" onClick={fetchDashboardData}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Landlord</th>
                <th>Contact</th>
                <th>Properties</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentLandlords.length > 0 ? (
                currentLandlords.map(landlord => (
                  <tr key={landlord._id}>
                    <td>
                      <div className="user-info">
                        <div className="avatar-placeholder">
                          {landlord.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="user-name">{landlord.name}</div>
                          <div className="user-email">{landlord.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{landlord.mobile}</td>
                    <td>
                      {rooms.filter(room => room.owner?._id === landlord._id).length} properties
                    </td>
                    <td>{new Date(landlord.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="status-badge approved">
                        Active
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-info">
                          <Eye size={14} />
                        </button>
                        <button className="btn-warning">
                          <Edit size={14} />
                        </button>
                        <button className="btn-danger">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div className="no-data-content">
                      <Home size={48} />
                      <p>No landlords found</p>
                      <span>Try adjusting your search criteria</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentLandlordPage}
          totalItems={filteredLandlords.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentLandlordPage}
        />
      </div>
    );
  };

  // ... (Settings and Dashboard components remain the same as your original code)
  // Render Settings Component
  const renderSettings = () => (
    <div className="management-section">
      <div className="section-header">
        <h2>Admin Settings</h2>
        <button className="btn-primary" onClick={saveSettings}>
          <Save size={18} />
          Save Settings
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-section">
          <h3>
            <Bell size={20} />
            Notifications
          </h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
                Enable Notifications
              </label>
              <span className="setting-description">
                Receive browser notifications for important events
              </span>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.emailAlerts}
                  onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                />
                Email Alerts
              </label>
              <span className="setting-description">
                Send email notifications for pending approvals
              </span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            <Shield size={20} />
            Verification Settings
          </h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.autoApprove}
                  onChange={(e) => handleSettingChange('autoApprove', e.target.checked)}
                />
                Auto-Approval
              </label>
              <span className="setting-description">
                Automatically approve properties from verified agents
              </span>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.verificationRequired}
                  onChange={(e) => handleSettingChange('verificationRequired', e.target.checked)}
                />
                Verification Required
              </label>
              <span className="setting-description">
                Require verification for all new properties
              </span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            <Building size={20} />
            Property Limits
          </h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Maximum Properties per Landlord</label>
              <input
                type="number"
                value={settings.maxPropertiesPerLandlord}
                onChange={(e) => handleSettingChange('maxPropertiesPerLandlord', parseInt(e.target.value))}
                min="1"
                max="50"
              />
              <span className="setting-description">
                Limit the number of properties a landlord can register
              </span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            <Lock size={20} />
            Security
          </h3>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                min="5"
                max="120"
              />
              <span className="setting-description">
                Automatic logout after specified minutes of inactivity
              </span>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>
            <User size={20} />
            Account
          </h3>
          <div className="settings-grid">
            <div className="setting-item">
              <button className="btn-warning" onClick={handleLogout}>
                <LogOut size={18} />
                Logout from Admin Panel
              </button>
              <span className="setting-description">
                Secure logout from admin dashboard
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Dashboard Component
  const renderDashboard = () => (
    <div className="dashboard-grid">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon agents">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalAgents}</h3>
            <p>Total Agents</p>
            <span className="stat-subtext">{stats.pendingAgents} pending approval</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon landlords">
            <Home size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalLandlords}</h3>
            <p>Landlords</p>
            <span className="stat-subtext">Property owners</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon tenants">
            <UserCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalTenants}</h3>
            <p>Tenants</p>
            <span className="stat-subtext">Registered users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon verifications">
            <Shield size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.pendingVerifications}</h3>
            <p>Pending Verifications</p>
            <span className="stat-subtext">Awaiting review</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rooms">
            <Building size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalRooms}</h3>
            <p>Total Properties</p>
            <span className="stat-subtext">{stats.verifiedRooms} verified</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button 
            className="action-btn"
            onClick={() => setActiveTab('agents')}
          >
            <UserCheck size={20} />
            <span>Manage Agents</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('verifications')}
          >
            <Shield size={20} />
            <span>Review Verifications</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('properties')}
          >
            <Building size={20} />
            <span>Manage Properties</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('landlords')}
          >
            <Users size={20} />
            <span>Manage Landlords</span>
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('tenants')}
          >
            <UserCheck size={20} />
            <span>Manage Tenants</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {agents.slice(0, 5).map(agent => (
            <div key={agent._id} className="activity-item">
              <div className="activity-icon">
                <Users size={16} />
              </div>
              <div className="activity-content">
                <p><strong>{agent.name}</strong> applied for agent account</p>
                <span className="activity-time">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={`activity-status ${agent.status}`}>
                {agent.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Sidebar Navigation
  const sidebarNav = (
    <nav className="sidebar-nav">
      <button 
        className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        <BarChart3 size={20} />
        <span>Dashboard</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`}
        onClick={() => setActiveTab('agents')}
      >
        <Users size={20} />
        <span>Agents</span>
        {stats.pendingAgents > 0 && (
          <span className="nav-badge">{stats.pendingAgents}</span>
        )}
      </button>

      <button 
        className={`nav-item ${activeTab === 'verifications' ? 'active' : ''}`}
        onClick={() => setActiveTab('verifications')}
      >
        <Shield size={20} />
        <span>Verifications</span>
        {stats.pendingVerifications > 0 && (
          <span className="nav-badge">{stats.pendingVerifications}</span>
        )}
      </button>

      <button 
        className={`nav-item ${activeTab === 'properties' ? 'active' : ''}`}
        onClick={() => setActiveTab('properties')}
      >
        <Building size={20} />
        <span>Properties</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'landlords' ? 'active' : ''}`}
        onClick={() => setActiveTab('landlords')}
      >
        <Home size={20} />
        <span>Landlords</span>
      </button>

      <button 
        className={`nav-item ${activeTab === 'tenants' ? 'active' : ''}`}
        onClick={() => setActiveTab('tenants')}
      >
        <UserCheck size={20} />
        <span>Tenants</span>
        {stats.totalTenants > 0 && (
          <span className="nav-badge">{stats.totalTenants}</span>
        )}
      </button>
    </nav>
  );

  // ✅ Updated Sidebar Footer with enhanced logout
  const sidebarFooter = (
    <div className="sidebar-footer">
      <button 
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveTab('settings')}
      >
        <Settings size={20} />
        <span>Settings</span>
      </button>
      {/* ✅ Updated Logout Button */}
      <button className="nav-item logout-btn" onClick={handleLogout}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </div>
  );

  return (
    <div className="admin-dashboard">
      {/* Desktop Only Warning */}
      <div className="desktop-only-warning">
        <div className="warning-content">
          <h2>🖥️ Desktop View Required</h2>
          <p>This admin dashboard is optimized for desktop viewing only.</p>
          <p>Please access this page from a desktop or laptop computer for the best experience.</p>
        </div>
      </div>

      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="admin-logo">
            <Shield size={32} />
            <span>Admin Panel</span>
          </div>
        </div>

        {sidebarNav}
        {sidebarFooter}
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <h1>
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'agents' && 'Agent Management'}
            {activeTab === 'verifications' && 'Property Verifications'}
            {activeTab === 'properties' && 'Properties Management'}
            {activeTab === 'landlords' && 'Landlords Management'}
            {activeTab === 'tenants' && 'Tenants Management'}
            {activeTab === 'settings' && 'Admin Settings'}
          </h1>
          <div className="header-actions">
            <button className="btn-primary" onClick={fetchDashboardData}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </header>

        <div className="admin-content">
          {loading ? (
            <div className="loading-state">
              <RefreshCw size={32} className="spinner" />
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'agents' && renderAgentsManagement()}
              {activeTab === 'verifications' && renderVerificationsManagement()}
              {activeTab === 'properties' && renderPropertiesManagement()}
              {activeTab === 'landlords' && renderLandlordsManagement()}
              {activeTab === 'tenants' && renderTenantsManagement()}
              {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        /* Main container with proper scroll */
        .admin-dashboard {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          min-width: 1200px;
          overflow: hidden;
        }

        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 920px;
          overflow: hidden;
        }

        .admin-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
          min-width: 900px;
          max-height: calc(100vh - 80px);
        }

        /* Management sections with proper height */
        .management-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          min-width: 800px;
          display: flex;
          flex-direction: column;
          height: fit-content;
          min-height: 600px;
        }

        .table-container {
          overflow-x: auto;
          flex: 1;
          min-height: 400px;
        }

        .verifications-container {
          flex: 1;
          min-height: 400px;
          padding: 0 24px;
        }

        .verifications-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          min-height: 400px;
        }

        /* Pagination Styles */
        .pagination-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          margin-top: auto;
        }

        .pagination-info {
          font-size: 14px;
          color: #64748b;
        }

        .pagination-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }


                .settings-content {
          padding: 24px;
        }

        .settings-section {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .settings-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .settings-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          color: #1e293b;
          font-size: 18px;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .setting-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-item label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
        }

        .setting-item input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }

        .setting-item input[type="number"] {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          width: 200px;
          font-size: 14px;
        }

        .setting-description {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }

        .admin-dashboard {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          min-width: 1200px; /* Minimum width for desktop */
        }

        /* Desktop Only Warning - Hidden on desktop */
        .desktop-only-warning {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          z-index: 1000;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .warning-content h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .warning-content p {
          font-size: 1.2rem;
          margin-bottom: 0.5rem;
        }

        /* Sidebar Styles - Fixed width for desktop */
        .admin-sidebar {
          width: 280px;
          background: #1e293b;
          color: white;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .sidebar-header {
          padding: 24px;
          border-bottom: 1px solid #334155;
        }

        .admin-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 0;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 24px;
          background: none;
          border: none;
          color: #cbd5e1;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          font-size: 14px;
        }

        .nav-item:hover {
          background: #334155;
          color: white;
        }

        .nav-item.active {
          background: #3b82f6;
          color: white;
        }

        .nav-badge {
          background: #ef4444;
          color: white;
          border-radius: 10px;
          padding: 2px 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .sidebar-footer {
          border-top: 1px solid #334155;
          padding: 16px 0;
        }

        /* Main Content Styles */
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 920px; /* Ensure main content has minimum width */
        }

        .admin-header {
          background: white;
          padding: 24px 32px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .admin-header h1 {
          margin: 0;
          color: #1e293b;
          font-size: 24px;
          font-weight: 700;
        }

        .admin-content {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
          min-width: 900px;
        }

        /* Dashboard Grid */
        .dashboard-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 250px;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-icon.agents { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .stat-icon.landlords { background: linear-gradient(135deg, #10b981, #059669); }
        .stat-icon.verifications { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .stat-icon.rooms { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

        .stat-content h3 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-content p {
          margin: 4px 0 0 0;
          color: #64748b;
          font-weight: 500;
        }

        .stat-subtext {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
          display: block;
        }

        /* Quick Actions */
        .quick-actions {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .quick-actions h3 {
          margin: 0 0 16px 0;
          color: #1e293b;
          font-size: 18px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .action-btn:hover {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        /* Management Sections */
        .management-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          min-width: 800px;
        }

        .section-header {
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-header h2 {
          margin: 0;
          color: #1e293b;
          font-size: 20px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-box input {
          padding: 8px 12px 8px 36px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          width: 250px;
          font-size: 14px;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          color: #6b7280;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 14px;
        }

        /* Tables */
        .table-container {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }

        .data-table th {
          background: #f8fafc;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }

        .data-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }

        .data-table tr:hover {
          background: #f9fafb;
        }

        /* User Info */
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .user-name {
          font-weight: 600;
          color: #1e293b;
        }

        .user-email {
          font-size: 12px;
          color: #64748b;
        }

        /* Status Badges */
        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge.pending { background: #fef3c7; color: #d97706; }
        .status-badge.approved { background: #d1fae5; color: #065f46; }
        .status-badge.rejected { background: #fee2e2; color: #dc2626; }
        .status-badge.suspended { background: #f3f4f6; color: #6b7280; }
        .status-badge.Submitted { background: #fef3c7; color: #d97706; }
        .status-badge.Approved { background: #d1fae5; color: #065f46; }
        .status-badge.Rejected { background: #fee2e2; color: #dc2626; }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .btn-success, .btn-danger, .btn-warning, .btn-info, .btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-success { background: #10b981; color: white; }
        .btn-danger { background: #ef4444; color: white; }
        .btn-warning { background: #f59e0b; color: white; }
        .btn-info { background: #3b82f6; color: white; }
        .btn-primary { background: #1e40af; color: white; }

        .btn-success:hover { background: #059669; }
        .btn-danger:hover { background: #dc2626; }
        .btn-warning:hover { background: #d97706; }
        .btn-info:hover { background: #2563eb; }
        .btn-primary:hover { background: #1e3a8a; }

        /* Verification Cards */
        .verifications-grid {
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .verification-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          background: white;
          min-width: 400px;
        }

        .verification-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 16px;
        }

        .property-info h4 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 16px;
        }

        .property-info p {
          margin: 4px 0;
          color: #64748b;
          font-size: 14px;
        }

        .agent-info {
          margin: 16px 0;
          padding: 12px;
          background: #f8fafc;
          border-radius: 6px;
        }

        .agent-info h5 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 14px;
        }

        .verification-documents h5 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 14px;
        }

        .documents-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .documents-grid a {
          padding: 6px 8px;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-size: 12px;
          text-align: center;
        }

        .verification-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .review-notes {
          margin-top: 12px;
          padding: 8px;
          background: #fef3c7;
          border-radius: 4px;
          font-size: 14px;
        }

        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: #64748b;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Recent Activity */
        .recent-activity {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          background: #e2e8f0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-content {
          flex: 1;
        }

        .activity-content p {
          margin: 0;
          color: #374151;
          font-size: 14px;
        }

        .activity-time {
          font-size: 12px;
          color: #6b7280;
        }

        .activity-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        /* Desktop Only Media Query */
        @media (max-width: 1024px) {
          .admin-dashboard {
            display: none;
          }
          
          .desktop-only-warning {
            display: flex;
          }
        }

        /* Hide scrollbars but keep functionality */
        .admin-content::-webkit-scrollbar {
          width: 8px;
        }

        .admin-content::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .admin-content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .admin-content::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        .pagination-btn:hover:not(:disabled) {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .pagination-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .pagination-btn:disabled {
          background: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
          border-color: #e5e7eb;
        }

        /* No Data Styles */
        .no-data {
          text-align: center;
          padding: 60px 20px;
        }

        .no-data-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: #64748b;
        }

        .no-data-content p {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }

        .no-data-content span {
          font-size: 14px;
          color: #94a3b8;
        }

        /* Rest of your existing CSS styles... */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
        }

        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 220px;
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-icon.agents { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .stat-icon.landlords { background: linear-gradient(135deg, #10b981, #059669); }
        .stat-icon.tenants { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        .stat-icon.verifications { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .stat-icon.rooms { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

        /* Add smooth scrolling */
        .admin-content::-webkit-scrollbar {
          width: 8px;
        }

        .admin-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .admin-content::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        .admin-content::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        /* Ensure tables are scrollable */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }

        /* Your existing CSS styles continue below... */
        /* ... (include all your existing CSS styles from the original code) */
      `}</style>
    </div>
  );
};

export default AdminDashboard;