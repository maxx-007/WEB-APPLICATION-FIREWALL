const express = require('express');
const path = require('path');
const { db, dbPromise } = require('./config/dbMySQL'); // Adjust the path if necessary
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE', 'MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
}

const { firewallMiddleware, limiter }= require('./middleware/firewall');
const app = express();

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    next();
});
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
// Database Connections
require('./config/dbMySQL');
require('./config/dbMongo');








// Middleware Setup
app.use(bodyParser.json({ limit: '10mb' })); // Limit request body size
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Apply firewall middleware globally (but not to health checks)
app.use((req, res, next) => {
    // Skip firewall for health check endpoints
    if (req.path === '/health' || req.path === '/') {
        return next();
    }
    return firewallMiddleware(req, res, next);
});

// Mongoose Setup for logging blocked requests
// Define a schema for logging blocked requests
const BlockedRequestSchema = new mongoose.Schema({
    ip: String,
    endpoint: String,
    blockedRule: String,
    timestamp: { type: Date, default: Date.now }
});

// Create a model from the schema
const BlockedRequest = mongoose.model("BlockedRequest", BlockedRequestSchema);

// Function to log blocked requests
const logBlockedRequest = async (req, rule) => {
    try {
        const blockedRequest = new BlockedRequest({
            ip: req.ip,
            endpoint: req.originalUrl,
            blockedRule: rule
        });
        await blockedRequest.save();
        console.log(`🚨 Blocked request logged: ${req.ip} - ${req.originalUrl} - Rule: ${rule}`);
    } catch (error) {
        console.error("❌ Error logging blocked request:", error);
    }
};

// User Authentication Schema and Model
const UserSchema = new mongoose.Schema({
    username: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['admin', 'user'], 
      default: 'user' 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
});
  
const User = mongoose.model('User', UserSchema);

// Initialize the admin user if it doesn't exist
async function initAdminUser() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123!@#', 10);
            const admin = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('🔐 Admin user created successfully');
        }
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    }
}

// Call this function when your app starts
initAdminUser();

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.authToken;
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

// Admin Middleware
const adminMiddleware = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

// Import API Routes
const firewallRoutes = require('./routes/firewall');
const logsRoutes = require('./routes/logs');
const ipRoutes = require('./routes/ip');

// Register API Routes - Now with authentication
app.use("/firewall", authMiddleware, firewallRoutes);
app.use("/logs", authMiddleware, logsRoutes);
app.use("/ip", authMiddleware, ipRoutes);

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'frontend/build')));
    
    // Catch all handler for React Router
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api') || req.path.startsWith('/login') || req.path.startsWith('/health') || 
            req.path.startsWith('/firewall') || req.path.startsWith('/logs') || req.path.startsWith('/ip')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
    });
}

// Health Check Route (for production monitoring)
app.get("/health", async (req, res) => {
    try {
        // Test database connections
        await dbPromise.execute("SELECT 1");
        await mongoose.connection.db.admin().ping();
        
        res.status(200).json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            services: {
                mysql: "connected",
                mongodb: "connected",
                firewall: "active"
            }
        });
    } catch (error) {
        res.status(503).json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Default Route
app.get("/", (req, res) => {
    res.json({
        name: "Web Application Firewall API",
        version: "1.0.0",
        status: "running",
        endpoints: {
            health: "/health",
            login: "/login",
            firewall: "/firewall/*",
            logs: "/logs/*",
            ip: "/ip/*"
        }
    });
});

// Login Route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    // Basic SQL Injection prevention
    const sqlInjectionRegex = /SELECT|DROP|INSERT|DELETE|UPDATE|UNION|OR|--/i;
    if (sqlInjectionRegex.test(username) || sqlInjectionRegex.test(password)) {
        return res.status(403).json({ error: "Potential SQL injection detected!" });
    }

    try {
        // Find user by username
        const user = await User.findOne({ username });
        console.log(`User found: ${user ? 'Yes' : 'No'}`);
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Validate password
        const validPassword = await bcrypt.compare(password, user.password);
        console.log(`Password valid: ${validPassword ? 'Yes' : 'No'}`);
        if (!validPassword) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Create and send JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Set token as cookie for session management
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        // Return success response with user info (excluding password)
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Token verification route
app.get("/verify-token", authMiddleware, (req, res) => {
    // If authMiddleware passes, the token is valid
    res.json({ 
        valid: true, 
        user: {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        } 
    });
});

app.get("/api/firewall-rules", async (req, res) => {
    try {
        const [results] = await dbPromise.execute("SELECT * FROM firewall_rules");
        res.json(results);
    } catch (err) {
        console.error("❌ Error fetching firewall rules:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/api/firewall-rules", async (req, res) => {
    try {
        const [rules] = await dbPromise.execute("SELECT * FROM firewall_rules");
        res.json(rules);
    } catch (err) {
        res.status(500).json({ error: "Database Error", details: err.message });
    }
});

// User Management Routes (for admin)
app.post("/users", authMiddleware, adminMiddleware, async (req, res) => {
    const { username, password, role } = req.body;
    
    try {
        // Check if user already exists
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ error: "Username already exists" });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = new User({
            username,
            password: hashedPassword,
            role: role || 'user',
            createdBy: req.user.id
        });
        
        await newUser.save();
        
        res.status(201).json({
            message: "User created successfully",
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get all users (admin only)
app.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete user (admin only)
app.delete("/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Prevent deleting the main admin account
        if (user.username === 'admin') {
            return res.status(403).json({ error: "Cannot delete the main admin account" });
        }
        
        await User.findByIdAndDelete(req.params.id);
        
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Logout route
app.post("/logout", (req, res) => {
    res.clearCookie('authToken');
    res.json({ message: "Logged out successfully" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    try {
        await dbPromise.execute("SELECT 1"); // Test MySQL connection
        console.log("✅ MySQL Connected...");
    } catch (error) {
        console.error("❌ MySQL Connection Error:", error);
    }
});