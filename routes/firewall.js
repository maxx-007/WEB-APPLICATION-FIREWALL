const express = require("express");
const router = express.Router();
const {
  getFirewallRules,
  addFirewallRule,
  updateFirewallRule,
  deleteFirewallRule
} = require("../controllers/firewallController");

// Get all firewall rules
router.get("/rules", getFirewallRules);

// Add a new firewall rule
router.post("/rules", addFirewallRule);

// Update an existing firewall rule
router.put("/rules/:id", updateFirewallRule);

// Delete a firewall rule
router.delete("/rules/:id", deleteFirewallRule);

module.exports = router;
