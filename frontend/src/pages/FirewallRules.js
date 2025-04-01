import { useEffect, useState } from "react";
import axios from "axios";

const FirewallRules = () => {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/firewall/rules")
      .then(res => setRules(res.data))
      .catch(err => console.error("Error fetching rules:", err));
  }, []);

  return (
    <div>
      <h2>Firewall Rules</h2>
      <table>
        <thead>
          <tr>
            <th>Rule Name</th>
            <th>Pattern</th>
          </tr>
        </thead>
        <tbody>
          {rules.map(rule => (
            <tr key={rule.id}>
              <td>{rule.rule_name}</td>
              <td>{rule.rule_pattern}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FirewallRules;
