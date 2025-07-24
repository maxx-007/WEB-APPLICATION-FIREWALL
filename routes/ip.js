const express = require("express");
const router = express.Router();
const {
  getBlockedIPs,
  getWhitelistedIPs,
  blockIP,
  unblockIP,
  whitelistIP,
  removeFromWhitelist,
  getIPStats,
  cleanupExpiredBlocks
} = require("../controllers/ipController");

// Get all blocked IPs
router.get("/blocked", getBlockedIPs);

// Get all whitelisted IPs
router.get("/whitelist", getWhitelistedIPs);

// Get IP statistics
router.get("/stats", getIPStats);

// Block an IP address
router.post("/block", blockIP);

// Unblock an IP address
router.delete("/blocked/:id", unblockIP);

// Add IP to whitelist
router.post("/whitelist", whitelistIP);

// Remove IP from whitelist
router.delete("/whitelist/:id", removeFromWhitelist);

// Clean up expired blocks
router.post("/cleanup", cleanupExpiredBlocks);

module.exports = router;