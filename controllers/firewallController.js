const db = require("../config/dbMySQL");

// Add a new firewall rule
exports.addRule = (req, res) => {
    const { rule_name, rule_pattern, action } = req.body;
    const query = "INSERT INTO firewall_rules (rule_name, rule_pattern, action) VALUES (?, ?, ?)";
    
    db.query(query, [rule_name, rule_pattern, action], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.status(201).json({ message: "Firewall rule added", ruleId: result.insertId });
    });
};

// Get all firewall rules
exports.getRules = (req, res) => {
    const query = "SELECT * FROM firewall_rules";
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        res.status(200).json(results);
    });
};

// Delete a firewall rule
exports.deleteRule = (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM firewall_rules WHERE id = ?";
    
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error", details: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Rule not found" });
        }
        res.status(200).json({ message: "Firewall rule deleted" });
    });
};
