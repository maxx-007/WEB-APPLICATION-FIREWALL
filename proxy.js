const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Import models for traffic logging
let TrafficLog;
try {
  TrafficLog = require('./models/trafficLog');
  console.log('✅ TrafficLog model loaded for traffic monitoring');
} catch (error) {
  console.warn('⚠️ TrafficLog model not available, using in-memory fallback:', error.message);
  // We'll use in-memory logging as fallback
}

// Import the firewall middleware and rate limiter
let firewallMiddleware, limiter;
try {
  const firewall = require('./middleware/firewall');
  firewallMiddleware = firewall.firewallMiddleware;
  limiter = firewall.limiter;
  console.log('✅ Firewall middleware loaded successfully');
} catch (error) {
  console.error('❌ Error loading firewall middleware:', error.message);
  // Create dummy middleware functions that just pass through requests
  firewallMiddleware = (req, res, next) => {
    console.log(`⚠️ WAF DISABLED - Passing request to target: ${req.method} ${req.path}`);
    next();
  };
  limiter = (req, res, next) => next();
}

const app = express();

// More permissive CORS configuration
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:8080', 'http://localhost:5001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Access-Control-Allow-Origin', 'Origin', 'Accept']
}));

// Basic middleware setup - parse both JSON and URL-encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Apply WAF firewall middleware before forwarding requests
// Wrap in try/catch to prevent server crashes
app.use((req, res, next) => {
  try {
    limiter(req, res, next);
  } catch (error) {
    console.error('❌ Rate limiter error:', error.message);
    next(); // Continue even if rate limiter fails
  }
});

// Create traffic logger middleware to log all traffic going through the WAF
app.use((req, res, next) => {
  // Record start time for response time calculation
  const startTime = Date.now();
  
  // Store original end method to intercept and log when the response finishes
  const originalEnd = res.end;
  
  // Override end method
  res.end = function(...args) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Get client IP
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Get requested path
    const requestPath = req.originalUrl;
    
    // Get request method
    const requestMethod = req.method;
    
    // Get status code
    const statusCode = res.statusCode;
    
    // Get user agent
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // Try to log traffic to MongoDB if available
    try {
      if (typeof TrafficLog !== 'undefined') {
        // Add to MongoDB
        TrafficLog.create({
          ip_address: clientIP,
          request_path: requestPath,
          request_method: requestMethod,
          status_code: statusCode,
          response_time_ms: responseTime,
          user_agent: userAgent,
          origin: 'CatchPhish via WAF',
          timestamp: new Date(),
          waf_status: 'MONITORED' // Traffic that went through the WAF proxy
        }).catch(err => {
          // Silently catch errors to prevent affecting response flow
          console.debug('Traffic logging to MongoDB failed:', err.message);
        });
      }
      
      // Also log to memory for recent traffic display (optional - for quick access)
      if (!global.recentTraffic) {
        global.recentTraffic = [];
      }
      
      // Add to memory buffer (keep last 100 requests)
      global.recentTraffic.unshift({
        timestamp: new Date(),
        ip: clientIP,
        method: requestMethod,
        path: requestPath,
        status: statusCode,
        responseTime: responseTime,
        userAgent: userAgent
      });
      
      // Keep only the most recent 100 requests
      if (global.recentTraffic.length > 100) {
        global.recentTraffic.pop();
      }
      
    } catch (error) {
      // Ignore any errors from traffic logging
      console.debug('Traffic logging error:', error.message);
    }
    
    // Call the original end method
    return originalEnd.apply(this, args);
  };
  
  // Continue to next middleware
  next();
});

// Add an endpoint to get recent traffic
app.get('/waf-traffic', (req, res) => {
  // Initialize with dummy data if no traffic exists yet
  if (!global.recentTraffic || global.recentTraffic.length === 0) {
    console.log('Generating demo traffic data for visualization');
    global.recentTraffic = generateDemoTrafficData();
  }
  
  // Return the recent traffic from memory
  res.json({
    count: global.recentTraffic ? global.recentTraffic.length : 0,
    traffic: global.recentTraffic || []
  });
});

// Function to generate demo traffic data
function generateDemoTrafficData() {
  const demoTraffic = [];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const statusCodes = [200, 201, 304, 400, 401, 403, 404, 500];
  const paths = [
    '/',
    '/login',
    '/dashboard',
    '/api/users/check-session',
    '/api/users/login',
    '/api/phishing/report',
    '/api/admin/stats',
    '/assets/main.js',
    '/assets/styles.css',
    '/wp-admin/index.php', // Suspicious path
    '/admin/config.php',    // Suspicious path
    '/api/users?id=1%27%20OR%20%271%27=%271', // SQL injection attempt
    '/../../../etc/passwd',  // Path traversal attempt
  ];
  const ips = ['192.168.1.100', '10.0.0.15', '172.16.0.32', '127.0.0.1', '45.33.32.156', '209.58.169.218'];
  
  // Generate 50 random traffic entries
  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(Date.now() - Math.floor(Math.random() * 3600000)); // Within the last hour
    const method = methods[Math.floor(Math.random() * methods.length)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    // Higher status code probability for suspicious paths
    let status = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    if (path.includes('wp-admin') || path.includes('admin/config') || 
        path.includes('%27') || path.includes('/../')) {
      status = Math.random() > 0.3 ? 403 : status; // 70% chance of being blocked
    }
    
    demoTraffic.push({
      timestamp,
      ip: ips[Math.floor(Math.random() * ips.length)],
      method,
      path,
      status,
      responseTime: Math.floor(Math.random() * 500) + 10, // 10-510ms
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
  }
  
  // Sort by timestamp, newest first
  return demoTraffic.sort((a, b) => b.timestamp - a.timestamp);
}

// Apply the firewall middleware after the traffic logger
app.use((req, res, next) => {
  try {
    firewallMiddleware(req, res, next);
  } catch (error) {
    console.error('❌ Firewall middleware error:', error.message);
    next(); // Continue even if WAF fails
  }
});

// Add headers to solve CORS issues - also handle preflight for all routes
app.use((req, res, next) => {
  // Set proper CORS headers when proxying
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:8080');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Add Content Security Policy headers to allow resources
  res.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws: wss: http: https:; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-src 'self'; object-src 'none'");
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Special handling for API routes that match the exact pattern causing problems
app.use(['/api/users/check-session', '/api/users/login'], (req, res, next) => {
  console.log(`🔒 Special handling for auth route: ${req.method} ${req.path}`);
  
  // Check if the request is already to our proxy (to prevent infinite loops)
  const referer = req.headers.referer || '';
  if (referer.includes(':8080/')) {
    console.log(`Direct proxy for auth route on port 8080`);
    return next();
  }
  
  // Direct proxy to API server for these specific routes
  const targetUrl = `http://localhost:5001${req.path}`;
  
  // For OPTIONS requests, respond directly
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:8080');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    return res.status(200).end();
  }
  
  // Use the http-proxy-middleware for these special routes too
  return apiProxy(req, res, next);
});

// Set up API proxy to handle requests to the API server at port 5001
const apiProxy = createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
  secure: false,
  xfwd: true,
  cookieDomainRewrite: 'localhost',
  onProxyReq: (proxyReq, req, res) => {
    const logPrefix = req.path.includes('/users/login') ? '🔑 Auth' : '🔄 API';
    console.log(`${logPrefix} request to backend: ${req.method} ${req.path}`);
    
    // Remove encoding headers to prevent compression issues
    proxyReq.removeHeader('accept-encoding');
    
    // Add headers that the API server expects
    proxyReq.setHeader('host', 'localhost:5001');
    proxyReq.setHeader('origin', 'http://localhost:3001'); // This is critical for the API to accept the request
    
    // If body-parser consumed the body, we need to restream it
    if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      // Write the body to the request
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Fix CORS headers in the response - force origin to match the WAF proxy
    proxyRes.headers['access-control-allow-origin'] = req.headers.origin || 'http://localhost:8080';
    proxyRes.headers['access-control-allow-credentials'] = 'true';
    
    // Remove content-encoding to prevent browser decompression errors
    delete proxyRes.headers['content-encoding'];
    
    // Handle cookies for authentication
    if (proxyRes.headers['set-cookie']) {
      const cookies = proxyRes.headers['set-cookie'];
      // Rewrite the domain and secure attributes for our proxy
      const rewrittenCookies = cookies.map(cookie => {
        return cookie
          .replace(/Domain=localhost:5001/gi, 'Domain=localhost:8080')
          .replace(/secure;/gi, ''); // Remove secure flag for local development
      });
      proxyRes.headers['set-cookie'] = rewrittenCookies;
    }
    
    const logPrefix = req.path.includes('/users/login') ? '🔑 Auth' : '🔄 API';
    console.log(`${logPrefix} response: ${proxyRes.statusCode} for ${req.method} ${req.path}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    
    // Check if the error is because CatchPhish is not running
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to CatchPhish on port 3001. Is it running?');
      
      // Send an HTML response with helpful information
      res.writeHead(503, {
        'Content-Type': 'text/html'
      });
      
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WAF Proxy - Target Application Unavailable</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 40px;
              background: #f0f4f8;
              color: #333;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #e74c3c; }
            h2 { color: #3498db; }
            pre {
              background: #f8f8f8;
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
            }
            .step {
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #eee;
            }
            .warning { color: #e74c3c; }
            .info { color: #2980b9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ WAF Proxy: Target Application Not Available</h1>
            
            <div class="warning">
              <p>The WAF Proxy is running correctly, but cannot connect to the CatchPhish application on port 3001.</p>
            </div>
            
            <h2>Troubleshooting Steps</h2>
            
            <div class="step">
              <h3>1. Check if CatchPhish is running</h3>
              <p>Verify that your CatchPhish application is running on port 3001.</p>
              <pre>netstat -ano | findstr :3001</pre>
              <p>If nothing shows up, your CatchPhish application is not running.</p>
            </div>
            
            <div class="step">
              <h3>2. Start your CatchPhish application</h3>
              <p>Navigate to your CatchPhish project directory and start the application:</p>
              <pre>cd path/to/catchphish
npm start</pre>
            </div>
            
            <div class="step">
              <h3>3. Check if the API server is running</h3>
              <p>Your CatchPhish application requires an API server on port 5001.</p>
              <pre>netstat -ano | findstr :5001</pre>
              <p>Make sure both the frontend and API server are running.</p>
            </div>
            
            <div class="info">
              <p>Once your CatchPhish application is running, refresh this page to access it through the WAF.</p>
              <p>The WAF Proxy is currently listening on port 8080.</p>
              <p><a href="/waf-admin" style="color: #3498db; text-decoration: none; font-weight: bold;">Go to WAF Admin Dashboard</a></p>
            </div>
          </div>
        </body>
        </html>
      `);
    } else {
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
      res.end('Proxy error: Could not connect to CatchPhish application');
    }
  }
});

// Disable MongoDB logging errors to reduce console spam
if (process.env.DISABLE_MONGO_LOGGING === 'true') {
  console.log('ℹ️ MongoDB logging disabled to reduce console noise');
  
  // Handle MongoDB buffering timeout errors
  process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message && 
        (reason.message.includes('buffering timed out') || 
         reason.message.includes('MongooseError'))) {
      // Silently ignore mongoose connection errors
      return;
    }
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  // Create a simple wrapper to silence MongoDB errors
  const originalConsoleError = console.error;
  console.error = function(msg, ...args) {
    // Skip MongoDB-related errors to reduce console spam
    if (msg && typeof msg === 'string' && 
        (msg.includes('MongooseError') || 
         msg.includes('MongoDB') || 
         msg.includes('mongoose') ||
         msg.includes('buffering timed out'))) {
      // Just return without logging
      return;
    }
    originalConsoleError(msg, ...args);
  };
}

// Add a WAF dashboard to view live traffic
app.get('/waf-dashboard', (req, res) => {
  const dashboardHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WAF Traffic Dashboard</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0a0e17;
          color: #e0e0e0;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #2a3a5a;
          margin-bottom: 20px;
        }
        h1 {
          color: #42a5f5;
          margin: 0;
        }
        .status {
          display: flex;
          align-items: center;
        }
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #4caf50;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }
        .stats-row {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .stat-card {
          background-color: #1a2233;
          border-radius: 8px;
          padding: 15px;
          width: calc(25% - 20px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 15px;
        }
        .stat-title {
          color: #7986cb;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
        }
        .traffic-container {
          background-color: #1a2233;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }
        .traffic-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        .traffic-title {
          font-size: 18px;
          color: #42a5f5;
          margin: 0;
        }
        .refresh-btn {
          background-color: #2a3a5a;
          color: #e0e0e0;
          border: none;
          border-radius: 4px;
          padding: 8px 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        .refresh-btn:hover {
          background-color: #3a4a6a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #2a3a5a;
        }
        th {
          background-color: #212c42;
          color: #7986cb;
        }
        tr:hover {
          background-color: #212c42;
        }
        .method {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        .get {
          background-color: #2e7d32;
          color: white;
        }
        .post {
          background-color: #1565c0;
          color: white;
        }
        .put {
          background-color: #ff8f00;
          color: white;
        }
        .delete {
          background-color: #c62828;
          color: white;
        }
        .status-code {
          font-weight: bold;
        }
        .status-200 {
          color: #4caf50;
        }
        .status-300 {
          color: #2196f3;
        }
        .status-400 {
          color: #ff9800;
        }
        .status-500 {
          color: #f44336;
        }
        .timestamp {
          color: #9e9e9e;
          font-size: 12px;
        }
        footer {
          text-align: center;
          margin-top: 20px;
          color: #9e9e9e;
          font-size: 12px;
        }
        @media (max-width: 768px) {
          .stat-card {
            width: calc(50% - 15px);
          }
          .container {
            padding: 0 10px;
          }
        }
        .pagination {
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }
        .pagination button {
          background-color: #2a3a5a;
          color: #e0e0e0;
          border: none;
          padding: 8px 15px;
          margin: 0 5px;
          cursor: pointer;
          border-radius: 4px;
        }
        .pagination button:hover {
          background-color: #3a4a6a;
        }
        .pagination button:disabled {
          background-color: #1a2233;
          color: #666;
          cursor: not-allowed;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>WAF Traffic Dashboard</h1>
          <div class="status">
            <div class="status-dot"></div>
            <span>WAF Active - Port ${PORT}</span>
          </div>
        </header>
        
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-title">TOTAL REQUESTS</div>
            <div class="stat-value" id="total-requests">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">REQUESTS TODAY</div>
            <div class="stat-value" id="requests-today">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">BLOCKED ATTACKS</div>
            <div class="stat-value" id="blocked-attacks">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">AVG RESPONSE TIME</div>
            <div class="stat-value" id="avg-response-time">0 ms</div>
          </div>
        </div>
        
        <div class="traffic-container">
          <div class="traffic-header">
            <h2 class="traffic-title">Live Traffic</h2>
            <button class="refresh-btn" id="refresh-btn">
              <span>Refresh</span>
            </button>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>IP Address</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
                <th>Response Time</th>
              </tr>
            </thead>
            <tbody id="traffic-table">
              <tr>
                <td colspan="6" style="text-align: center;">Loading traffic data...</td>
              </tr>
            </tbody>
          </table>
          
          <div class="pagination">
            <button id="prev-page" disabled>Previous</button>
            <button id="next-page" disabled>Next</button>
          </div>
        </div>
        
        <footer>
          WAF Defender - Protecting CatchPhish Application ©${new Date().getFullYear()}
        </footer>
      </div>
      
      <script>
        let trafficData = [];
        let currentPage = 1;
        const itemsPerPage = 10;
        
        function formatTimestamp(timestamp) {
          const date = new Date(timestamp);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        
        function formatDate(timestamp) {
          const date = new Date(timestamp);
          return date.toLocaleDateString();
        }
        
        function getStatusClass(status) {
          if (status >= 500) return 'status-500';
          if (status >= 400) return 'status-400';
          if (status >= 300) return 'status-300';
          return 'status-200';
        }
        
        function getMethodClass(method) {
          const methodLower = method.toLowerCase();
          if (methodLower === 'get') return 'get';
          if (methodLower === 'post') return 'post';
          if (methodLower === 'put') return 'put';
          if (methodLower === 'delete') return 'delete';
          return '';
        }
        
        function updateTrafficTable() {
          const tableBody = document.getElementById('traffic-table');
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const pageData = trafficData.slice(startIndex, endIndex);
          
          // Enable/disable pagination buttons
          document.getElementById('prev-page').disabled = currentPage === 1;
          document.getElementById('next-page').disabled = endIndex >= trafficData.length;
          
          if (pageData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No traffic data available</td></tr>';
            return;
          }
          
          let html = '';
          pageData.forEach(item => {
            html += '<tr>' +
              '<td class="timestamp">' + formatTimestamp(item.timestamp) + '</td>' +
              '<td>' + item.ip + '</td>' +
              '<td><span class="method ' + getMethodClass(item.method) + '">' + item.method + '</span></td>' +
              '<td>' + item.path + '</td>' +
              '<td><span class="status-code ' + getStatusClass(item.status) + '">' + item.status + '</span></td>' +
              '<td>' + item.responseTime + ' ms</td>' +
              '</tr>';
          });
          
          tableBody.innerHTML = html;
        }
        
        function updateStats() {
          document.getElementById('total-requests').textContent = trafficData.length;
          
          // Calculate requests today
          const today = new Date().toDateString();
          const requestsToday = trafficData.filter(item => 
            new Date(item.timestamp).toDateString() === today
          ).length;
          document.getElementById('requests-today').textContent = requestsToday;
          
          // Calculate blocked attacks (status 403)
          const blockedAttacks = trafficData.filter(item => item.status === 403).length;
          document.getElementById('blocked-attacks').textContent = blockedAttacks;
          
          // Calculate average response time
          if (trafficData.length > 0) {
            const totalResponseTime = trafficData.reduce((sum, item) => sum + item.responseTime, 0);
            const avgResponseTime = Math.round(totalResponseTime / trafficData.length);
            document.getElementById('avg-response-time').textContent = avgResponseTime + ' ms';
          }
        }
        
        function fetchTrafficData() {
          fetch('/waf-traffic')
            .then(response => response.json())
            .then(data => {
              trafficData = data.traffic;
              updateTrafficTable();
              updateStats();
            })
            .catch(error => {
              console.error('Error fetching traffic data:', error);
              document.getElementById('traffic-table').innerHTML = 
                '<tr><td colspan="6" style="text-align: center;">Error loading traffic data</td></tr>';
            });
        }
        
        // Fetch data on load
        fetchTrafficData();
        
        // Set up auto-refresh timer (every 5 seconds)
        setInterval(fetchTrafficData, 5000);
        
        // Set up manual refresh button
        document.getElementById('refresh-btn').addEventListener('click', fetchTrafficData);
        
        // Set up pagination
        document.getElementById('prev-page').addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            updateTrafficTable();
          }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
          if ((currentPage * itemsPerPage) < trafficData.length) {
            currentPage++;
            updateTrafficTable();
          }
        });
      </script>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(dashboardHtml);
});

// Apply the proxies to different routes
app.use('/api', apiProxy); // Match API requests first

// Add login route redirect handler
app.get('/login', (req, res) => {
  console.log('Redirecting login route to root');
  res.redirect('/');
});

// Add favicon route handler to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  // Set proper content type
  res.setHeader('Content-Type', 'image/x-icon');
  // Serve empty response with 204 status (no content)
  res.status(204).end();
});

// Add a dedicated WAF admin dashboard route
app.get('/waf-admin', (req, res) => {
  console.log('Accessing WAF Admin Dashboard');
  const wafDashboardHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WAF Admin Dashboard</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0a0e17;
          color: #e0e0e0;
          margin: 0;
          padding: 0;
        }
        .layout {
          display: flex;
          height: 100vh;
        }
        .sidebar {
          width: 240px;
          background-color: #1a2233;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
          padding: 20px 0;
        }
        .sidebar-header {
          padding: 0 20px 20px;
          border-bottom: 1px solid #2a3a5a;
        }
        .logo {
          color: #42a5f5;
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        .status-indicator {
          display: flex;
          align-items: center;
          margin-top: 10px;
        }
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #4caf50;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { box-shadow: 0 0 0 5px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        .nav-items {
          list-style: none;
          padding: 0;
          margin: 20px 0;
        }
        .nav-item {
          padding: 10px 20px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .nav-item:hover {
          background-color: #212c42;
        }
        .nav-item.active {
          background-color: #212c42;
          border-left: 3px solid #42a5f5;
        }
        .nav-item a {
          color: #e0e0e0;
          text-decoration: none;
          display: flex;
          align-items: center;
        }
        .nav-item i {
          margin-right: 10px;
          font-size: 18px;
          width: 24px;
          text-align: center;
        }
        .content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .page-title {
          font-size: 24px;
          margin: 0;
        }
        .stats-row {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .stat-card {
          background-color: #1a2233;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: calc(25% - 20px);
          margin-bottom: 20px;
        }
        .stat-title {
          color: #7986cb;
          font-size: 14px;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: bold;
        }
        .traffic-container {
          background-color: #1a2233;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 20px;
        }
        .traffic-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background-color: #212c42;
          border-bottom: 1px solid #2a3a5a;
        }
        .traffic-title {
          font-size: 18px;
          color: #42a5f5;
          margin: 0;
        }
        .action-buttons {
          display: flex;
          gap: 10px;
        }
        .refresh-btn, .filter-btn {
          background-color: #2a3a5a;
          color: #e0e0e0;
          border: none;
          border-radius: 4px;
          padding: 8px 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        .refresh-btn:hover, .filter-btn:hover {
          background-color: #3a4a6a;
        }
        .refresh-btn i, .filter-btn i {
          margin-right: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #2a3a5a;
        }
        th {
          background-color: #212c42;
          color: #7986cb;
          font-weight: normal;
        }
        tr:hover {
          background-color: #212c42;
        }
        .method {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        .get {
          background-color: #2e7d32;
          color: white;
        }
        .post {
          background-color: #1565c0;
          color: white;
        }
        .put {
          background-color: #ff8f00;
          color: white;
        }
        .delete {
          background-color: #c62828;
          color: white;
        }
        .status-code {
          font-weight: bold;
        }
        .status-200 {
          color: #4caf50;
        }
        .status-300 {
          color: #2196f3;
        }
        .status-400 {
          color: #ff9800;
        }
        .status-500 {
          color: #f44336;
        }
        .timestamp {
          color: #9e9e9e;
          font-size: 12px;
        }
        .pagination {
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }
        .pagination button {
          background-color: #2a3a5a;
          color: #e0e0e0;
          border: none;
          padding: 8px 15px;
          margin: 0 5px;
          cursor: pointer;
          border-radius: 4px;
        }
        .pagination button:hover {
          background-color: #3a4a6a;
        }
        .pagination button:disabled {
          background-color: #1a2233;
          color: #666;
          cursor: not-allowed;
        }
        .app-info {
          background-color: #1a2233;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-top: 20px;
        }
        .app-info h3 {
          color: #42a5f5;
          margin-top: 0;
        }
        .info-row {
          display: flex;
          margin-bottom: 10px;
        }
        .info-label {
          width: 150px;
          color: #7986cb;
        }
        .info-value {
          flex: 1;
        }
        .health-up {
          color: #4caf50;
          font-weight: bold;
        }
        .health-down {
          color: #f44336;
          font-weight: bold;
        }
      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css">
    </head>
    <body>
      <div class="layout">
        <div class="sidebar">
          <div class="sidebar-header">
            <h1 class="logo">WAF Admin</h1>
            <div class="status-indicator">
              <div class="status-dot"></div>
              <span>WAF Active - Port ${PORT}</span>
            </div>
          </div>
          <ul class="nav-items">
            <li class="nav-item active">
              <a href="#"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
            </li>
            <li class="nav-item">
              <a href="#"><i class="fas fa-exchange-alt"></i> Traffic</a>
            </li>
            <li class="nav-item">
              <a href="#"><i class="fas fa-shield-alt"></i> Security</a>
            </li>
            <li class="nav-item">
              <a href="#"><i class="fas fa-bell"></i> Alerts</a>
            </li>
            <li class="nav-item">
              <a href="#"><i class="fas fa-cog"></i> Settings</a>
            </li>
            <li class="nav-item">
              <a href="/"><i class="fas fa-external-link-alt"></i> CatchPhish App</a>
            </li>
          </ul>
        </div>
        <div class="content">
          <div class="header">
            <h2 class="page-title">WAF Dashboard</h2>
            <div class="health-indicator" id="health-indicator">Checking health...</div>
          </div>
          
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-title">TOTAL REQUESTS</div>
              <div class="stat-value" id="total-requests">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">REQUESTS TODAY</div>
              <div class="stat-value" id="requests-today">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">BLOCKED ATTACKS</div>
              <div class="stat-value" id="blocked-attacks">0</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">AVG RESPONSE TIME</div>
              <div class="stat-value" id="avg-response-time">0 ms</div>
            </div>
          </div>
          
          <div class="traffic-container">
            <div class="traffic-header">
              <h2 class="traffic-title">Live Traffic</h2>
              <div class="action-buttons">
                <button class="refresh-btn" id="refresh-btn">
                  <i class="fas fa-sync-alt"></i> Refresh
                </button>
                <button class="filter-btn">
                  <i class="fas fa-filter"></i> Filter
                </button>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>IP Address</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Status</th>
                  <th>Response Time</th>
                </tr>
              </thead>
              <tbody id="traffic-table">
                <tr>
                  <td colspan="6" style="text-align: center;">Loading traffic data...</td>
                </tr>
              </tbody>
            </table>
            
            <div class="pagination">
              <button id="prev-page" disabled>Previous</button>
              <button id="next-page" disabled>Next</button>
            </div>
          </div>
          
          <div class="app-info" id="app-info">
            <h3>Protected Application Status</h3>
            <div class="info-row">
              <div class="info-label">CatchPhish Frontend:</div>
              <div class="info-value" id="frontend-status">Checking...</div>
            </div>
            <div class="info-row">
              <div class="info-label">CatchPhish API:</div>
              <div class="info-value" id="api-status">Checking...</div>
            </div>
            <div class="info-row">
              <div class="info-label">WAF Uptime:</div>
              <div class="info-value" id="waf-uptime">Calculating...</div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        let trafficData = [];
        let currentPage = 1;
        const itemsPerPage = 10;
        
        function formatTimestamp(timestamp) {
          const date = new Date(timestamp);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        
        function formatDate(timestamp) {
          const date = new Date(timestamp);
          return date.toLocaleDateString();
        }
        
        function getStatusClass(status) {
          if (status >= 500) return 'status-500';
          if (status >= 400) return 'status-400';
          if (status >= 300) return 'status-300';
          return 'status-200';
        }
        
        function getMethodClass(method) {
          const methodLower = method.toLowerCase();
          if (methodLower === 'get') return 'get';
          if (methodLower === 'post') return 'post';
          if (methodLower === 'put') return 'put';
          if (methodLower === 'delete') return 'delete';
          return '';
        }
        
        function updateTrafficTable() {
          const tableBody = document.getElementById('traffic-table');
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const pageData = trafficData.slice(startIndex, endIndex);
          
          // Enable/disable pagination buttons
          document.getElementById('prev-page').disabled = currentPage === 1;
          document.getElementById('next-page').disabled = endIndex >= trafficData.length;
          
          if (pageData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No traffic data available</td></tr>';
            return;
          }
          
          let html = '';
          pageData.forEach(item => {
            html += '<tr>' +
              '<td class="timestamp">' + formatTimestamp(item.timestamp) + '</td>' +
              '<td>' + item.ip + '</td>' +
              '<td><span class="method ' + getMethodClass(item.method) + '">' + item.method + '</span></td>' +
              '<td>' + item.path + '</td>' +
              '<td><span class="status-code ' + getStatusClass(item.status) + '">' + item.status + '</span></td>' +
              '<td>' + item.responseTime + ' ms</td>' +
              '</tr>';
          });
          
          tableBody.innerHTML = html;
        }
        
        function updateStats() {
          document.getElementById('total-requests').textContent = trafficData.length;
          
          // Calculate requests today
          const today = new Date().toDateString();
          const requestsToday = trafficData.filter(item => 
            new Date(item.timestamp).toDateString() === today
          ).length;
          document.getElementById('requests-today').textContent = requestsToday;
          
          // Calculate blocked attacks (status 403)
          const blockedAttacks = trafficData.filter(item => item.status === 403).length;
          document.getElementById('blocked-attacks').textContent = blockedAttacks;
          
          // Calculate average response time
          if (trafficData.length > 0) {
            const totalResponseTime = trafficData.reduce((sum, item) => sum + item.responseTime, 0);
            const avgResponseTime = Math.round(totalResponseTime / trafficData.length);
            document.getElementById('avg-response-time').textContent = avgResponseTime + ' ms';
          }
        }
        
        function fetchTrafficData() {
          fetch('/waf-traffic')
            .then(response => response.json())
            .then(data => {
              trafficData = data.traffic;
              updateTrafficTable();
              updateStats();
            })
            .catch(error => {
              console.error('Error fetching traffic data:', error);
              document.getElementById('traffic-table').innerHTML = 
                '<tr><td colspan="6" style="text-align: center;">Error loading traffic data</td></tr>';
            });
        }
        
        function checkHealth() {
          fetch('/waf-health')
            .then(response => response.json())
            .then(data => {
              // Update health indicator
              const healthIndicator = document.getElementById('health-indicator');
              healthIndicator.textContent = 'WAF Status: ' + data.waf.status;
              
              // Update app status
              document.getElementById('waf-uptime').textContent = data.waf.uptime;
              
              // Update frontend status
              const frontendStatus = document.getElementById('frontend-status');
              if (data.targets.frontend.status === 'UP') {
                frontendStatus.innerHTML = '<span class="health-up">Online</span>';
              } else {
                frontendStatus.innerHTML = '<span class="health-down">Offline</span> - ' + 
                  (data.targets.frontend.error || 'Unknown error');
              }
              
              // Update API status
              const apiStatus = document.getElementById('api-status');
              if (data.targets.api.status === 'UP') {
                apiStatus.innerHTML = '<span class="health-up">Online</span>';
              } else {
                apiStatus.innerHTML = '<span class="health-down">Offline</span> - ' + 
                  (data.targets.api.error || 'Unknown error');
              }
            })
            .catch(error => {
              console.error('Error checking health:', error);
              document.getElementById('health-indicator').textContent = 'Health check failed';
            });
        }
        
        // Fetch data on load
        fetchTrafficData();
        checkHealth();
        
        // Set up auto-refresh timer
        setInterval(fetchTrafficData, 5000);
        setInterval(checkHealth, 15000);
        
        // Set up manual refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
          fetchTrafficData();
          checkHealth();
        });
        
        // Set up pagination
        document.getElementById('prev-page').addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            updateTrafficTable();
          }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
          if ((currentPage * itemsPerPage) < trafficData.length) {
            currentPage++;
            updateTrafficTable();
          }
        });
      </script>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(wafDashboardHtml);
});

// Set up proxy to forward CatchPhish frontend requests with WAF integration
const catchphishProxy = createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  pathRewrite: {
    '^/': '/' // No path rewriting needed in this case
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`Proxying frontend request to CatchPhish: ${req.method} ${req.path}`);
    
    // Remove encoding headers to prevent compression issues
    proxyReq.removeHeader('accept-encoding');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Received response from CatchPhish frontend: ${proxyRes.statusCode}`);
    
    // Remove content-encoding to prevent browser decompression errors
    delete proxyRes.headers['content-encoding'];
    
    // Inject script to modify frontend's API calls
    if (proxyRes.headers['content-type'] && 
        proxyRes.headers['content-type'].includes('text/html')) {
      
      // Set up response body collection
      let responseBody = '';
      
      // Store the original write and end functions
      const originalWrite = res.write;
      const originalEnd = res.end;
      
      // Override write method to collect the response body
      res.write = function(chunk, encoding) {
        // Collect the response body
        responseBody += chunk.toString('utf8');
        return true; // Indicate success but don't actually write yet
      };
      
      // Override end method to modify the response body and send the final response
      res.end = function(chunk, encoding) {
        // If there's a chunk in the end call, add it to the body
        if (chunk) {
          responseBody += chunk.toString('utf8');
        }
        
        // Replace any hardcoded API URLs in the HTML
        responseBody = responseBody.replace(
          /http:\/\/localhost:5001\/api/g, 
          'http://localhost:8080/api'
        );
        
        // Fix WebSocket URLs to go through our proxy
        responseBody = responseBody.replace(
          /ws:\/\/localhost:3001\/ws/g,
          'ws://localhost:8080/ws'
        );
        
        // Define script to inject for API redirection
        const scriptToInject = `
<script>
// Intercept fetch to redirect API calls
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  if (typeof url === "string" && url.includes("localhost:5001")) {
    // Replace API URL with proxy URL
    url = url.replace("http://localhost:5001/api", "http://localhost:8080/api");
    console.log("Redirected API call to WAF proxy:", url);
  }
  
  // For authentication endpoints, ensure credentials are included
  if (typeof url === "string" && 
      (url.includes("/api/users/login") || 
       url.includes("/api/users/check-session"))) {
    if (!options.credentials) {
      options.credentials = "include";
    }
    if (!options.headers) {
      options.headers = {};
    }
    options.headers["Content-Type"] = "application/json";
  }
  
  return originalFetch(url, options)
    .then(response => {
      if (response.ok) {
        return response;
      }
      // Handle API errors
      console.log("API response status:", response.status);
      return response;
    })
    .catch(error => {
      console.error("API fetch error:", error);
      throw error;
    });
};

// Intercept XMLHttpRequest to redirect API calls
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  if (typeof url === "string" && url.includes("localhost:5001")) {
    // Replace API URL with proxy URL
    url = url.replace("http://localhost:5001/api", "http://localhost:8080/api");
    console.log("Redirected XHR API call to WAF proxy:", url);
  }
  
  const xhr = this;
  // For auth endpoints, ensure withCredentials is set
  if (typeof url === "string" && 
      (url.includes("/api/users/login") || 
       url.includes("/api/users/check-session"))) {
    xhr.withCredentials = true;
  }
  
  return originalOpen.call(xhr, method, url, ...rest);
};

// Log that the app is protected by the WAF
console.log("CatchPhish protected by WAF: API traffic redirected through WAF proxy on port 8080");
</script>
`;
        
        // Inject the script right before the closing </body> tag
        if (responseBody.includes('</body>')) {
          responseBody = responseBody.replace('</body>', scriptToInject + '</body>');
        } else {
          responseBody += scriptToInject;
        }
        
        // Set headers for the response
        res.removeHeader('Content-Length');
        res.setHeader('Content-Length', Buffer.byteLength(responseBody));
        
        // Write the modified response body
        originalWrite.call(res, Buffer.from(responseBody), 'utf8');
        originalEnd.call(res);
      };
    } else {
      // For non-HTML responses, don't modify them
      proxyRes.pipe(res);
    }
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    
    // Check if the error is because CatchPhish is not running
    if (err.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to CatchPhish on port 3001. Is it running?');
      
      // Send an HTML response with helpful information
      res.writeHead(503, {
        'Content-Type': 'text/html'
      });
      
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WAF Proxy - Target Application Unavailable</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 40px;
              background: #f0f4f8;
              color: #333;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            h1 { color: #e74c3c; }
            h2 { color: #3498db; }
            pre {
              background: #f8f8f8;
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
            }
            .step {
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 1px solid #eee;
            }
            .warning { color: #e74c3c; }
            .info { color: #2980b9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ WAF Proxy: Target Application Not Available</h1>
            
            <div class="warning">
              <p>The WAF Proxy is running correctly, but cannot connect to the CatchPhish application on port 3001.</p>
            </div>
            
            <h2>Troubleshooting Steps</h2>
            
            <div class="step">
              <h3>1. Check if CatchPhish is running</h3>
              <p>Verify that your CatchPhish application is running on port 3001.</p>
              <pre>netstat -ano | findstr :3001</pre>
              <p>If nothing shows up, your CatchPhish application is not running.</p>
            </div>
            
            <div class="step">
              <h3>2. Start your CatchPhish application</h3>
              <p>Navigate to your CatchPhish project directory and start the application:</p>
              <pre>cd path/to/catchphish
npm start</pre>
            </div>
            
            <div class="step">
              <h3>3. Check if the API server is running</h3>
              <p>Your CatchPhish application requires an API server on port 5001.</p>
              <pre>netstat -ano | findstr :5001</pre>
              <p>Make sure both the frontend and API server are running.</p>
            </div>
            
            <div class="info">
              <p>Once your CatchPhish application is running, refresh this page to access it through the WAF.</p>
              <p>The WAF Proxy is currently listening on port 8080.</p>
              <p><a href="/waf-admin" style="color: #3498db; text-decoration: none; font-weight: bold;">Go to WAF Admin Dashboard</a></p>
            </div>
          </div>
        </body>
        </html>
      `);
    } else {
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
      res.end('Proxy error: Could not connect to CatchPhish application');
    }
  }
});

// Apply the catchphishProxy to all other routes including the root path
app.use('/', catchphishProxy);

// Add a health check endpoint to verify the WAF proxy is working
app.get('/waf-health', async (req, res) => {
  console.log('🏥 WAF health check requested');
  
  // Check API connectivity
  let apiStatus = 'UNKNOWN';
  let apiError = null;
  try {
    // Use node-fetch to check if the API is reachable
    const apiResponse = await fetch('http://localhost:5001/api/users/check-session', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3001'
      },
      timeout: 3000
    });
    
    apiStatus = apiResponse.ok ? 'UP' : 'ERROR';
    if (!apiResponse.ok) {
      apiError = `API returned status ${apiResponse.status}`;
    }
  } catch (error) {
    apiStatus = 'DOWN';
    apiError = error.message;
  }
  
  // Check frontend connectivity
  let frontendStatus = 'UNKNOWN';
  let frontendError = null;
  try {
    // Use node-fetch to check if the frontend is reachable
    const frontendResponse = await fetch('http://localhost:3001/', {
      method: 'GET',
      timeout: 3000
    });
    
    frontendStatus = frontendResponse.ok ? 'UP' : 'ERROR';
    if (!frontendResponse.ok) {
      frontendError = `Frontend returned status ${frontendResponse.status}`;
    }
  } catch (error) {
    frontendStatus = 'DOWN';
    frontendError = error.message;
  }
  
  const healthCheck = {
    timestamp: new Date().toISOString(),
    waf: {
      status: 'UP',
      uptime: `${Math.floor(process.uptime())} seconds`,
      port: process.env.PROXY_PORT || 8080
    },
    targets: {
      frontend: {
        url: 'http://localhost:3001',
        status: frontendStatus,
        error: frontendError
      },
      api: {
        url: 'http://localhost:5001',
        status: apiStatus,
        error: apiError
      }
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      mongoUri: process.env.MONGO_URI ? '(configured)' : '(not configured)'
    }
  };
  
  // Send the health check response
  res.json(healthCheck);
});

// Add a dedicated page just for live traffic
app.get('/live-traffic', (req, res) => {
  console.log('Accessing Live Traffic Dashboard');
  
  const liveTrafficHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CatchPhish Live Traffic</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f7fa;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header {
          background-color: #1a2233;
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #42a5f5;
        }
        .status-indicator {
          display: flex;
          align-items: center;
        }
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #4caf50;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
          70% { box-shadow: 0 0 0 5px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
        .container {
          max-width: 1200px;
          margin: 20px auto;
          padding: 0 20px;
        }
        .stats-row {
          display: flex;
          flex-wrap: wrap;
          margin: 0 -10px 20px;
        }
        .stat-card {
          flex: 1;
          min-width: 200px;
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          margin: 0 10px 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .stat-title {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #333;
        }
        .traffic-container {
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          margin-bottom: 30px;
        }
        .traffic-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background-color: #f8fafd;
          border-bottom: 1px solid #eaedf3;
        }
        .traffic-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        .action-buttons {
          display: flex;
          gap: 10px;
        }
        .refresh-btn, .filter-btn {
          background-color: #f0f2f5;
          color: #333;
          border: none;
          border-radius: 4px;
          padding: 8px 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .refresh-btn:hover, .filter-btn:hover {
          background-color: #e0e4e9;
        }
        .refresh-btn i, .filter-btn i {
          margin-right: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid #eaedf3;
        }
        th {
          background-color: #f8fafd;
          color: #666;
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        tr:hover {
          background-color: #f8fafd;
        }
        .method {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }
        .get {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        .post {
          background-color: #e8f5e9;
          color: #388e3c;
        }
        .put {
          background-color: #fff8e1;
          color: #f57c00;
        }
        .delete {
          background-color: #ffebee;
          color: #d32f2f;
        }
        .status-code {
          font-weight: 600;
        }
        .status-200 {
          color: #4caf50;
        }
        .status-300 {
          color: #2196f3;
        }
        .status-400 {
          color: #ff9800;
        }
        .status-500 {
          color: #f44336;
        }
        .timestamp {
          color: #999;
          font-size: 12px;
        }
        .pagination {
          display: flex;
          justify-content: center;
          margin: 20px 0;
        }
        .pagination button {
          background-color: #f0f2f5;
          color: #333;
          border: none;
          padding: 8px 15px;
          margin: 0 5px;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .pagination button:hover {
          background-color: #e0e4e9;
        }
        .pagination button:disabled {
          background-color: #f0f2f5;
          color: #bbb;
          cursor: not-allowed;
        }
        .footer {
          text-align: center;
          margin: 30px 0;
          color: #999;
          font-size: 14px;
        }
        .navbar {
          background-color: #1a2233;
          padding: 0 20px;
          display: flex;
        }
        .navbar a {
          color: #ccc;
          text-decoration: none;
          padding: 15px 20px;
          transition: background-color 0.2s, color 0.2s;
        }
        .navbar a:hover {
          background-color: #212c42;
          color: white;
        }
        .navbar a.active {
          background-color: #212c42;
          color: #42a5f5;
          border-bottom: 3px solid #42a5f5;
        }
        .attack-tag {
          display: inline-block;
          padding: 3px 6px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: bold;
          background-color: #ffebee;
          color: #d32f2f;
          margin-left: 5px;
        }
        .path-cell {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      </style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css">
    </head>
    <body>
      <div class="header">
        <h1>CatchPhish WAF</h1>
        <div class="status-indicator">
          <div class="status-dot"></div>
          <span>WAF Active - Port ${PORT}</span>
        </div>
      </div>
      
      <div class="navbar">
        <a href="/">CatchPhish App</a>
        <a href="/live-traffic" class="active">Live Traffic</a>
        <a href="/waf-admin">WAF Dashboard</a>
      </div>
      
      <div class="container">
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-title">Total Traffic</div>
            <div class="stat-value" id="total-requests">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Requests Today</div>
            <div class="stat-value" id="requests-today">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Blocked Attacks</div>
            <div class="stat-value" id="blocked-attacks">0</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Avg Response Time</div>
            <div class="stat-value" id="avg-response-time">0 ms</div>
          </div>
        </div>
        
        <div class="traffic-container">
          <div class="traffic-header">
            <h2 class="traffic-title">Live Traffic Monitor</h2>
            <div class="action-buttons">
              <button class="refresh-btn" id="refresh-btn">
                <i class="fas fa-sync-alt"></i> Refresh
              </button>
              <button class="filter-btn">
                <i class="fas fa-filter"></i> Filter
              </button>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>IP Address</th>
                <th>Method</th>
                <th>Path</th>
                <th>Status</th>
                <th>Response Time</th>
              </tr>
            </thead>
            <tbody id="traffic-table">
              <tr>
                <td colspan="6" style="text-align: center;">Loading traffic data...</td>
              </tr>
            </tbody>
          </table>
          
          <div class="pagination">
            <button id="prev-page" disabled>Previous</button>
            <span id="page-info">Page 1</span>
            <button id="next-page" disabled>Next</button>
          </div>
        </div>
        
        <div class="footer">
          CatchPhish WAF - Web Application Firewall - ©${new Date().getFullYear()}
        </div>
      </div>
      
      <script>
        let trafficData = [];
        let currentPage = 1;
        const itemsPerPage = 20;
        
        function formatTimestamp(timestamp) {
          const date = new Date(timestamp);
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        
        function formatDate(timestamp) {
          const date = new Date(timestamp);
          return date.toLocaleDateString();
        }
        
        function getStatusClass(status) {
          if (status >= 500) return 'status-500';
          if (status >= 400) return 'status-400';
          if (status >= 300) return 'status-300';
          return 'status-200';
        }
        
        function getMethodClass(method) {
          const methodLower = method.toLowerCase();
          if (methodLower === 'get') return 'get';
          if (methodLower === 'post') return 'post';
          if (methodLower === 'put') return 'put';
          if (methodLower === 'delete') return 'delete';
          return '';
        }
        
        function detectAttack(path, status) {
          // Simple attack detection based on path patterns
          const suspiciousPatterns = ['/wp-', '.php', 'admin', 'eval', 'script', '../../', '../', 'union+select', 'password', 'login', 'sql'];
          const isSuspicious = suspiciousPatterns.some(pattern => path.toLowerCase().includes(pattern));
          return isSuspicious || status === 403;
        }
        
        function updateTrafficTable() {
          const tableBody = document.getElementById('traffic-table');
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const pageData = trafficData.slice(startIndex, endIndex);
          
          // Enable/disable pagination buttons
          document.getElementById('prev-page').disabled = currentPage === 1;
          document.getElementById('next-page').disabled = endIndex >= trafficData.length;
          document.getElementById('page-info').textContent = \`Page \${currentPage} of \${Math.max(1, Math.ceil(trafficData.length / itemsPerPage))}\`;
          
          if (pageData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No traffic data available</td></tr>';
            return;
          }
          
          let html = '';
          pageData.forEach(item => {
            const isAttack = detectAttack(item.path, item.status);
            const attackTag = isAttack ? '<span class="attack-tag">SUSPICIOUS</span>' : '';
            
            html += '<tr>' +
              '<td class="timestamp">' + formatTimestamp(item.timestamp) + '</td>' +
              '<td>' + item.ip + '</td>' +
              '<td><span class="method ' + getMethodClass(item.method) + '">' + item.method + '</span></td>' +
              '<td>' + item.path + '</td>' +
              '<td><span class="status-code ' + getStatusClass(item.status) + '">' + item.status + '</span></td>' +
              '<td>' + item.responseTime + ' ms</td>' +
              '</tr>';
          });
          
          tableBody.innerHTML = html;
        }
        
        function updateStats() {
          document.getElementById('total-requests').textContent = trafficData.length;
          
          // Calculate requests today
          const today = new Date().toDateString();
          const requestsToday = trafficData.filter(item => 
            new Date(item.timestamp).toDateString() === today
          ).length;
          document.getElementById('requests-today').textContent = requestsToday;
          
          // Calculate blocked attacks
          const suspiciousTraffic = trafficData.filter(item => detectAttack(item.path, item.status)).length;
          document.getElementById('blocked-attacks').textContent = suspiciousTraffic;
          
          // Calculate average response time
          if (trafficData.length > 0) {
            const totalResponseTime = trafficData.reduce((sum, item) => sum + item.responseTime, 0);
            const avgResponseTime = Math.round(totalResponseTime / trafficData.length);
            document.getElementById('avg-response-time').textContent = avgResponseTime + ' ms';
          }
        }
        
        function fetchTrafficData() {
          fetch('/waf-traffic')
            .then(response => response.json())
            .then(data => {
              trafficData = data.traffic;
              updateTrafficTable();
              updateStats();
            })
            .catch(error => {
              console.error('Error fetching traffic data:', error);
              document.getElementById('traffic-table').innerHTML = 
                '<tr><td colspan="6" style="text-align: center;">Error loading traffic data</td></tr>';
            });
        }
        
        // Fetch data on load
        fetchTrafficData();
        
        // Set up auto-refresh timer
        setInterval(fetchTrafficData, 2000);
        
        // Set up manual refresh button
        document.getElementById('refresh-btn').addEventListener('click', fetchTrafficData);
        
        // Set up pagination
        document.getElementById('prev-page').addEventListener('click', () => {
          if (currentPage > 1) {
            currentPage--;
            updateTrafficTable();
          }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
          if ((currentPage * itemsPerPage) < trafficData.length) {
            currentPage++;
            updateTrafficTable();
          }
        });
      </script>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(liveTrafficHtml);
});

// Start the proxy server on a different port (e.g., 80 or 443 for production)
const PORT = process.env.PROXY_PORT || 8080;
app.listen(PORT, () => {
  console.log(`🔥 WAF Proxy Server running on port ${PORT}`);
  console.log(`🛡️ Protecting CatchPhish application on port 3001`);
  console.log(`🛡️ Protecting CatchPhish API on port 5001`);
}); 