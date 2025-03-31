const express = require("express");
const router = express.Router();
const logsController = require("../controllers/logsController");

// Logs Routes
router.get("/attacks", logsController.getAttackLogs);
router.get("/traffic", logsController.getTrafficLogs);

module.exports = router;
