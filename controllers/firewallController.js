const { db, dbPromise } = require("../config/dbMySQL");

// 📌 Get all firewall rules
const getFirewallRules = async (req, res) => {
  try {
    const [results] = await dbPromise.execute("SELECT * FROM firewall_rules ORDER BY severity DESC, created_at DESC");
    res.json(results);
  } catch (err) {
    console.error("Error fetching rules:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Add a new firewall rule
const addFirewallRule = async (req, res) => {
  const { rule_name, rule_pattern, rule_type = 'BLOCK', description = '', severity = 'MEDIUM' } = req.body;
  
  if (!rule_name || !rule_pattern) {
    return res.status(400).json({ error: "Rule name and pattern are required" });
  }

  try {
    const sql = "INSERT INTO firewall_rules (rule_name, rule_pattern, rule_type, description, severity, created_by) VALUES (?, ?, ?, ?, ?, ?)";
    const [result] = await dbPromise.execute(sql, [rule_name, rule_pattern, rule_type, description, severity, req.user?.username || 'admin']);
    res.json({ message: "Rule added successfully", id: result.insertId });
  } catch (err) {
    console.error("Error adding rule:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Update an existing firewall rule
const updateFirewallRule = async (req, res) => {
  const { id } = req.params;
  const { rule_name, rule_pattern, rule_type, description, severity, is_active } = req.body;
  
  if (!rule_name || !rule_pattern) {
    return res.status(400).json({ error: "Rule name and pattern are required" });
  }

  try {
    const sql = "UPDATE firewall_rules SET rule_name = ?, rule_pattern = ?, rule_type = ?, description = ?, severity = ?, is_active = ?, updated_at = NOW() WHERE id = ?";
    const [result] = await dbPromise.execute(sql, [rule_name, rule_pattern, rule_type || 'BLOCK', description || '', severity || 'MEDIUM', is_active !== undefined ? is_active : true, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Rule not found" });
    }
    
    res.json({ message: "Rule updated successfully" });
  } catch (err) {
    console.error("Error updating rule:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Toggle rule active status
const toggleFirewallRule = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = "UPDATE firewall_rules SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?";
    const [result] = await dbPromise.execute(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Rule not found" });
    }
    
    res.json({ message: "Rule status toggled successfully" });
  } catch (err) {
    console.error("Error toggling rule:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

// 📌 Delete a firewall rule
const deleteFirewallRule = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = "DELETE FROM firewall_rules WHERE id = ?";
    const [result] = await dbPromise.execute(sql, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Rule not found" });
    }
    
    res.json({ message: "Rule deleted successfully" });
  } catch (err) {
    console.error("Error deleting rule:", err);
    res.status(500).json({ error: "Database Error", details: err.message });
  }
};

module.exports = {
  getFirewallRules,
  addFirewallRule,
  updateFirewallRule,
  toggleFirewallRule,
  deleteFirewallRule
};
