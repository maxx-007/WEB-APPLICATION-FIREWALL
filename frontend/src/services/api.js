import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // Adjust this if your backend runs on a different port

// Function to fetch firewall rules
export const fetchFirewallRules = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/firewall/rules`);
        return response.data;
    } catch (error) {
        console.error("Error fetching firewall rules:", error);
        return [];
    }
};

// Function to add a new firewall rule
export const addFirewallRule = async (rule) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/firewall/rules`, rule);
        return response.data;
    } catch (error) {
        console.error("Error adding firewall rule:", error);
        return null;
    }
};

// Function to delete a firewall rule
export const deleteFirewallRule = async (ruleId) => {
    try {
        await axios.delete(`${API_BASE_URL}/firewall/rules/${ruleId}`);
    } catch (error) {
        console.error("Error deleting firewall rule:", error);
    }
};
