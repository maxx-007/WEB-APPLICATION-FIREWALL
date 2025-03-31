const db = require("../config/dbMySQL");
const AttackLog = require("../models/attackLog");
const TrafficLog = require("../models/trafficLog");

// Middleware function for request inspection
const firewallMiddleware = async (req, res, next) => {
    try {
        const clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];
        const requestPath = req.originalUrl;
        const requestBody = JSON.stringify(req.body);

        console.log(`🌐 Inspecting request: ${clientIP} - ${requestPath}`);

        // Fetch firewall rules from MySQL
        db.query("SELECT * FROM firewall_rules", async (err, rules) => {
            if (err) {
                console.error("❌ Error fetching firewall rules:", err);
                return res.status(500).json({ error: "Internal Firewall Error" });
            }

            let blocked = false;
            let matchedRule = null;

            // Check if request matches any rule
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

                // Log the attack in MongoDB
                await AttackLog.create({
                    ip: clientIP,
                    rule_name: matchedRule.rule_name,
                    request_path: requestPath,
                    user_agent: userAgent,
                    timestamp: new Date(),
                });

                return res.status(403).json({ message: "🔥 Request Blocked by Firewall", rule: matchedRule.rule_name });
            }

            // Log normal traffic in MongoDB
            await TrafficLog.create({
                ip: clientIP,
                request_path: requestPath,
                user_agent: userAgent,
                timestamp: new Date(),
            });

            next(); // Allow request if not blocked
        });

    } catch (err) {
        console.error("❌ Firewall Middleware Error:", err);
        res.status(500).json({ error: "Firewall Processing Error" });
    }
};

module.exports = firewallMiddleware;
