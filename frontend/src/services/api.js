import axios from "axios";

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? "https://web-application-firewall-wqkd.onrender.com" 
  : "http://localhost:5000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true // Important for cookies
});

// Function to set auth token in headers
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Function to fetch firewall rules
export const fetchFirewallRules = async () => {
  try {
      // Make sure token is set before making request
      const token = localStorage.getItem('authToken');
      if (token) {
          setAuthToken(token);
      }
      
      const response = await api.get(`/firewall/rules`);
      return response.data;
  } catch (error) {
      console.error("Error fetching firewall rules:", error);
      throw error;
  }
};

// Function to add a new firewall rule
export const addFirewallRule = async (rule) => {
    try {
        const response = await api.post(`/firewall/rules`, rule);
        return response.data;
    } catch (error) {
        console.error("Error adding firewall rule:", error);
        throw error;
    }
};

// Function to delete a firewall rule
export const deleteFirewallRule = async (ruleId) => {
    try {
        await api.delete(`/firewall/rules/${ruleId}`);
        return true;
    } catch (error) {
        console.error("Error deleting firewall rule:", error);
        throw error;
    }
};

// Login function
export const login = async (username, password) => {
    try {
        const response = await api.post('/login', { username, password });
        const { token, user } = response.data;
        
        // Set token in axios defaults
        setAuthToken(token);
        
        // Store token in localStorage (optional, depends on your security requirements)
        localStorage.setItem('authToken', token);
        
        return { token, user };
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};

// Verify token function
export const verifyToken = async () => {
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            setAuthToken(token);
            const response = await api.get('/verify-token');
            return response.data;
        }
        return { valid: false };
    } catch (error) {
        console.error("Token verification failed:", error);
        return { valid: false };
    }
};

// Logout function
export const logout = async () => {
    try {
        const response = await api.post('/logout');
        localStorage.removeItem('authToken');
        setAuthToken(null);
        return response.data;
    } catch (error) {
        console.error('Logout failed:', error);
        throw error;
    }
};