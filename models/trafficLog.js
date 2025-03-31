const mongoose = require('mongoose');

const TrafficLogSchema = new mongoose.Schema({
    ip_address: String,
    request_path: String,
    request_method: String,
    status_code: Number,
    response_time_ms: Number,
    user_agent: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TrafficLog', TrafficLogSchema);
