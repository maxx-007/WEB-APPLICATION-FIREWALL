const AttackLog = require("../models/attackLog");
const TrafficLog = require("../models/trafficLog");

// Get attack logs from MongoDB
exports.getAttackLogs = async (req, res) => {
    try {
        const logs = await AttackLog.find().sort({ timestamp: -1 }).limit(50);
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ error: "Database error", details: err });
    }
};

// Get traffic logs from MongoDB
exports.getTrafficLogs = async (req, res) => {
    try {
        const logs = await TrafficLog.find().sort({ timestamp: -1 }).limit(50);
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ error: "Database error", details: err });
    }
};
