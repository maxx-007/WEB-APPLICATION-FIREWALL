import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './WAFLogin.css';

function WAFLogin({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [error, setError] = useState('');
  const scanLinesRef = useRef(null);
  const navigate = useNavigate();
  
  // Debug: Check current authentication state
  useEffect(() => {
    console.log("Current auth token:", localStorage.getItem('authToken'));
    console.log("Current user role:", localStorage.getItem('userRole'));
  }, []);
  
  // Simulate grid animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const gridElements = document.querySelectorAll('.grid-cell');
      gridElements.forEach((cell, index) => {
        setTimeout(() => {
          cell.classList.add('active');
        }, index * 20);
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginMessage('Authenticating...');
    setError('');
    
    try {
      // Simulate security scan messages
      setTimeout(() => {
        setLoginMessage('Scanning for threats...');
      }, 800);
      
      setTimeout(() => {
        setLoginMessage('Initializing WAF protection...');
      }, 1600);
      
      // Actual API call to backend
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://web-application-firewall-wqkd.onrender.com'
        : 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });
      
      let data;
      try {
        data = await response.json();
        console.log("Login response:", data);
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      // Login successful
      setLoginMessage('Access granted. Initializing dashboard...');
      
      // Store auth token
      if (data.token) {
        console.log("Setting authToken:", data.token);
        localStorage.setItem('authToken', data.token);
        
        // Store user role
        if (data.user && data.user.role) {
          console.log("Setting userRole:", data.user.role);
          localStorage.setItem('userRole', data.user.role);
        }
        
        // Check tokens were stored successfully
        console.log("Stored token:", localStorage.getItem('authToken'));
        console.log("Stored role:", localStorage.getItem('userRole'));
        console.log("LocalStorage contents:", {
          authToken: localStorage.getItem('authToken'),
          userRole: localStorage.getItem('userRole')
        });
        
        // Update App.js authentication state
        if (onLogin) {
          onLogin(data.user, data.token);
        }
        
        // Navigate immediately
        console.log("About to navigate to dashboard...");
        navigate('/dashboard');
        console.log("Navigation called");
      } else {
        throw new Error('No token received from server');
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please check credentials.');
      setLoginMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  // Create grid cells for background
  const gridCells = Array(100).fill().map((_, i) => (
    <div key={i} className="grid-cell"></div>
  ));

  return (
    <div className="waf-login-container">
      <div className="grid-background">{gridCells}</div>
      <div className="scan-lines" ref={scanLinesRef}></div>
      
      <div className="login-box">
        <div className="login-header">
          <div className="shield-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" 
                stroke="#0ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 8L10.5 14L8 11.5" 
                stroke="#0ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="login-title">WAF <span className="highlight">SHIELD</span></h1>
          <div className="login-subtitle">Web Application Firewall</div>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <div className="input-border"></div>
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="input-border"></div>
            </div>
          </div>
          
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <div className="loader">
                <div className="circle"></div>
                <div className="circle"></div>
                <div className="circle"></div>
              </div>
            ) : (
              <>
                <span className="button-text">AUTHORIZE ACCESS</span>
                <span className="button-glow"></span>
              </>
            )}
          </button>
          
          {loginMessage && (
            <div className="login-message">
              <div className="terminal-text">&gt; {loginMessage}</div>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <div className="terminal-text error">&gt; ERROR: {error}</div>
            </div>
          )}
        </form>
        
        <div className="security-status">
          <div className="status-dot"></div>
          <span>SECURITY SYSTEM ACTIVE</span>
        </div>
      </div>
      
      <div className="hexagon-decoration hex1"></div>
      <div className="hexagon-decoration hex2"></div>
      <div className="hexagon-decoration hex3"></div>
    </div>
  );
}

export default WAFLogin;