// Centralized API configuration
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://web-application-firewall-wqkd.onrender.com'
    : 'http://localhost:5000',
  
  // Helper function to get full API URL
  getUrl: (endpoint) => {
    const baseUrl = API_CONFIG.BASE_URL;
    return endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`;
  }
};

export default API_CONFIG;