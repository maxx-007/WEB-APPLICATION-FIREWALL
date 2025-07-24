const express = require("express");
const router = express.Router();
const {
  getFirewallRules,
  addFirewallRule,
  updateFirewallRule,
  toggleFirewallRule,
  deleteFirewallRule
} = require("../controllers/firewallController");

// Get all firewall rules
router.get("/rules", getFirewallRules);

// Add a new firewall rule
router.post("/rules", addFirewallRule);

// Update an existing firewall rule
router.put("/rules/:id", updateFirewallRule);

// Toggle rule active status
router.patch("/rules/:id/toggle", toggleFirewallRule);

// Delete a firewall rule
router.delete("/rules/:id", deleteFirewallRule);

module.exports = router;
