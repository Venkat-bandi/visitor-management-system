import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hardcoded Super Admin accounts
  const SUPER_ADMINS = [
    { email: 'superadmin1@visitor.com', password: 'superadmin123', name: 'Super Admin 1', role: 'super_admin' },
    { email: 'superadmin2@visitor.com', password: 'superadmin123', name: 'Super Admin 2', role: 'super_admin' },
    { email: 'superadmin3@visitor.com', password: 'superadmin123', name: 'Super Admin 3', role: 'super_admin' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('🔄 Starting login process...');

    try {
      console.log('📤 Sending login request...');
      
      // Check if it's a hardcoded super admin
      const superAdmin = SUPER_ADMINS.find(sa => sa.email === formData.email && sa.password === formData.password);
      
      if (superAdmin) {
        console.log('✅ Super Admin login successful');
        
        const userData = {
          token: `super-admin-token-${Date.now()}`,
          user: {
            name: superAdmin.name,
            email: superAdmin.email,
            role: superAdmin.role
          }
        };
        
        // Save to localStorage
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData.user));
        
        console.log('💾 Saved to localStorage');
        console.log('👤 User role:', userData.user.role);
        
        // Redirect based on role
        window.location.href = '/super-admin';
        return;
      }

      // Regular API login for other users
      const response = await authAPI.login(formData);
      console.log('✅ Login successful:', response.data);
      
      const { token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('💾 Saved to localStorage');
      console.log('👤 User role:', user.role);
      
      // Redirect based on role
      if (user.role === 'super_admin') {
        console.log('➡️ Redirecting to super admin dashboard');
        window.location.href = '/super-admin';
      } else if (user.role === 'admin') {
        console.log('➡️ Redirecting to admin dashboard');
        window.location.href = '/admin';
      } else {
        console.log('➡️ Redirecting to security form');
        window.location.href = '/security';
      }
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('❌ Error details:', error.response?.data);
      setError(error.response?.data?.message || 'Login failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.animatedBackground}></div>
      
      <div style={styles.loginBox} className="login-container">
        <div style={styles.logoSection}>
          <div style={styles.logoIcon} className="logo-animation">🔐</div>
          <h1 style={styles.title}>
            {isMobile ? 'VMS Login' : 'Visitor Management System'}
          </h1>
          <p style={styles.subtitle}>
            Secure Access Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error} className="error-animation">
              <div style={styles.errorIcon}>⚠️</div>
              <div style={styles.errorText}>{error}</div>
            </div>
          )}
          
          <div style={styles.inputGroup} className="input-group">
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter your email"
              required
              style={styles.input}
              className="login-input"
            />
          </div>
          
          <div style={styles.inputGroup} className="input-group">
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Enter your password"
              required
              style={styles.input}
              className="login-input"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            style={styles.button}
            className={loading ? 'btn-loading' : 'btn-login'}
          >
            {loading ? (
              <>
                <div style={styles.buttonSpinner}></div>
                {isMobile ? 'Signing In...' : 'Signing In...'}
              </>
            ) : (
              <>
                <span style={styles.buttonIcon}>🚀</span>
                {isMobile ? 'Login' : 'Sign In to Dashboard'}
              </>
            )}
          </button>
        </form>
        
        <div style={styles.links}>
          <Link to="/register" style={styles.link} className="register-link">
            <span style={styles.linkIcon}>👥</span>
            {isMobile ? 'Register' : 'Register New User'}
          </Link>
        </div>
        
        <div style={styles.demo} className="demo-section">
          <div style={styles.demoIcon}>💡</div>
          <div style={styles.demoContent}>
            <p style={styles.demoTitle}><strong>Demo Version</strong></p>
            <p style={styles.demoText}>Contact administrator for login credentials</p>
          </div>
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
  loginBox: {
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
  links: {
    textAlign: 'center',
    marginBottom: '2rem',
    '@media (max-width: 768px)': {
      marginBottom: '1.5rem'
    }
  },
  link: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.95rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    border: '1px solid rgba(96, 165, 250, 0.2)',
    '@media (max-width: 768px)': {
      fontSize: '0.9rem',
      padding: '0.625rem 0.875rem'
    }
  },
  linkIcon: {
    fontSize: '1.1rem'
  },
  demo: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 768px)': {
      padding: '1.25rem',
      gap: '0.75rem',
      flexDirection: 'column',
      textAlign: 'center'
    }
  },
  demoIcon: {
    fontSize: '2rem',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    flexShrink: 0,
    '@media (max-width: 768px)': {
      fontSize: '1.75rem'
    }
  },
  demoContent: {
    flex: 1
  },
  demoTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#fcd34d',
    margin: '0 0 0.25rem 0',
    '@media (max-width: 768px)': {
      fontSize: '0.95rem'
    }
  },
  demoText: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0,
    fontWeight: '500',
    '@media (max-width: 768px)': {
      fontSize: '0.85rem'
    }
  }
};

export default Login;