const { db, dbPromise } = require("../config/dbMySQL");
const AttackLog = require("../models/attackLog");
const TrafficLog = require("../models/trafficLog");
const rateLimit = require("express-rate-limit");

// 🚀 Rate Limiting (Prevent DDoS)
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: "🚨 Too many requests! Slow down."
});

// 🚀 Blocked User-Agents (Prevent automated hacking tools)
const blockedUserAgents = [
    "sqlmap", "havij", "nmap", "nikto", "acunetix", "w3af"
];

// 🚀 SQL Injection & XSS Detection Patterns
const sqlInjectionPatterns = /(\b(union|select|insert|update|delete|drop|alter|create|truncate)\b|--|#|\/\*|\*\/|'(\s|\+|%20)*or(\s|\+|%20)*'|'(\s|\+|%20)*=(\s|\+|%20)*'|(\s|\+|%20)+and(\s|\+|%20)|(\s|\+|%20)+or(\s|\+|%20)|(\s|\+|%20)+where(\s|\+|%20)|'(\s|\+|%20)*\d+(\s|\+|%20)*'(\s|\+|%20)*=|'(\s|\+|%20)*1(\s|\+|%20)*'(\s|\+|%20)*=)/i;

// More comprehensive XSS detection pattern that includes javascript:alert and similar patterns
const xssPatterns = /(<script>|<script\s|javascript:|onerror=|onload=|alert\(|onclick=|onmouseover=|eval\(|document\.cookie|document\.location|window\.location)/i;

// Path traversal detection pattern
const pathTraversalPatterns = /(\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e%252f|\.\.|\/etc\/passwd|\/proc\/self|\/win.ini|c:\\windows|cmd\.exe)/i;

// 🚀 Firewall Middleware Function
const firewallMiddleware = async (req, res, next) => {
    try {
        const clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];
        const requestPath = req.originalUrl;
        const requestBody = JSON.stringify(req.body);

        console.log(`🌐 Inspecting request: ${clientIP} - ${requestPath}`);

        // 🚨 First check if IP is whitelisted (skip all checks if whitelisted)
        try {
            const [whitelisted] = await dbPromise.execute("SELECT ip FROM whitelist_ips WHERE ip = ?", [clientIP]);
            if (whitelisted.length > 0) {
                console.log(`✅ Whitelisted IP allowed: ${clientIP}`);
                await logTraffic(clientIP, requestPath, userAgent);
                return next();
            }

            // 🚨 Check for Blacklisted IPs
            const [blocked] = await dbPromise.execute("SELECT ip, expires_at FROM blocked_ips WHERE ip = ? AND (expires_at IS NULL OR expires_at > NOW())", [clientIP]);
            if (blocked.length > 0) {
                console.warn(`🚨 Blocked request from Blacklisted IP: ${clientIP}`);
                await logAttack(clientIP, "Blacklisted IP", requestPath, userAgent);
                return res.redirect('/block.html?attack=blacklisted_ip');
            }

            // 🚨 Block SQL Injection & XSS Attempts
            if (sqlInjectionPatterns.test(requestPath) || sqlInjectionPatterns.test(requestBody)) {
                console.warn(`🚨 SQL Injection attempt blocked from ${clientIP}`);
                await logAttack(clientIP, "SQL Injection", requestPath, userAgent);
                return res.redirect('/block.html?attack=sql_injection');
            }

            if (xssPatterns.test(requestPath) || xssPatterns.test(requestBody)) {
                console.warn(`🚨 XSS Attack blocked from ${clientIP}`);
                await logAttack(clientIP, "XSS Attack", requestPath, userAgent);
                return res.redirect('/block.html?attack=xss');
            }

            // 🚨 Block Path Traversal Attempts
            if (pathTraversalPatterns.test(requestPath) || pathTraversalPatterns.test(requestBody)) {
                console.warn(`🚨 Path Traversal attempt blocked from ${clientIP}`);
                await logAttack(clientIP, "Path Traversal", requestPath, userAgent);
                return res.redirect('/block.html?attack=path_traversal');
            }

            // 🚨 Block Suspicious User-Agents
            if (userAgent && blockedUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
                console.warn(`🚨 Blocked Suspicious User-Agent: ${userAgent}`);
                await logAttack(clientIP, "Blocked User-Agent", requestPath, userAgent);
                return res.redirect('/block.html?attack=malicious_tool');
            }

            // 🚨 Fetch Active Firewall Rules from MySQL & Apply them
            const [rules] = await dbPromise.execute("SELECT * FROM firewall_rules WHERE is_active = TRUE ORDER BY severity DESC");
            
            let isBlocked = false;
            let matchedRule = null;

            for (let rule of rules) {
                try {
                    const regex = new RegExp(rule.rule_pattern, "i"); // Case-insensitive regex match
                    if (regex.test(requestPath) || regex.test(requestBody)) {
                        isBlocked = true;
                        matchedRule = rule;
                        break;
                    }
                } catch (regexError) {
                    console.error(`❌ Invalid regex pattern in rule "${rule.rule_name}": ${rule.rule_pattern}`, regexError.message);
                    // Skip this rule and continue with the next one
                    continue;
                }
            }

            if (isBlocked) {
                console.warn(`🚨 Blocked request from ${clientIP} due to rule: ${matchedRule.rule_name}`);
                await logAttack(clientIP, matchedRule.rule_name, requestPath, userAgent);
                return res.redirect('/block.html?attack=' + encodeURIComponent(matchedRule.rule_name));
            }

            // 🚀 Log normal traffic
            await logTraffic(clientIP, requestPath, userAgent);
            next();
            
        } catch (dbError) {
            console.error("❌ Database error in firewall:", dbError);
            // Allow request to continue even if database fails
            next();
        }

    } catch (err) {
        console.error("❌ Firewall Middleware Error:", err);
        res.status(500).json({ error: "Firewall Processing Error" });
    }
};

// 🚀 Helper function to log attacks in MongoDB
const logAttack = async (ip, ruleName, path, userAgent) => {
    try {
        await AttackLog.create({
            ip_address: ip,
            request_path: path,
            request_method: 'Unknown', // We don't have method in the current function params
            detected_threat: ruleName,
            user_agent: userAgent,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error("❌ Error logging attack:", error);
    }
};

// 🚀 Helper function to log normal traffic in MongoDB
const logTraffic = async (ip, path, userAgent) => {
    try {
        // Create a traffic log entry with more details
        const trafficData = {
            ip_address: ip,
            request_path: path,
            request_method: 'GET', // Default to GET - we'll update this in our proxy
            status_code: 200, // Default success - we'll update this in our proxy
            response_time_ms: 0,
            user_agent: userAgent,
            origin: 'CatchPhish',
            timestamp: new Date(),
            waf_status: 'ALLOWED' // This request passed WAF checks
        };
        
        // Use a try-catch and set a timeout of 5 seconds to prevent long blocking
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Traffic logging timeout')), 5000)
        );
        
        // Race between the DB operation and timeout
        await Promise.race([
            TrafficLog.create(trafficData),
            timeoutPromise
        ]);
        
        console.log(`✅ Traffic logged: ${ip} - ${path}`);
    } catch (error) {
        // Don't let logging failures affect the main application flow
        console.error(`❌ Error logging traffic: ${error.message}`);
    }
};

module.exports = { firewallMiddleware, limiter };
