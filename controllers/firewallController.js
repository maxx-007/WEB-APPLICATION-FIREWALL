const db = require("../config/dbMySQL");

// 📌 Get all firewall rules
const getFirewallRules = (req, res) => {
  db.query("SELECT * FROM firewall_rules", (err, results) => {
    if (err) {
      console.error("Error fetching rules:", err);
      return res.status(500).json({ error: "Database Error" });
    }
    res.json(results);
  });
};

// 📌 Add a new firewall rule
const addFirewallRule = (req, res) => {
  const { rule_name, rule_pattern } = req.body;
  if (!rule_name || !rule_pattern) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO firewall_rules (rule_name, rule_pattern) VALUES (?, ?)";
  db.query(sql, [rule_name, rule_pattern], (err, result) => {
    if (err) {
      console.error("Error adding rule:", err);
      return res.status(500).json({ error: "Database Error" });
    }
    res.json({ message: "Rule added successfully", id: result.insertId });
  });
};

// 📌 Update an existing firewall rule
const updateFirewallRule = (req, res) => {
  const { id } = req.params;
  const { rule_name, rule_pattern } = req.body;
  
  if (!rule_name || !rule_pattern) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "UPDATE firewall_rules SET rule_name = ?, rule_pattern = ? WHERE id = ?";
  db.query(sql, [rule_name, rule_pattern, id], (err, result) => {
    if (err) {
      console.error("Error updating rule:", err);
      return res.status(500).json({ error: "Database Error" });
    }
    res.json({ message: "Rule updated successfully" });
  });
};

// 📌 Delete a firewall rule
const deleteFirewallRule = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM firewall_rules WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting rule:", err);
      return res.status(500).json({ error: "Database Error" });
    }
    res.json({ message: "Rule deleted successfully" });
  });
};

module.exports = {
  getFirewallRules,
  addFirewallRule,
  updateFirewallRule,
  deleteFirewallRule
};
