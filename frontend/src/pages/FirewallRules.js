import React, { useEffect, useState } from "react";
import { fetchFirewallRules, addFirewallRule, deleteFirewallRule } from "../services/api";
import { Shield, AlertTriangle, RefreshCw, PlusCircle, Trash, Edit, Eye } from "lucide-react";
import "./firewallrules.css";

const FirewallRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newRuleName, setNewRuleName] = useState("");
  const [newRulePattern, setNewRulePattern] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    setError("");
    try {
      const fetchedRules = await fetchFirewallRules();
      setRules(fetchedRules);
    } catch (err) {
      console.error("Error fetching firewall rules:", err);
      setError("Failed to load firewall rules");
      // Load sample data for demo purposes when API fails
      setRules(sampleRules);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleRetry = () => {
    fetchRules();
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRuleName || !newRulePattern) return;
  
    try {
      // Create a rule object instead of passing separate parameters
      const ruleData = {
        rule_name: newRuleName,
        rule_pattern: newRulePattern
      };
      
      const newRule = await addFirewallRule(ruleData);
      
      if (newRule) {
        // Create a temporary unique ID if server doesn't provide one
        const ruleWithId = newRule.id ? newRule : {...newRule, id: `temp-${Date.now()}`};
        setRules([...rules, ruleWithId]);
        setNewRuleName("");
        setNewRulePattern("");
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Failed to add rule:", error);
      setError("Failed to add new rule. Please try again.");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      await deleteFirewallRule(ruleId);
      setRules(rules.filter(rule => rule.id !== ruleId));
    } catch (error) {
      console.error("Failed to delete rule:", error);
      setError("Failed to delete rule. Please try again.");
    }
  };

  return (
    <div className="page firewall-rules-container">
      <div className="page-header">
        <div className="header-icon">
          <Shield size={24} className="icon-glow" />
        </div>
        <h1 className="text-3xl font-bold">Firewall Rules</h1>
        <div className="header-actions">
          <button className="cyberpunk-button" onClick={() => setShowAddForm(!showAddForm)}>
            <PlusCircle size={16} />
            <span>{showAddForm ? "Cancel" : "Add Rule"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="close-error">&times;</button>
        </div>
      )}

      {showAddForm && (
        <div className="add-rule-form">
          <h3>Add New Protection Rule</h3>
          <form onSubmit={handleAddRule}>
            <div className="form-group">
              <label htmlFor="ruleName">Rule Name:</label>
              <input 
                type="text" 
                id="ruleName" 
                placeholder="Rule Name" 
                value={newRuleName} 
                onChange={(e) => setNewRuleName(e.target.value)} 
                className="cyber-input"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="rulePattern">Rule Pattern:</label>
              <input 
                type="text" 
                id="rulePattern" 
                placeholder="Rule Pattern (Regex)" 
                value={newRulePattern} 
                onChange={(e) => setNewRulePattern(e.target.value)} 
                className="cyber-input"
                required
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="cyberpunk-button">
                <Shield size={16} />
                <span>Deploy Rule</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p className="text-cyan-400">Initializing firewall rule database...</p>
        </div>
      ) : error && rules.length === 0 ? (
        <div className="error-panel">
          <div className="error-header">
            <AlertTriangle size={24} className="text-red-500" />
            <span className="text-red-400 text-xl">Unable to connect to the firewall rules database</span>
          </div>
          <p className="text-gray-300 mt-2">
            Check your network connection or server status.
          </p>
          <button className="cyberpunk-button retry-button mt-4" onClick={handleRetry}>
            <RefreshCw size={16} className="mr-2" />
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          <div className="rules-header">
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Search security rules..." 
                className="search-input"
              />
            </div>
            <div className="rules-count">
              <span className="text-cyan-400 font-bold">{rules.length}</span> Active Rules
            </div>
          </div>

          <div className="rules-table-container">
            <table className="w-full cyberpunk-table">
              <thead>
                <tr>
                  <th className="text-left">Rule Name</th>
                  <th className="text-left">Pattern</th>
                  <th className="text-center">Type</th>
                  <th className="text-center">Severity</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.length > 0 ? (
                  rules.map((rule) => (
                    <tr key={rule.id} className="rule-row">
                      <td className="rule-name">
                        <span className="font-medium text-cyan-300">{rule.rule_name}</span>
                      </td>
                      <td className="rule-pattern">
                        <code>{rule.rule_pattern}</code>
                      </td>
                      <td className="rule-type text-center">
                        <span className={`type-badge ${rule.type?.toLowerCase() || 'pattern'}`}>
                          {rule.type || 'Pattern Match'}
                        </span>
                      </td>
                      <td className="rule-severity text-center">
                        <span className={`severity-badge ${rule.severity?.toLowerCase() || 'high'}`}>
                          {rule.severity || 'High'}
                        </span>
                      </td>
                      <td className="rule-status text-center">
                        <span className={`status-badge ${rule.active !== false ? 'active' : 'inactive'}`}>
                          {rule.active !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="rule-actions">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="action-button view" title="View Rule Details">
                            <Eye size={16} />
                          </button>
                          <button className="action-button edit" title="Edit Rule">
                            <Edit size={16} />
                          </button>
                          <button 
                            className="action-button delete" 
                            title="Delete Rule"
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-table-message">
                      <AlertTriangle className="warning-icon" />
                      <span className="cyber-alert-text">
                        No protection rules detected. System vulnerable.
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// Sample rules data for when API fails
const sampleRules = [
  {
    id: 1,
    rule_name: "Block SQL Injection",
    rule_pattern: "SELECT.*FROM|INSERT.*INTO|UPDATE.*SET|DELETE.*FROM",
    type: "Pattern",
    severity: "Critical",
    active: true
  },
  {
    id: 2,
    rule_name: "XSS Protection",
    rule_pattern: "<script>|javascript:|onerror=|onload=",
    type: "Pattern",
    severity: "High",
    active: true
  },
  {
    id: 3,
    rule_name: "Path Traversal",
    rule_pattern: "\\.\\./|%2e%2e%2f|/etc/passwd",
    type: "Path",
    severity: "High",
    active: true
  },
  {
    id: 4,
    rule_name: "Restrict Admin Access",
    rule_pattern: "/admin/.*",
    type: "URL",
    severity: "Medium",
    active: true
  },
  {
    id: 5,
    rule_name: "Block Known Bot IPs",
    rule_pattern: "IP_RANGE:103.235.46.0/24",
    type: "IP",
    severity: "Low",
    active: false
  }
];

export default FirewallRules;