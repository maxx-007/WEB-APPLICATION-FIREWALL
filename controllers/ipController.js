const { dbPromise } = require("../config/dbMySQL");

// 📌 Get all blocked IPs
const getBlockedIPs = async (req, res) => {
  try {
    const [results] = await dbPromise.execute("SELECT * FROM blocked_ips ORDER BY blocked_at DESC");
    res.json(results);
  } catch (err) {
    console.error("Error fetching blocked IPs:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Get all whitelisted IPs
const getWhitelistedIPs = async (req, res) => {
  try {
    const [results] = await dbPromise.execute("SELECT * FROM whitelist_ips ORDER BY created_at DESC");
    res.json(results);
  } catch (err) {
    console.error("Error fetching whitelisted IPs:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Block an IP address
const blockIP = async (req, res) => {
  const { ip, reason = 'Manual block', is_permanent = false, expires_at = null } = req.body;
  
  if (!ip) {
    return res.status(400).json({ error: "IP address is required" });
  }

  // Validate IP format (basic validation)
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (!ipRegex.test(ip)) {
    return res.status(400).json({ error: "Invalid IP address format" });
  }

  try {
    const sql = "INSERT INTO blocked_ips (ip, reason, blocked_by, is_permanent, expires_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason), blocked_by = VALUES(blocked_by), is_permanent = VALUES(is_permanent), expires_at = VALUES(expires_at)";
    await dbPromise.execute(sql, [ip, reason, req.user?.username || 'admin', is_permanent, expires_at]);
    res.json({ message: "IP blocked successfully" });
  } catch (err) {
    console.error("Error blocking IP:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Unblock an IP address
const unblockIP = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = "DELETE FROM blocked_ips WHERE id = ?";
    const [result] = await dbPromise.execute(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Blocked IP not found" });
    }
    
    res.json({ message: "IP unblocked successfully" });
  } catch (err) {
    console.error("Error unblocking IP:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Add IP to whitelist
const whitelistIP = async (req, res) => {
  const { ip, description = '' } = req.body;
  
  if (!ip) {
    return res.status(400).json({ error: "IP address is required" });
  }

  // Validate IP format
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (!ipRegex.test(ip)) {
    return res.status(400).json({ error: "Invalid IP address format" });
  }

  try {
    const sql = "INSERT INTO whitelist_ips (ip, description, created_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description), created_by = VALUES(created_by)";
    await dbPromise.execute(sql, [ip, description, req.user?.username || 'admin']);
    res.json({ message: "IP whitelisted successfully" });
  } catch (err) {
    console.error("Error whitelisting IP:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Remove IP from whitelist
const removeFromWhitelist = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = "DELETE FROM whitelist_ips WHERE id = ?";
    const [result] = await dbPromise.execute(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Whitelisted IP not found" });
    }
    
    res.json({ message: "IP removed from whitelist successfully" });
  } catch (err) {
    console.error("Error removing IP from whitelist:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Get IP statistics
const getIPStats = async (req, res) => {
  try {
    const [blockedCount] = await dbPromise.execute("SELECT COUNT(*) as count FROM blocked_ips");
    const [whitelistCount] = await dbPromise.execute("SELECT COUNT(*) as count FROM whitelist_ips");
    const [expiredBlocks] = await dbPromise.execute("SELECT COUNT(*) as count FROM blocked_ips WHERE expires_at IS NOT NULL AND expires_at < NOW()");
    
    res.json({
      blocked_ips: blockedCount[0].count,
      whitelisted_ips: whitelistCount[0].count,
      expired_blocks: expiredBlocks[0].count
    });
  } catch (err) {
    console.error("Error fetching IP statistics:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Clean up expired IP blocks
const cleanupExpiredBlocks = async (req, res) => {
  try {
    const sql = "DELETE FROM blocked_ips WHERE expires_at IS NOT NULL AND expires_at < NOW()";
    const [result] = await dbPromise.execute(sql);
    
    res.json({ 
      message: "Expired blocks cleaned up successfully", 
      removed_count: result.affectedRows 
    });
  } catch (err) {
    console.error("Error cleaning up expired blocks:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

module.exports = {
  getBlockedIPs,
  getWhitelistedIPs,
  blockIP,
  unblockIP,
  whitelistIP,
  removeFromWhitelist,
  getIPStats,
  cleanupExpiredBlocks
};