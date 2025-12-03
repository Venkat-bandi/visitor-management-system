import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { visitorAPI } from '../../services/api';
import './VisitorForm.css';

const VisitorForm = () => {
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    visitorAddress: '',
    visitorEmail: '',
    ownerName: '',
    ownerEmail: '',
    ownerMobile: '',
    flatNo: '',
    floor: '',
    bikeNumber: ''
  });
  const [visitorImage, setVisitorImage] = useState(null);
  const [bikeImage, setBikeImage] = useState(null);
  const [showVisitorCamera, setShowVisitorCamera] = useState(false);
  const [showBikeCamera, setShowBikeCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [detectedBikeNumber, setDetectedBikeNumber] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const visitorWebcamRef = useRef(null);
  const bikeWebcamRef = useRef(null);
  const formRef = useRef(null);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const captureVisitorPhoto = () => {
    const imageSrc = visitorWebcamRef.current.getScreenshot();
    setVisitorImage(imageSrc);
    setShowVisitorCamera(false);
  };

  const captureBikePhoto = async () => {
    const imageSrc = bikeWebcamRef.current.getScreenshot();
    setBikeImage(imageSrc);
    setShowBikeCamera(false);
    
    await detectBikeNumber(imageSrc);
  };

  const detectBikeNumber = async (imageData) => {
    setIsDetecting(true);
    setDetectedBikeNumber('Detecting...');
    
    try {
      const response = await fetch('http://localhost:5001/detect-bike-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.bike_number && result.bike_number !== "-") {
          const detectedNumber = result.bike_number;
          setDetectedBikeNumber(`Detected: ${detectedNumber}`);
          setFormData(prev => ({
            ...prev,
            bikeNumber: detectedNumber
          }));
        } else {
          setDetectedBikeNumber('Not detected - enter manually');
        }
      } else {
        setDetectedBikeNumber('Detection failed - enter manually');
      }
    } catch (error) {
      console.error('ML Service Error:', error.message);
      setDetectedBikeNumber('Detection failed - enter manually');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });

      if (visitorImage) {
        const visitorFile = base64ToFile(visitorImage, 'visitor.jpg');
        submitData.append('visitorImage', visitorFile);
      }

      if (bikeImage) {
        const bikeFile = base64ToFile(bikeImage, 'bike.jpg');
        submitData.append('bikeNumberImage', bikeFile);
      }

      await visitorAPI.create(submitData);
      setMessage('Visitor registered successfully! Email sent to owner.');
      
      setTimeout(() => {
        setFormData({
          visitorName: '',
          visitorPhone: '',
          visitorAddress: '',
          visitorEmail: '',
          ownerName: '',
          ownerEmail: '',
          ownerMobile: '',
          flatNo: '',
          floor: '',
          bikeNumber: ''
        });
        setVisitorImage(null);
        setBikeImage(null);
        setDetectedBikeNumber('');
      }, 2000);
      
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error submitting form');
    } finally {
      setLoading(false);
    }
  };

  const base64ToFile = (base64, filename) => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  };

  const scrollToSection = (sectionIndex) => {
    setActiveSection(sectionIndex);
    const sections = document.querySelectorAll('.form-section');
    if (sections[sectionIndex]) {
      sections[sectionIndex].scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Responsive video constraints for Webcam
  const videoConstraints = {
    width: isMobile ? 320 : 640,
    height: isMobile ? 240 : 480,
    facingMode: "user"
  };

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.animatedBackground}></div>
      
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>🏢</div>
            <h1 style={styles.headerTitle}>
              {isMobile ? 'VMS' : 'Visitor Management System'}
            </h1>
          </div>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            style={styles.logoutBtn}
            className="logout-btn"
          >
            <span style={styles.logoutText}>{isMobile ? 'Logout' : 'Logout'}</span>
            {!isMobile && <span style={styles.logoutIcon}>🚪</span>}
          </button>
        </div>
      </div>

      {/* Progress Steps - Responsive */}
      <div style={styles.progressContainer}>
        {['Visitor', 'Owner', 'Vehicle'].map((step, index) => (
          <div 
            key={index}
            style={styles.progressStep}
            className={index === activeSection ? 'active-step' : ''}
            onClick={() => scrollToSection(index)}
          >
            <div style={styles.stepNumber}>{index + 1}</div>
            <span style={styles.stepText}>
              {isMobile ? step : ['Visitor Details', 'Owner Details', 'Vehicle Info'][index]}
            </span>
          </div>
        ))}
      </div>

      {message && (
        <div style={message.includes('successfully') ? styles.successMessage : styles.errorMessage} className="message-animation">
          <div style={styles.messageContent}>
            {message.includes('successfully') ? '✅' : '❌'} {message}
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} style={styles.form}>
        {/* Section 1: Visitor Details */}
        <div className="form-section" style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>👤</div>
            <h3 style={styles.sectionTitle}>
              {isMobile ? 'Visitor Info' : 'Visitor Information'}
            </h3>
          </div>
          
          <div style={styles.row}>
            <div style={styles.inputGroup} className="input-group">
              <label style={styles.label}>Visitor Name *</label>
              <input
                type="text"
                name="visitorName"
                value={formData.visitorName}
                onChange={handleChange}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
            <div style={styles.inputGroup} className="input-group">
              <label style={styles.label}>Phone Number *</label>
              <input
                type="tel"
                name="visitorPhone"
                value={formData.visitorPhone}
                onChange={handleChange}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
          </div>

          <div style={styles.inputGroup} className="input-group">
            <label style={styles.label}>Address *</label>
            <textarea
              name="visitorAddress"
              value={formData.visitorAddress}
              onChange={handleChange}
              required
              style={styles.textarea}
              className="form-input"
            />
          </div>

          <div style={styles.inputGroup} className="input-group">
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="visitorEmail"
              value={formData.visitorEmail}
              onChange={handleChange}
              style={styles.input}
              className="form-input"
            />
          </div>

          {/* Visitor Photo Capture */}
          <div style={styles.cameraSection}>
            <label style={styles.label}>Visitor Photo *</label>
            {!showVisitorCamera ? (
              <div style={styles.cameraCard}>
                {visitorImage ? (
                  <div style={styles.previewContainer}>
                    <img src={visitorImage} alt="Visitor" style={styles.previewImage} className="preview-image" />
                    <button 
                      type="button" 
                      onClick={() => setShowVisitorCamera(true)}
                      style={styles.secondaryBtn}
                      className="btn-secondary"
                    >
                      <span style={styles.btnIcon}>🔄</span>
                      {isMobile ? 'Retake' : 'Retake Photo'}
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setShowVisitorCamera(true)}
                    style={styles.primaryBtn}
                    className="btn-primary camera-trigger"
                  >
                    <span style={styles.btnIcon}>📷</span>
                    {isMobile ? 'Take Photo' : 'Capture Visitor Photo'}
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.cameraContainer} className="camera-active">
                <Webcam
                  audio={false}
                  ref={visitorWebcamRef}
                  screenshotFormat="image/jpeg"
                  style={styles.webcam}
                  className="webcam-feed"
                  videoConstraints={videoConstraints}
                />
                <div style={styles.cameraButtons}>
                  <button 
                    type="button" 
                    onClick={() => setShowVisitorCamera(false)}
                    style={styles.secondaryBtn}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={captureVisitorPhoto}
                    style={styles.captureBtn}
                    className="btn-capture"
                  >
                    <span style={styles.btnIcon}>📸</span>
                    Capture
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Owner Details */}
        <div className="form-section" style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>🏠</div>
            <h3 style={styles.sectionTitle}>
              {isMobile ? 'Owner Info' : 'Owner & Property Details'}
            </h3>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup} className="input-group">
              <label style={styles.label}>Owner Name *</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
            <div style={styles.inputGroup} className="input-group">
              <label style={styles.label}>Owner Email *</label>
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup} className="input-group">
              <label style={styles.label}>Owner Mobile *</label>
              <input
                type="tel"
                name="ownerMobile"
                value={formData.ownerMobile}
                onChange={handleChange}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
            <div style={styles.inputGroup} className="input-group">
              <label style={styles.label}>Flat No *</label>
              <input
                type="text"
                name="flatNo"
                value={formData.flatNo}
                onChange={handleChange}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
            <div style={styles.inputGroup} className="input-group">
              <label style={styles.label}>Floor *</label>
              <input
                type="text"
                name="floor"
                value={formData.floor}
                onChange={handleChange}
                required
                style={styles.input}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Vehicle Details */}
        <div className="form-section" style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionIcon}>🚗</div>
            <h3 style={styles.sectionTitle}>
              {isMobile ? 'Vehicle Info' : 'Vehicle Information'}
            </h3>
          </div>
          
          {/* Bike Number Detection Display */}
          {detectedBikeNumber && (
            <div style={isDetecting ? styles.detectingResult : styles.detectionResult} className="detection-result">
              <div style={styles.detectionContent}>
                <strong>🚗 {isDetecting ? 'Detecting...' : 'Detection:'} </strong>
                <span style={styles.detectedNumber}>{detectedBikeNumber}</span>
              </div>
            </div>
          )}
          
          <div style={styles.inputGroup} className="input-group">
            <label style={styles.label}>Bike Number</label>
            <input
              type="text"
              name="bikeNumber"
              value={formData.bikeNumber}
              onChange={handleChange}
              style={styles.input}
              className="form-input"
              placeholder={isDetecting ? "Detecting..." : "Enter bike number"}
            />
          </div>

          {/* Bike Number Photo Capture */}
          <div style={styles.cameraSection}>
            <label style={styles.label}>Bike Photo {!isMobile && ' (Optional)'}</label>
            {!showBikeCamera ? (
              <div style={styles.cameraCard}>
                {bikeImage ? (
                  <div style={styles.previewContainer}>
                    <img src={bikeImage} alt="Bike" style={styles.previewImage} className="preview-image" />
                    <div style={styles.buttonGroup}>
                      <button 
                        type="button" 
                        onClick={() => setShowBikeCamera(true)}
                        style={styles.secondaryBtn}
                        className="btn-secondary"
                      >
                        <span style={styles.btnIcon}>🔄</span>
                        {isMobile ? 'Retake' : 'Retake Photo'}
                      </button>
                      {isDetecting && (
                        <div style={styles.detectingIndicator}>
                          <div style={styles.spinner}></div>
                          <span style={styles.detectingText}>
                            {isMobile ? 'Detecting...' : 'Detecting License Plate...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setShowBikeCamera(true)}
                    style={styles.primaryBtn}
                    className="btn-primary camera-trigger"
                    disabled={isDetecting}
                  >
                    <span style={styles.btnIcon}>📷</span>
                    {isDetecting ? 'Detecting...' : (isMobile ? 'Capture Bike' : 'Capture Bike Number')}
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.cameraContainer} className="camera-active">
                <Webcam
                  audio={false}
                  ref={bikeWebcamRef}
                  screenshotFormat="image/jpeg"
                  style={styles.webcam}
                  className="webcam-feed"
                  videoConstraints={videoConstraints}
                />
                <div style={styles.cameraButtons}>
                  <button 
                    type="button" 
                    onClick={() => setShowBikeCamera(false)}
                    style={styles.secondaryBtn}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={captureBikePhoto}
                    style={styles.captureBtn}
                    className="btn-capture"
                    disabled={isDetecting}
                  >
                    <span style={styles.btnIcon}>📸</span>
                    {isDetecting ? 'Detecting...' : 'Capture'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.submitContainer}>
          <button 
            type="submit" 
            disabled={loading || !visitorImage}
            style={styles.submitBtn}
            className={loading ? 'btn-loading' : 'btn-submit'}
          >
            {loading ? (
              <>
                <div style={styles.submitSpinner}></div>
                {isMobile ? 'Processing...' : 'Processing Registration...'}
              </>
            ) : (
              <>
                <span style={styles.btnIcon}>✅</span>
                {isMobile ? 'Submit' : 'Submit Registration'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Responsive Styles
const styles = {
  container: {
    padding: '0',
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
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '1rem 0',
    '@media (max-width: 768px)': {
      padding: '0.75rem 0'
    }
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      padding: '0 0.75rem'
    }
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    '@media (max-width: 768px)': {
      gap: '0.5rem'
    }
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
    fontSize: '1.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'textGlow 2s ease-in-out infinite alternate',
    '@media (max-width: 768px)': {
      fontSize: '1.2rem'
    }
  },
  logoutBtn: {
    padding: '0.5rem 1rem',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    '@media (max-width: 768px)': {
      padding: '0.4rem 0.8rem',
      fontSize: '0.75rem'
    }
  },
  logoutText: {
    fontSize: '0.8rem',
    '@media (max-width: 768px)': {
      fontSize: '0.75rem'
    }
  },
  logoutIcon: {
    fontSize: '0.9rem'
  },
  progressContainer: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '800px',
    margin: '1.5rem auto',
    padding: '0 1rem',
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    '@media (max-width: 768px)': {
      gap: '0.5rem',
      margin: '1rem auto'
    }
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: '0.75rem',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    minWidth: 'auto',
    flex: 1,
    '@media (max-width: 768px)': {
      padding: '0.5rem',
      gap: '0.2rem'
    }
  },
  stepNumber: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    color: '#94a3b8',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    '@media (max-width: 768px)': {
      width: '25px',
      height: '25px',
      fontSize: '0.7rem'
    }
  },
  stepText: {
    fontSize: '0.7rem',
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    '@media (max-width: 768px)': {
      fontSize: '0.65rem'
    }
  },
  successMessage: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '800px',
    margin: '1rem auto',
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(21, 128, 61, 0.2))',
    color: '#86efac',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    fontWeight: '500',
    fontSize: '0.9rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.1)',
    '@media (max-width: 768px)': {
      margin: '0.75rem 1rem',
      padding: '0.75rem',
      fontSize: '0.8rem'
    }
  },
  errorMessage: {
    position: 'relative',
    zIndex: 10,
    maxWidth: '800px',
    margin: '1rem auto',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.2))',
    color: '#fca5a5',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    fontWeight: '500',
    fontSize: '0.9rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 16px rgba(239, 68, 68, 0.1)',
    '@media (max-width: 768px)': {
      margin: '0.75rem 1rem',
      padding: '0.75rem',
      fontSize: '0.8rem'
    }
  },
  messageContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '@media (max-width: 768px)': {
      gap: '0.25rem'
    }
  },
  form: {
    position: 'relative',
    zIndex: 5,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '0 1rem 2rem',
    '@media (max-width: 768px)': {
      gap: '1rem',
      padding: '0 0.75rem 1.5rem'
    }
  },
  section: {
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '1.5rem',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    '@media (max-width: 768px)': {
      padding: '1rem',
      borderRadius: '12px'
    }
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    '@media (max-width: 768px)': {
      marginBottom: '1rem',
      gap: '0.5rem'
    }
  },
  sectionIcon: {
    fontSize: '1.5rem',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'iconPulse 2s ease-in-out infinite',
    '@media (max-width: 768px)': {
      fontSize: '1.25rem'
    }
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
    '@media (max-width: 768px)': {
      fontSize: '1.1rem'
    }
  },
  row: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      gap: '0.75rem',
      marginBottom: '0.75rem',
      flexDirection: 'column'
    }
  },
  inputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: '150px',
    '@media (max-width: 768px)': {
      minWidth: 'auto'
    }
  },
  label: {
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#e2e8f0',
    fontSize: '0.8rem',
    '@media (max-width: 768px)': {
      fontSize: '0.75rem',
      marginBottom: '0.25rem'
    }
  },
  input: {
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
  textarea: {
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    minHeight: '80px',
    resize: 'vertical',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f1f5f9',
    fontFamily: 'inherit',
    '@media (max-width: 768px)': {
      padding: '0.6rem 0.8rem',
      fontSize: '0.85rem',
      minHeight: '60px'
    }
  },
  cameraSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    '@media (max-width: 768px)': {
      marginTop: '0.75rem',
      paddingTop: '0.75rem'
    }
  },
  cameraCard: {
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    '@media (max-width: 768px)': {
      padding: '0.75rem'
    }
  },
  cameraContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1rem',
    '@media (max-width: 768px)': {
      gap: '0.75rem'
    }
  },
  cameraButtons: {
    display: 'flex',
    gap: '0.75rem',
    width: '100%',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      gap: '0.5rem'
    }
  },
  primaryBtn: {
    padding: '1rem 1.5rem',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      padding: '0.8rem 1rem',
      fontSize: '0.85rem'
    }
  },
  secondaryBtn: {
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.8rem',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      padding: '0.6rem 0.8rem',
      fontSize: '0.75rem'
    }
  },
  captureBtn: {
    padding: '0.75rem 1rem',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.8rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flex: 1,
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      padding: '0.6rem 0.8rem',
      fontSize: '0.75rem'
    }
  },
  webcam: {
    width: '100%',
    maxWidth: '500px',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    '@media (max-width: 768px)': {
      maxWidth: '100%'
    }
  },
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.75rem',
    '@media (max-width: 768px)': {
      gap: '0.5rem'
    }
  },
  previewImage: {
    width: '100%',
    maxWidth: '250px',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
    '@media (max-width: 768px)': {
      maxWidth: '200px',
      height: '120px'
    }
  },
  btnIcon: {
    fontSize: '1rem',
    '@media (max-width: 768px)': {
      fontSize: '0.9rem'
    }
  },
  submitContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1.5rem',
    '@media (max-width: 768px)': {
      marginTop: '1rem'
    }
  },
  submitBtn: {
    padding: '1.25rem 2rem',
    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '16px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '700',
    transition: 'all 0.3s ease',
    boxShadow: '0 8px 25px rgba(236, 72, 153, 0.4)',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '250px',
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      padding: '1rem 1.5rem',
      fontSize: '0.9rem',
      minWidth: '200px',
      borderRadius: '12px'
    }
  },
  submitSpinner: {
    width: '18px',
    height: '18px',
    border: '2px solid transparent',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    '@media (max-width: 768px)': {
      width: '16px',
      height: '16px'
    }
  },
  detectionResult: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(21, 128, 61, 0.1))',
    color: '#86efac',
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    fontWeight: '600',
    fontSize: '0.9rem',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 768px)': {
      padding: '0.75rem',
      fontSize: '0.8rem',
      marginBottom: '0.75rem'
    }
  },
  detectingResult: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(180, 83, 9, 0.1))',
    color: '#fcd34d',
    padding: '1rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    fontWeight: '600',
    fontSize: '0.9rem',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 768px)': {
      padding: '0.75rem',
      fontSize: '0.8rem',
      marginBottom: '0.75rem'
    }
  },
  detectionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    '@media (max-width: 768px)': {
      gap: '0.25rem'
    }
  },
  detectedNumber: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#4ade80',
    marginLeft: '0.25rem',
    '@media (max-width: 768px)': {
      fontSize: '0.9rem'
    }
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      gap: '0.5rem'
    }
  },
  detectingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: 'rgba(245, 158, 11, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    '@media (max-width: 768px)': {
      padding: '0.4rem 0.6rem',
      gap: '0.25rem'
    }
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid transparent',
    borderTop: '2px solid #f59e0b',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    '@media (max-width: 768px)': {
      width: '12px',
      height: '12px'
    }
  },
  detectingText: {
    color: '#fcd34d',
    fontWeight: '600',
    fontSize: '0.8rem',
    '@media (max-width: 768px)': {
      fontSize: '0.75rem'
    }
  }
};

export default VisitorForm;