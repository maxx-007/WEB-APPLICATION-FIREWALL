import React, { useEffect, useState } from "react";
import { fetchFirewallRules, addFirewallRule, deleteFirewallRule } from "../services/api";
const Dashboard = () => {
    const [rules, setRules] = useState([]);
    const [newRuleName, setNewRuleName] = useState("");
    const [newRulePattern, setNewRulePattern] = useState("");

    // Fetch firewall rules when the component loads
    useEffect(() => {
        async function loadRules() {
            const fetchedRules = await fetchFirewallRules();
            setRules(fetchedRules);
        }
        loadRules();
    }, []);

    // Handle adding a new rule
    const handleAddRule = async (e) => {
        e.preventDefault();
        if (!newRuleName || !newRulePattern) return;

        const newRule = await addFirewallRule(newRuleName, newRulePattern);
        if (newRule) {
            setRules([...rules, newRule]); // Update UI with new rule
            setNewRuleName("");
            setNewRulePattern("");
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">🔥 Firewall Rules</h2>
            
            {/* Add Firewall Rule Form */}
            <form onSubmit={handleAddRule} className="mb-4">
                <input 
                    type="text" 
                    placeholder="Rule Name" 
                    value={newRuleName} 
                    onChange={(e) => setNewRuleName(e.target.value)} 
                    className="border p-2 mr-2"
                />
                <input 
                    type="text" 
                    placeholder="Rule Pattern" 
                    value={newRulePattern} 
                    onChange={(e) => setNewRulePattern(e.target.value)} 
                    className="border p-2 mr-2"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                    ➕ Add Rule
                </button>
            </form>

            {/* Display Firewall Rules */}
            <table className="w-full border-collapse border">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border p-2">Rule Name</th>
                        <th className="border p-2">Rule Pattern</th>
                    </tr>
                </thead>
                <tbody>
                    {rules.length > 0 ? (
                        rules.map((rule, index) => (
                            <tr key={index} className="border">
                                <td className="border p-2">{rule.rule_name}</td>
                                <td className="border p-2">{rule.rule_pattern}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="2" className="text-center p-4">No rules found.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;
