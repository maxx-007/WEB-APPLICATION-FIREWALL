import axios from "axios";

const API_BASE_URL = "http://localhost:5000"; // Change this if your backend URL is different

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, { username, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Login failed" };
  }
};

export const fetchAttackLogs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/logs/attacks`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch logs" };
  }
};

export const fetchFirewallRules = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/firewall/rules`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch firewall rules" };
  }
};
