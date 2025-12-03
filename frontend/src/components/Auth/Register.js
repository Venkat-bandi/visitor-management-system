import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'security' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('📤 Sending registration request...');
      
      const response = await authAPI.register(formData);
      console.log('✅ Registration successful:', response.data);
      
      setSuccess(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} registered successfully! Redirecting to login...`);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.animatedBackground}></div>
      
      <div style={styles.registerBox} className="register-container">
        <div style={styles.logoSection}>
          <div style={styles.logoIcon} className="logo-animation">👥</div>
          <h1 style={styles.title}>
            {isMobile ? 'Register User' : 'Register New User'}
          </h1>
          <p style={styles.subtitle}>
            Create new system account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error} className="error-animation">
              <div style={styles.errorIcon}>⚠️</div>
              <div style={styles.errorText}>{error}</div>
            </div>
          )}
          
          {success && (
            <div style={styles.success} className="success-animation">
              <div style={styles.successIcon}>✅</div>
              <div style={styles.successText}>{success}</div>
            </div>
          )}
          
          <div style={styles.inputGroup} className="input-group">
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={styles.input}
              className="register-input"
              required
            />
          </div>
          
          <div style={styles.inputGroup} className="input-group">
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={styles.input}
              className="register-input"
              required
            />
          </div>
          
          <div style={styles.inputGroup} className="input-group">
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Create secure password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={styles.input}
              className="register-input"
              required
            />
          </div>
          
          <div style={styles.inputGroup} className="input-group">
            <label style={styles.label}>User Role</label>
            <select 
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              style={styles.select}
              className="role-select"
            >
              <option value="admin">Admin</option>
              <option value="security">Security Staff</option>
            </select>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            style={styles.button}
            className={loading ? 'btn-loading' : 'btn-register'}
          >
            {loading ? (
              <>
                <div style={styles.buttonSpinner}></div>
                {isMobile ? 'Creating...' : 'Creating Account...'}
              </>
            ) : (
              <>
                <span style={styles.buttonIcon}>🚀</span>
                {isMobile ? 'Register' : 'Register User'}
              </>
            )}
          </button>
        </form>

        <div style={styles.backLink}>
          <button 
            onClick={() => navigate('/login')}
            style={styles.backButton}
            className="btn-back"
          >
            <span style={styles.backIcon}>←</span>
            {isMobile ? 'Back to Login' : 'Back to Login Page'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Responsive Styles
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '1rem'
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
  registerBox: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '2.5rem',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    width: '100%',
    maxWidth: '480px',
    backdropFilter: 'blur(20px)',
    animation: 'slideInUp 0.6s ease-out',
    '@media (max-width: 768px)': {
      padding: '2rem 1.5rem',
      borderRadius: '20px',
      maxWidth: '400px'
    }
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '2rem',
    '@media (max-width: 768px)': {
      marginBottom: '1.5rem'
    }
  },
  logoIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    animation: 'float 3s ease-in-out infinite',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    '@media (max-width: 768px)': {
      fontSize: '3rem',
      marginBottom: '0.75rem'
    }
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'textGlow 2s ease-in-out infinite alternate',
    '@media (max-width: 768px)': {
      fontSize: '1.5rem'
    }
  },
  subtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    margin: 0,
    fontWeight: '500',
    '@media (max-width: 768px)': {
      fontSize: '0.9rem'
    }
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
    '@media (max-width: 768px)': {
      gap: '1.25rem',
      marginBottom: '1.5rem'
    }
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 768px)': {
      padding: '0.875rem 1rem',
      gap: '0.5rem'
    }
  },
  errorIcon: {
    fontSize: '1.2rem',
    flexShrink: 0
  },
  errorText: {
    fontSize: '0.9rem',
    fontWeight: '500',
    flex: 1,
    '@media (max-width: 768px)': {
      fontSize: '0.85rem'
    }
  },
  success: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    color: '#86efac',
    padding: '1rem 1.25rem',
    borderRadius: '12px',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 768px)': {
      padding: '0.875rem 1rem',
      gap: '0.5rem'
    }
  },
  successIcon: {
    fontSize: '1.2rem',
    flexShrink: 0
  },
  successText: {
    fontSize: '0.9rem',
    fontWeight: '500',
    flex: 1,
    '@media (max-width: 768px)': {
      fontSize: '0.85rem'
    }
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: '0.25rem',
    '@media (max-width: 768px)': {
      fontSize: '0.85rem'
    }
  },
  input: {
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#f1f5f9',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 768px)': {
      padding: '0.875rem 1rem',
      fontSize: '0.95rem'
    }
  },
  select: {
    padding: '1rem 1.25rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#f1f5f9',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    backdropFilter: 'blur(10px)',
    cursor: 'pointer',
    '@media (max-width: 768px)': {
      padding: '0.875rem 1rem',
      fontSize: '0.95rem'
    }
  },
  button: {
    padding: '1.25rem 2rem',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '1.1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginTop: '0.5rem',
    '@media (max-width: 768px)': {
      padding: '1.125rem 1.5rem',
      fontSize: '1rem',
      borderRadius: '14px'
    }
  },
  buttonSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    '@media (max-width: 768px)': {
      width: '18px',
      height: '18px'
    }
  },
  buttonIcon: {
    fontSize: '1.2rem'
  },
  backLink: {
    textAlign: 'center'
  },
  backButton: {
    padding: '0.875rem 1.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: '100%',
    '@media (max-width: 768px)': {
      padding: '0.75rem 1.25rem',
      fontSize: '0.9rem'
    }
  },
  backIcon: {
    fontSize: '1.1rem'
  }
};

export default Register;