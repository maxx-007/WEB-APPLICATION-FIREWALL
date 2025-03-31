const mongoose = require('mongoose');

const AttackLogSchema = new mongoose.Schema({
    ip_address: String,
    request_path: String,
    request_method: String,
    detected_threat: String,
    user_agent: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AttackLog', AttackLogSchema);
