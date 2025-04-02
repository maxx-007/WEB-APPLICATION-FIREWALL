import React, { useEffect, useState } from "react";
import axios from "axios";

const FirewallRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await axios.get("http://localhost:5000/firewall/rules");
        setRules(response.data); 
      } catch (err) {
        setError("Failed to load firewall rules");
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4">🔥 Firewall Rules</h1>

      {loading ? (
        <p className="text-yellow-400">Loading firewall rules...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="w-full border border-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="border border-gray-700 px-4 py-2">Rule Name</th>
              <th className="border border-gray-700 px-4 py-2">Pattern</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="bg-gray-700">
                <td className="border border-gray-600 px-4 py-2">{rule.rule_name}</td>
                <td className="border border-gray-600 px-4 py-2">{rule.rule_pattern}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FirewallRules;
