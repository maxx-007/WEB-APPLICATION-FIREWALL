import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Shield, AlertTriangle, Activity, MapPin, Clock, Server } from 'lucide-react';
import './ThreatAnalytics.css';

const ThreatAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [threatData, setThreatData] = useState({
    threatsByType: [],
    threatsByLocation: [],
    threatsTrend: [],
    topTargetedAPIs: []
  });
  const canvasRef = useRef(null);

  // Simulated data for demonstration
  useEffect(() => {
    const loadData = () => {
      // Simulated API call delay
      setTimeout(() => {
        const mockThreatsByType = [
          { name: 'SQL Injection', value: 243, color: '#03befc' },
          { name: 'XSS', value: 187, color: '#ff00ff' },
          { name: 'CSRF', value: 86, color: '#00ffaa' },
          { name: 'File Inclusion', value: 63, color: '#ffcc00' },
          { name: 'DDoS', value: 129, color: '#ff3366' }
        ];

        const mockThreatsByLocation = [
          { name: 'North America', value: 342 },
          { name: 'Europe', value: 278 },
          { name: 'Asia', value: 198 },
          { name: 'Russia', value: 164 },
          { name: 'Africa', value: 76 },
          { name: 'South America', value: 59 },
          { name: 'Australia', value: 38 }
        ];

        const mockThreatsTrend = [
          { name: 'Week 1', attacks: 143, blocked: 138 },
          { name: 'Week 2', attacks: 178, blocked: 172 },
          { name: 'Week 3', attacks: 209, blocked: 198 },
          { name: 'Week 4', attacks: 187, blocked: 179 },
          { name: 'Week 5', attacks: 235, blocked: 228 },
          { name: 'Week 6', attacks: 253, blocked: 242 },
          { name: 'Week 7', attacks: 290, blocked: 281 },
          { name: 'Week 8', attacks: 312, blocked: 304 }
        ];

        const mockTopTargetedAPIs = [
          { name: '/api/user/login', attacks: 112, endpoint: '/user/login', method: 'POST' },
          { name: '/api/data/fetch', attacks: 94, endpoint: '/data/fetch', method: 'GET' },
          { name: '/api/admin/users', attacks: 76, endpoint: '/admin/users', method: 'GET' },
          { name: '/api/payment/process', attacks: 68, endpoint: '/payment/process', method: 'POST' },
          { name: '/api/file/upload', attacks: 59, endpoint: '/file/upload', method: 'POST' }
        ];

        setThreatData({
          threatsByType: mockThreatsByType,
          threatsByLocation: mockThreatsByLocation,
          threatsTrend: mockThreatsTrend,
          topTargetedAPIs: mockTopTargetedAPIs
        });
        setIsLoading(false);
      }, 1500);
    };

    loadData();
  }, []);

  // Cyberpunk-style hexagon grid animation
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Hexagon parameters
    const hexSize = 25;
    const hexWidth = hexSize * 2;
    const hexHeight = Math.sqrt(3) * hexSize;
    const columns = Math.ceil(canvas.width / (hexWidth * 0.75)) + 1;
    const rows = Math.ceil(canvas.height / hexHeight) + 1;
    
    // Hexagon drawing function
    const drawHexagon = (x, y, size, color, alpha) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const xPos = x + size * Math.cos(angle);
        const yPos = y + size * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(xPos, yPos);
        } else {
          ctx.lineTo(xPos, yPos);
        }
      }
      ctx.closePath();
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = alpha;
      ctx.stroke();
    };
    
    // Animation loop
    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
          const offsetX = j % 2 === 0 ? 0 : hexWidth * 0.5;
          const x = i * hexWidth * 0.75 + offsetX;
          const y = j * hexHeight;
          
          // Calculate distance from center for pulsing effect
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          
          // Pulse wave based on distance and time
          const pulse = Math.sin(frame * 0.02 - distance * 0.01) * 0.5 + 0.5;
          const alpha = Math.max(0.05, pulse * 0.3);
          
          // Alternate colors for cyberpunk effect
          const hue = (distance * 0.1 + frame * 0.5) % 360;
          const color = i % 3 === 0 ? '#03befc' : (j % 2 === 0 ? '#ff00ff' : '#00ffaa');
          
          drawHexagon(x, y, hexSize, color, alpha);
        }
      }
      
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const COLORS = ['#03befc', '#ff00ff', '#00ffaa', '#ffcc00', '#ff3366', '#39c0ff', '#a64dff'];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color || entry.stroke }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="threat-analytics">
      <canvas ref={canvasRef} className="background-canvas" />
      
      <div className="panel-header">
        <div className="header-icon">
          <AlertTriangle size={28} />
        </div>
        <h2>Threat Analytics</h2>
        <span className="updated-time">Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Analyzing threat intelligence...</p>
        </div>
      ) : (
        <div className="analytics-grid">
          {/* Summary cards */}
          <div className="summary-stats">
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(3, 190, 252, 0.2)' }}>
                <Shield size={20} />
              </div>
              <div className="stat-info">
                <h3>1,293</h3>
                <p>Total Threats Detected</p>
              </div>
              <div className="stat-trend up">+18%</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 0, 255, 0.2)' }}>
                <AlertTriangle size={20} />
              </div>
              <div className="stat-info">
                <h3>92.7%</h3>
                <p>Block Rate</p>
              </div>
              <div className="stat-trend up">+3.2%</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(0, 255, 170, 0.2)' }}>
                <Activity size={20} />
              </div>
              <div className="stat-info">
                <h3>243</h3>
                <p>Advanced Threats</p>
              </div>
              <div className="stat-trend down">-5.4%</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: 'rgba(255, 51, 102, 0.2)' }}>
                <MapPin size={20} />
              </div>
              <div className="stat-info">
                <h3>37</h3>
                <p>Threat Source Countries</p>
              </div>
              <div className="stat-trend up">+2</div>
            </div>
          </div>
          
          {/* Threats by Type */}
          <div className="chart-panel threats-by-type">
            <div className="panel-title">
              <h3>Threats by Attack Type</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatData.threatsByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                  labelLine={false}
                >
                  {threatData.threatsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Threat Trend */}
          <div className="chart-panel threat-trend">
            <div className="panel-title">
              <h3>Attack Trend (8 Weeks)</h3>
              <div className="time-selector">
                <button className="active">8w</button>
                <button>12w</button>
                <button>6m</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={threatData.threatsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3254" />
                <XAxis dataKey="name" stroke="#99a8c7" />
                <YAxis stroke="#99a8c7" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="attacks" 
                  stroke="#ff00ff" 
                  strokeWidth={2}
                  dot={{ stroke: '#ff00ff', strokeWidth: 2, r: 4, fill: '#141a36' }}
                  activeDot={{ r: 6, stroke: '#ff00ff', strokeWidth: 2, fill: '#ff00ff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="blocked" 
                  stroke="#03befc" 
                  strokeWidth={2}
                  dot={{ stroke: '#03befc', strokeWidth: 2, r: 4, fill: '#141a36' }}
                  activeDot={{ r: 6, stroke: '#03befc', strokeWidth: 2, fill: '#03befc' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Top Targeted APIs */}
          <div className="chart-panel targeted-apis">
            <div className="panel-title">
              <h3>Top Targeted APIs</h3>
            </div>
            <div className="api-table-container">
              <table className="api-table">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Attack Count</th>
                    <th>Threat Level</th>
                  </tr>
                </thead>
                <tbody>
                  {threatData.topTargetedAPIs.map((api, index) => (
                    <tr key={index}>
                      <td>
                        <div className="api-name">
                          <Server size={16} />
                          <span>{api.endpoint}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`method-badge ${api.method.toLowerCase()}`}>
                          {api.method}
                        </span>
                      </td>
                      <td>{api.attacks}</td>
                      <td>
                        <div className="threat-level-indicator" data-level={getThreatLevel(api.attacks)}>
                          {getThreatLevel(api.attacks)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Threats by Location */}
          <div className="chart-panel threats-by-location">
            <div className="panel-title">
              <h3>Attack Sources by Region</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={threatData.threatsByLocation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3254" />
                <XAxis dataKey="name" stroke="#99a8c7" />
                <YAxis stroke="#99a8c7" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Attacks" radius={[4, 4, 0, 0]}>
                  {threatData.threatsByLocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to determine threat level
function getThreatLevel(attackCount) {
  if (attackCount >= 100) return 'Critical';
  if (attackCount >= 75) return 'High';
  if (attackCount >= 50) return 'Medium';
  return 'Low';
}

export default ThreatAnalytics; 