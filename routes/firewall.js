const express = require("express");
const router = express.Router();
const firewallController = require("../controllers/firewallController");

// Firewall Rules Routes
router.post("/rules", firewallController.addRule);
router.get("/rules", firewallController.getRules);
router.delete("/rules/:id", firewallController.deleteRule);

module.exports = router;
