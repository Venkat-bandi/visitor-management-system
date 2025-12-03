import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Security Emails State
  const [showSecurityEmails, setShowSecurityEmails] = useState(false);
  const [securityEmails, setSecurityEmails] = useState(['']);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load TODAY'S data automatically on component mount
  useEffect(() => {
    fetchDashboardData();
    fetchVisitors();
  }, []);

  // Fetch data when page changes
  useEffect(() => {
    fetchVisitors();
  }, [currentPage]);

  const fetchDashboardData = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: 10
      };
      const response = await adminAPI.getVisitors(params);
      setVisitors(response.data.data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Security Emails Functions
  const addSecurityEmailField = () => {
    setSecurityEmails([...securityEmails, '']);
  };

  const handleSecurityEmailChange = (index, value) => {
    const newEmails = [...securityEmails];
    newEmails[index] = value;
    setSecurityEmails(newEmails);
  };

  const removeSecurityEmailField = (index) => {
    const newEmails = securityEmails.filter((_, i) => i !== index);
    setSecurityEmails(newEmails);
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setSecurityLoading(true);
    setSecurityMessage('');

    try {
      const validEmails = securityEmails.filter(email => email.trim() !== '');
      
      if (validEmails.length === 0) {
        setSecurityMessage('Please add at least one security email');
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/add-security-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          securityEmails: validEmails
        })
      });

      const result = await response.json();

      if (response.ok) {
        setSecurityMessage('✅ Security emails added successfully!');
        setSecurityEmails(['']);
        setShowSecurityEmails(false);
      } else {
        setSecurityMessage('❌ ' + (result.message || 'Failed to add security emails'));
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      setSecurityMessage('❌ Network error - check console');
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVisitors();
  };

  const handleReset = () => {
    const today = new Date().toISOString().split('T')[0];
    setFilters({
      startDate: today,
      endDate: today,
      status: 'all',
      search: ''
    });
    setCurrentPage(1);
  };

  const handleExport = async (format) => {
    try {
      const response = await adminAPI.exportVisitors({
        ...filters,
        format
      });
      
      const blob = new Blob([response.data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `visitors-${filters.startDate}-to-${filters.endDate}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!dashboardData) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.animatedBackground}></div>
      
      {/* Image Modal */}
      {selectedImage && (
        <div style={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              style={styles.closeButton}
              onClick={() => setSelectedImage(null)}
              className="modal-close-btn"
            >
              ✕
            </button>
            <img 
              src={selectedImage} 
              alt="Visitor" 
              style={styles.modalImage}
              className="modal-image"
            />
          </div>
        </div>
      )}

      {/* Security Emails Modal */}
      {showSecurityEmails && (
        <div style={styles.modalOverlay} onClick={() => setShowSecurityEmails(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              style={styles.closeButton}
              onClick={() => setShowSecurityEmails(false)}
              className="modal-close-btn"
            >
              ✕
            </button>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Security Emails</h3>
              <p style={styles.modalSubtitle}>Add email addresses that will be allowed to register as Security staff.</p>
            </div>
            
            {securityMessage && (
              <div style={securityMessage.includes('successfully') ? styles.successMessage : styles.errorMessage} className="security-message">
                {securityMessage}
              </div>
            )}

            <form onSubmit={handleSecuritySubmit} style={styles.securityForm}>
              {securityEmails.map((email, index) => (
                <div key={index} style={styles.emailRow}>
                  <input
                    type="email"
                    placeholder="security@example.com"
                    value={email}
                    onChange={(e) => handleSecurityEmailChange(index, e.target.value)}
                    style={styles.emailInput}
                    className="security-input"
                    required
                  />
                  {securityEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSecurityEmailField(index)}
                      style={styles.removeBtn}
                      className="btn-remove"
                    >
                      {isMobile ? '✕' : 'Remove'}
                    </button>
                  )}
                </div>
              ))}
              
              <div style={styles.securityButtonGroup}>
                <button
                  type="button"
                  onClick={addSecurityEmailField}
                  style={styles.addBtn}
                  className="btn-add"
                >
                  <span style={styles.btnIcon}>+</span>
                  {isMobile ? 'Add Email' : 'Add Another Email'}
                </button>
                
                <button
                  type="submit"
                  disabled={securityLoading}
                  style={styles.securitySubmitBtn}
                  className={securityLoading ? 'btn-loading' : 'btn-submit'}
                >
                  {securityLoading ? (
                    <>
                      <div style={styles.submitSpinner}></div>
                      {isMobile ? 'Adding...' : 'Adding Emails...'}
                    </>
                  ) : (
                    <>
                      <span style={styles.btnIcon}>✓</span>
                      {isMobile ? 'Save' : 'Save Security Emails'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerInfo}>
            <div style={styles.logo}>
              <div style={styles.logoIcon}>📊</div>
              <h2 style={styles.headerTitle}>
                {isMobile ? 'Dashboard' : 'Admin Dashboard'}
              </h2>
            </div>
            <div style={styles.lastUpdated}>
              Last Updated: {new Date(dashboardData.lastUpdated).toLocaleString()}
            </div>
          </div>
          <div style={styles.headerActions}>
            <button 
              onClick={() => setShowSecurityEmails(true)}
              style={styles.securityBtn}
              className="btn-security"
            >
              <span style={styles.btnIcon}>🛡️</span>
              {isMobile ? 'Security' : 'Security Emails'}
            </button>
            <div style={styles.exportGroup}>
              <button 
                onClick={() => handleExport('csv')}
                style={styles.exportBtn}
                className="btn-export"
              >
                <span style={styles.btnIcon}>📥</span>
                {isMobile ? 'CSV' : 'Export CSV'}
              </button>
              <button 
                onClick={() => handleExport('json')}
                style={styles.exportBtn}
                className="btn-export"
              >
                <span style={styles.btnIcon}>📥</span>
                {isMobile ? 'JSON' : 'Export JSON'}
              </button>
            </div>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              style={styles.logoutBtn}
              className="btn-logout"
            >
              <span style={styles.btnIcon}>🚪</span>
              {isMobile ? 'Logout' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsContainer}>
        {[
          { key: 'total', label: 'Total Today', icon: '👥' },
          { key: 'pending', label: 'Pending', icon: '⏳' },
          { key: 'approved', label: 'Approved', icon: '✅' },
          { key: 'rejected', label: 'Rejected', icon: '❌' },
          { key: 'currentHour', label: 'This Hour', icon: '🕒' }
        ].map((stat, index) => (
          <div key={stat.key} style={styles.statCard} className="stat-card">
            <div style={styles.statIcon}>{stat.icon}</div>
            <div style={styles.statContent}>
              <h3 style={styles.statNumber}>{dashboardData.stats[stat.key]}</h3>
              <p style={styles.statLabel}>{isMobile ? stat.label.split(' ')[0] : stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters with SEARCH button */}
      <div style={styles.filters}>
        <div style={styles.filterGrid}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              style={styles.filterInput}
              className="filter-input"
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              style={styles.filterInput}
              className="filter-input"
            />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={styles.filterInput}
              className="filter-input"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Search</label>
            <input
              type="text"
              placeholder={isMobile ? "Search..." : "Search by name, phone, flat..."}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={styles.filterInput}
              className="filter-input"
            />
          </div>
        </div>
        
        {/* SEARCH & RESET BUTTONS */}
        <div style={styles.filterActions}>
          <button 
            onClick={handleSearch}
            style={styles.searchButton}
            className="btn-search"
          >
            <span style={styles.btnIcon}>🔍</span>
            {isMobile ? 'Search' : 'Search'}
          </button>
          <button 
            onClick={handleReset}
            style={styles.resetButton}
            className="btn-reset"
          >
            <span style={styles.btnIcon}>🔄</span>
            {isMobile ? 'Reset' : 'Reset'}
          </button>
        </div>
      </div>

      {/* Visitors Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>
            {filters.startDate && filters.endDate 
              ? `Visitors: ${filters.startDate} to ${filters.endDate}` 
              : "Today's Visitors"}
            <small style={styles.tableSubtitle}>
              (Showing: {visitors.length} records)
            </small>
          </h3>
          <div style={styles.pagination}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={styles.pageButton}
              className="page-btn"
            >
              <span style={styles.btnIcon}>←</span>
              {!isMobile && ' Previous'}
            </button>
            <span style={styles.pageInfo}>Page {currentPage}</span>
            <button 
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={visitors.length < 10}
              style={styles.pageButton}
              className="page-btn"
            >
              {!isMobile && 'Next '}
              <span style={styles.btnIcon}>→</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>Loading visitors...</div>
          </div>
        ) : (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      { key: 'visitorImage', label: 'Image' },
                      { key: 'createdAt', label: 'Date & Time' },
                      { key: 'visitorName', label: 'Visitor Name' },
                      { key: 'visitorPhone', label: 'Phone' },
                      { key: 'ownerName', label: 'Owner' },
                      { key: 'flatNo', label: 'Flat' },
                      { key: 'bikeNumber', label: 'Bike No' },
                      { key: 'status', label: 'Status' },
                      { key: 'capturedBy', label: 'Security' }
                    ].map(column => (
                      <th key={column.key} style={styles.th}>
                        {isMobile ? column.label.split(' ')[0] : column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((visitor) => (
                    <tr key={visitor._id} style={styles.tr} className="table-row">
                      <td style={styles.td}>
                        {visitor.visitorImage ? (
                          <img 
                            src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${visitor.visitorImage}`}
                            alt="Visitor"
                            style={styles.visitorImage}
                            onClick={() => setSelectedImage(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${visitor.visitorImage}`)}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                            className="visitor-img"
                          />
                        ) : (
                          <span style={styles.noImage}>📷</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {new Date(visitor.createdAt).toLocaleString()}
                      </td>
                      <td style={styles.td}>{visitor.visitorName}</td>
                      <td style={styles.td}>{visitor.visitorPhone}</td>
                      <td style={styles.td}>{visitor.ownerName}</td>
                      <td style={styles.td}>Flat {visitor.flatNo}, {visitor.floor}</td>
                      <td style={styles.td}>{visitor.bikeNumber || '-'}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.status,
                          backgroundColor: getStatusColor(visitor.status)
                        }} className="status-badge">
                          {isMobile ? visitor.status.charAt(0).toUpperCase() : visitor.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {visitor.capturedBy?.name || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {visitors.length === 0 && (
              <div style={styles.noData}>
                <div style={styles.noDataIcon}>📭</div>
                <div style={styles.noDataText}>No visitors found for selected criteria</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Enhanced Responsive Styles
const styles = {
  container: {
    padding: '1rem',
    backgroundColor: '#0f172a',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden'
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, #0f172a, #1e293b, #334155)',
    backgroundSize: '400% 400%',
    animation: 'gradientShift 15s ease infinite',
    zIndex: 0
  },
  header: {
    position: 'relative',
    zIndex: 10,
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    marginBottom: '1.5rem',
    padding: '1.5rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    '@media (max-width: 768px)': {
      padding: '1rem',
      borderRadius: '16px',
      marginBottom: '1rem'
    }
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '1rem'
    }
  },
  headerInfo: {
    flex: 1
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem'
  },
  logoIcon: {
    fontSize: '2rem',
    animation: 'float 3s ease-in-out infinite',
    '@media (max-width: 768px)': {
      fontSize: '1.5rem'
    }
  },
  headerTitle: {
    margin: 0,
    fontSize: '1.8rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'textGlow 2s ease-in-out infinite alternate',
    '@media (max-width: 768px)': {
      fontSize: '1.4rem'
    }
  },
  lastUpdated: {
    color: '#94a3b8',
    fontSize: '0.8rem',
    fontWeight: '500',
    '@media (max-width: 768px)': {
      fontSize: '0.75rem'
    }
  },
  headerActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      width: '100%',
      justifyContent: 'space-between'
    }
  },
  exportGroup: {
    display: 'flex',
    gap: '0.5rem',
    '@media (max-width: 768px)': {
      gap: '0.25rem'
    }
  },
  securityBtn: {
    padding: '0.75rem 1rem',
    background: 'rgba(96, 165, 250, 0.1)',
    color: '#60a5fa',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '@media (max-width: 768px)': {
      padding: '0.6rem 0.8rem',
      fontSize: '0.75rem',
      flex: 1
    }
  },
  exportBtn: {
    padding: '0.75rem 1rem',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '@media (max-width: 768px)': {
      padding: '0.6rem 0.8rem',
      fontSize: '0.75rem'
    }
  },
  logoutBtn: {
    padding: '0.75rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '@media (max-width: 768px)': {
      padding: '0.6rem 0.8rem',
      fontSize: '0.75rem',
      flex: 1
    }
  },
  btnIcon: {
    fontSize: '1rem',
    '@media (max-width: 768px)': {
      fontSize: '0.9rem'
    }
  },
  statsContainer: {
    position: 'relative',
    zIndex: 5,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '0.75rem',
      marginBottom: '1rem'
    }
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1.5rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    '@media (max-width: 768px)': {
      padding: '1rem',
      borderRadius: '12px',
      gap: '0.75rem'
    }
  },
  statIcon: {
    fontSize: '2rem',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'iconPulse 2s ease-in-out infinite',
    '@media (max-width: 768px)': {
      fontSize: '1.5rem'
    }
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    fontSize: '2rem',
    margin: '0 0 0.25rem 0',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '800',
    '@media (max-width: 768px)': {
      fontSize: '1.5rem',
      margin: '0 0 0.1rem 0'
    }
  },
  statLabel: {
    margin: '0',
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    '@media (max-width: 768px)': {
      fontSize: '0.7rem'
    }
  },
  filters: {
    position: 'relative',
    zIndex: 5,
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1.5rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem',
    '@media (max-width: 768px)': {
      padding: '1rem',
      borderRadius: '12px',
      marginBottom: '1rem'
    }
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '0.75rem'
    }
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  filterLabel: {
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#e2e8f0',
    fontSize: '0.8rem',
    '@media (max-width: 768px)': {
      fontSize: '0.75rem',
      marginBottom: '0.25rem'
    }
  },
  filterInput: {
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f1f5f9',
    fontFamily: 'inherit',
    '@media (max-width: 768px)': {
      padding: '0.6rem 0.8rem',
      fontSize: '0.85rem'
    }
  },
  filterActions: {
    display: 'flex',
    gap: '0.75rem',
    '@media (max-width: 768px)': {
      gap: '0.5rem'
    }
  },
  searchButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      padding: '0.6rem 1rem',
      fontSize: '0.85rem'
    }
  },
  resetButton: {
    padding: '0.75rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      padding: '0.6rem 1rem',
      fontSize: '0.85rem'
    }
  },
  tableContainer: {
    position: 'relative',
    zIndex: 5,
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    '@media (max-width: 768px)': {
      borderRadius: '12px'
    }
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    '@media (max-width: 768px)': {
      padding: '1rem',
      flexDirection: 'column',
      gap: '0.75rem',
      alignItems: 'stretch'
    }
  },
  tableTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '@media (max-width: 768px)': {
      fontSize: '1.1rem',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.25rem'
    }
  },
  tableSubtitle: {
    color: '#94a3b8',
    fontSize: '0.8rem',
    fontWeight: '500',
    '@media (max-width: 768px)': {
      fontSize: '0.75rem'
    }
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    '@media (max-width: 768px)': {
      justifyContent: 'space-between'
    }
  },
  pageButton: {
    padding: '0.5rem 1rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    color: '#e2e8f0',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    '@media (max-width: 768px)': {
      padding: '0.4rem 0.8rem',
      fontSize: '0.75rem'
    }
  },
  pageInfo: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: '0.8rem',
    '@media (max-width: 768px)': {
      fontSize: '0.75rem'
    }
  },
  tableWrapper: {
    overflowX: 'auto',
    '@media (max-width: 768px)': {
      overflowX: 'scroll'
    }
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px'
  },
  th: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '1rem 0.75rem',
    textAlign: 'left',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    fontWeight: '700',
    color: '#e2e8f0',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    '@media (max-width: 768px)': {
      padding: '0.75rem 0.5rem',
      fontSize: '0.75rem'
    }
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s ease'
  },
  td: {
    padding: '1rem 0.75rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    verticalAlign: 'middle',
    color: '#e2e8f0',
    fontWeight: '500',
    fontSize: '0.8rem',
    '@media (max-width: 768px)': {
      padding: '0.75rem 0.5rem',
      fontSize: '0.75rem'
    }
  },
  visitorImage: {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '@media (max-width: 768px)': {
      width: '40px',
      height: '40px'
    }
  },
  noImage: {
    color: '#94a3b8',
    fontSize: '1.2rem',
    display: 'block',
    textAlign: 'center'
  },
  status: {
    padding: '0.4rem 0.8rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'inline-block',
    minWidth: '60px',
    textAlign: 'center',
    '@media (max-width: 768px)': {
      padding: '0.3rem 0.6rem',
      fontSize: '0.65rem',
      minWidth: '50px'
    }
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: '#94a3b8',
    '@media (max-width: 768px)': {
      padding: '2rem'
    }
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255, 255, 255, 0.1)',
    borderTop: '3px solid #60a5fa',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
    '@media (max-width: 768px)': {
      width: '30px',
      height: '30px'
    }
  },
  loadingText: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#94a3b8',
    '@media (max-width: 768px)': {
      fontSize: '0.9rem'
    }
  },
  noData: {
    textAlign: 'center',
    padding: '3rem',
    color: '#94a3b8',
    fontStyle: 'italic',
    fontSize: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    '@media (max-width: 768px)': {
      padding: '2rem',
      fontSize: '0.9rem'
    }
  },
  noDataIcon: {
    fontSize: '3rem',
    opacity: 0.5,
    '@media (max-width: 768px)': {
      fontSize: '2rem'
    }
  },
  noDataText: {
    fontSize: '1rem',
    fontWeight: '500',
    '@media (max-width: 768px)': {
      fontSize: '0.9rem'
    }
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1rem',
    backdropFilter: 'blur(8px)',
    animation: 'fadeIn 0.3s ease-out'
  },
  modalContent: {
    position: 'relative',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: '20px',
    padding: '2rem',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    animation: 'slideInUp 0.3s ease-out',
    '@media (max-width: 768px)': {
      padding: '1.5rem',
      borderRadius: '16px'
    }
  },
  modalHeader: {
    marginBottom: '1.5rem'
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: '0 0 0.5rem 0',
    '@media (max-width: 768px)': {
      fontSize: '1.25rem'
    }
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: '0.9rem',
    margin: 0,
    '@media (max-width: 768px)': {
      fontSize: '0.8rem'
    }
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    fontSize: '1.5rem',
    color: '#94a3b8',
    cursor: 'pointer',
    zIndex: 1001,
    transition: 'all 0.3s ease',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      width: '35px',
      height: '35px',
      top: '10px',
      right: '15px'
    }
  },
  modalImage: {
    maxWidth: '100%',
    maxHeight: '80vh',
    borderRadius: '12px',
    objectFit: 'contain',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
  },
  // Security emails styles
  securityForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  emailRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '0.5rem'
    }
  },
  emailInput: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f1f5f9',
    fontFamily: 'inherit',
    '@media (max-width: 768px)': {
      width: '100%'
    }
  },
  removeBtn: {
    padding: '0.5rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    '@media (max-width: 768px)': {
      width: '100%',
      padding: '0.6rem'
    }
  },
  securityButtonGroup: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1rem',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '0.5rem'
    }
  },
  addBtn: {
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      padding: '0.6rem'
    }
  },
  securitySubmitBtn: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      padding: '0.6rem 1rem'
    }
  },
  submitSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  successMessage: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(21, 128, 61, 0.1))',
    color: '#86efac',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    fontWeight: '500',
    fontSize: '0.9rem',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 768px)': {
      padding: '0.75rem',
      fontSize: '0.8rem'
    }
  },
  errorMessage: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(185, 28, 28, 0.1))',
    color: '#fca5a5',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    fontWeight: '500',
    fontSize: '0.9rem',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 768px)': {
      padding: '0.75rem',
      fontSize: '0.8rem'
    }
  }
};

export default Dashboard;