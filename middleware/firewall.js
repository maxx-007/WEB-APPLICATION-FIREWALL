const db = require("../config/dbMySQL");
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
const sqlInjectionPatterns = /(\b(union|select|insert|update|delete|drop|alter|create|truncate)\b|--|#|\/\*|\*\/)/i;
const xssPatterns = /(<script>|javascript:|onerror=|onload=)/i;

// 🚀 Firewall Middleware Function
const firewallMiddleware = async (req, res, next) => {
    try {
        const clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];
        const requestPath = req.originalUrl;
        const requestBody = JSON.stringify(req.body);

        console.log(`🌐 Inspecting request: ${clientIP} - ${requestPath}`);

        // 🚨 Check for Blacklisted IPs
        db.query("SELECT ip FROM blocked_ips WHERE ip = ?", [clientIP], async (err, result) => {
            if (err) {
                console.error("❌ Error fetching blocked IPs:", err);
                return res.status(500).json({ error: "Internal Firewall Error" });
            }
            if (result.length > 0) {
                console.warn(`🚨 Blocked request from Blacklisted IP: ${clientIP}`);
                return res.status(403).json({ message: "🔥 Access Denied: Your IP is blocked." });
            }

            // 🚨 Block SQL Injection & XSS Attempts
            if (sqlInjectionPatterns.test(requestPath) || sqlInjectionPatterns.test(requestBody)) {
                console.warn(`🚨 SQL Injection attempt blocked from ${clientIP}`);
                await logAttack(clientIP, "SQL Injection", requestPath, userAgent);
                return res.status(403).json({ message: "🔥 Request Blocked: SQL Injection detected." });
            }

            if (xssPatterns.test(requestPath) || xssPatterns.test(requestBody)) {
                console.warn(`🚨 XSS Attack blocked from ${clientIP}`);
                await logAttack(clientIP, "XSS Attack", requestPath, userAgent);
                return res.status(403).json({ message: "🔥 Request Blocked: XSS Attack detected." });
            }

            // 🚨 Block Suspicious User-Agents
            if (userAgent && blockedUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
                console.warn(`🚨 Blocked Suspicious User-Agent: ${userAgent}`);
                await logAttack(clientIP, "Blocked User-Agent", requestPath, userAgent);
                return res.status(403).json({ message: "🔥 Request Blocked: Suspicious User-Agent detected." });
            }

            // 🚨 Fetch Firewall Rules from MySQL & Apply them
            db.query("SELECT * FROM firewall_rules", async (err, rules) => {
                if (err) {
                    console.error("❌ Error fetching firewall rules:", err);
                    return res.status(500).json({ error: "Internal Firewall Error" });
                }

                let blocked = false;
                let matchedRule = null;

                for (let rule of rules) {
                    const regex = new RegExp(rule.rule_pattern, "i"); // Case-insensitive regex match
                    if (regex.test(requestPath) || regex.test(requestBody)) {
                        blocked = true;
                        matchedRule = rule;
                        break;
                    }
                }

                if (blocked) {
                    console.warn(`🚨 Blocked request from ${clientIP} due to rule: ${matchedRule.rule_name}`);
                    await logAttack(clientIP, matchedRule.rule_name, requestPath, userAgent);
                    return res.status(403).json({ message: "🔥 Request Blocked by Firewall", rule: matchedRule.rule_name });
                }

                // 🚀 Log normal traffic
                await logTraffic(clientIP, requestPath, userAgent);
                next();
            });
        });

    } catch (err) {
        console.error("❌ Firewall Middleware Error:", err);
        res.status(500).json({ error: "Firewall Processing Error" });
    }
};

// 🚀 Helper function to log attacks in MongoDB
const logAttack = async (ip, ruleName, path, userAgent) => {
    await AttackLog.create({
        ip,
        rule_name: ruleName,
        request_path: path,
        user_agent: userAgent,
        timestamp: new Date(),
    });
};

// 🚀 Helper function to log normal traffic in MongoDB
const logTraffic = async (ip, path, userAgent) => {
    await TrafficLog.create({
        ip,
        request_path: path,
        user_agent: userAgent,
        timestamp: new Date(),
    });
};

module.exports = { firewallMiddleware, limiter };
