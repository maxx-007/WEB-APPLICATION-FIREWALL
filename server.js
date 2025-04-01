const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const firewallMiddleware = require('./middleware/firewall');
const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
// Database Connections
require('./config/dbMySQL');
require('./config/dbMongo');

// Middleware Setup
app.use(cors());
app.use(bodyParser.json());

// Import API Routes
const firewallRoutes = require('./routes/firewall');
const logsRoutes = require('./routes/logs');

// Apply firewall middleware globally
app.use(firewallMiddleware);

// Register API Routes
app.use("/firewall", firewallRoutes);
app.use("/logs", logsRoutes);

// Default Route
app.get("/", (req, res) => {
    res.send("🔥 WAF API Running...");
});

// Login Route with basic validation and SQL injection prevention
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    // Basic SQL Injection detection (example, add more patterns as needed)
    const sqlInjectionRegex = /SELECT|DROP|INSERT|DELETE|UPDATE|UNION|OR|--/i;
    if (sqlInjectionRegex.test(password)) {
        return res.status(403).json({ error: "Potential SQL injection detected!" });
    }

    // Proceed with login logic (this is a dummy response for now)
    res.json({ message: "Login successful (Dummy response)" });
});

// Mongoose Setup for logging blocked requests
const mongoose = require("mongoose");

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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
