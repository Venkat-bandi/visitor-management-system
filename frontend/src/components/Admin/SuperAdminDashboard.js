import React, { useState } from 'react';
import { adminAPI } from '../../services/api';

const SuperAdminDashboard = () => {
  const [adminEmails, setAdminEmails] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addEmailField = () => {
    setAdminEmails([...adminEmails, '']);
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...adminEmails];
    newEmails[index] = value;
    setAdminEmails(newEmails);
  };

  const removeEmailField = (index) => {
    const newEmails = adminEmails.filter((_, i) => i !== index);
    setAdminEmails(newEmails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Filter out empty emails
      const validEmails = adminEmails.filter(email => email.trim() !== '');
      
      if (validEmails.length === 0) {
        setMessage('Please add at least one admin email');
        return;
      }

      await adminAPI.addAdminEmails(validEmails);
      setMessage('Admin emails added successfully! They can now register with these emails.');
      setAdminEmails(['']); // Reset form
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add admin emails');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Super Admin Dashboard</h2>
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          style={styles.logoutBtn}
        >
          Logout
        </button>
      </div>

      <div style={styles.card}>
        <h3>Add Admin Emails</h3>
        <p>Add email addresses that will be allowed to register as Admins. They will use these emails to complete registration.</p>
        
        {message && (
          <div style={message.includes('successfully') ? styles.success : styles.error}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {adminEmails.map((email, index) => (
            <div key={index} style={styles.emailRow}>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                style={styles.emailInput}
                required
              />
              {adminEmails.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmailField(index)}
                  style={styles.removeBtn}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={addEmailField}
              style={styles.addBtn}
            >
              + Add Another Email
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? 'Adding Emails...' : 'Save Admin Emails'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  logoutBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    margin: '0 auto'
  },
  emailRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    alignItems: 'center'
  },
  emailInput: {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  },
  removeBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem'
  },
  addBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  }
};

export default SuperAdminDashboard;