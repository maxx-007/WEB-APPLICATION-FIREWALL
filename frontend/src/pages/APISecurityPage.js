import React, { useState, useEffect } from 'react';
import { Server, Shield, AlertTriangle, XCircle, CheckCircle, Plus, Info, Edit, Trash2 } from 'lucide-react';
import './APISecurityPage.css';

const APISecurityPage = () => {
  const [activeTab, setActiveTab] = useState('endpoints');
  const [loading, setLoading] = useState(true);
  const [apiEndpoints, setApiEndpoints] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [showAddEndpointModal, setShowAddEndpointModal] = useState(false);
  const [showAddPolicyModal, setShowAddPolicyModal] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState({
    path: '',
    method: 'GET',
    description: '',
    rateLimitPerMin: 60,
    authentication: true,
  });
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    description: '',
    ruleType: 'rate-limiting',
    targetEndpoints: [],
    action: 'block',
    thresholdValue: 100,
    active: true
  });
  
  useEffect(() => {
    // Simulate API data loading with mock data
    setTimeout(() => {
      const mockEndpoints = [
        {
          id: 1,
          path: '/api/users',
          method: 'GET',
          description: 'Fetch all users',
          rateLimitPerMin: 30,
          authentication: true,
          vulnerabilityScore: 'Low'
        },
        {
          id: 2,
          path: '/api/auth/login',
          method: 'POST',
          description: 'User authentication',
          rateLimitPerMin: 10,
          authentication: false,
          vulnerabilityScore: 'Medium'
        },
        {
          id: 3,
          path: '/api/products',
          method: 'GET',
          description: 'Get all products',
          rateLimitPerMin: 100,
          authentication: false,
          vulnerabilityScore: 'Low'
        },
        {
          id: 4,
          path: '/api/admin/settings',
          method: 'PUT',
          description: 'Update system settings',
          rateLimitPerMin: 5,
          authentication: true,
          vulnerabilityScore: 'High'
        },
        {
          id: 5,
          path: '/api/files/upload',
          method: 'POST',
          description: 'File upload endpoint',
          rateLimitPerMin: 15,
          authentication: true,
          vulnerabilityScore: 'Critical'
        }
      ];
      
      const mockPolicies = [
        {
          id: 1,
          name: 'Rate Limiting - Public APIs',
          description: 'Limit request rates for public-facing APIs',
          ruleType: 'rate-limiting',
          targetEndpoints: ['/api/products', '/api/auth/login'],
          action: 'block',
          thresholdValue: 100,
          active: true,
          lastTriggered: '2023-06-10T15:32:29'
        },
        {
          id: 2,
          name: 'SQL Injection Prevention',
          description: 'Detect and block SQL injection attempts',
          ruleType: 'pattern-matching',
          targetEndpoints: ['*'],
          action: 'block',
          thresholdValue: null,
          active: true,
          lastTriggered: '2023-06-11T09:14:52'
        },
        {
          id: 3,
          name: 'Admin API Protection',
          description: 'Extra security measures for admin endpoints',
          ruleType: 'ip-restriction',
          targetEndpoints: ['/api/admin/*'],
          action: 'alert',
          thresholdValue: null,
          active: true,
          lastTriggered: null
        },
        {
          id: 4,
          name: 'File Upload Scanning',
          description: 'Scan uploaded files for malware',
          ruleType: 'content-validation',
          targetEndpoints: ['/api/files/upload'],
          action: 'block',
          thresholdValue: null,
          active: false,
          lastTriggered: '2023-06-09T11:22:33'
        }
      ];
      
      setApiEndpoints(mockEndpoints);
      setPolicies(mockPolicies);
      setLoading(false);
    }, 1500);
  }, []);
  
  const handleAddEndpoint = (e) => {
    e.preventDefault();
    // In a real application, this would be an API call
    // For demo, just add to state
    const newId = Math.max(...apiEndpoints.map(endpoint => endpoint.id), 0) + 1;
    const vulnerabilityScores = ['Low', 'Medium', 'High', 'Critical'];
    const randomScore = vulnerabilityScores[Math.floor(Math.random() * vulnerabilityScores.length)];
    
    const createdEndpoint = {
      ...newEndpoint,
      id: newId,
      vulnerabilityScore: randomScore
    };
    
    setApiEndpoints([...apiEndpoints, createdEndpoint]);
    setNewEndpoint({
      path: '',
      method: 'GET',
      description: '',
      rateLimitPerMin: 60,
      authentication: true,
    });
    setShowAddEndpointModal(false);
  };
  
  const handleAddPolicy = (e) => {
    e.preventDefault();
    // In a real application, this would be an API call
    // For demo, just add to state
    const newId = Math.max(...policies.map(policy => policy.id), 0) + 1;
    
    const createdPolicy = {
      ...newPolicy,
      id: newId,
      lastTriggered: null
    };
    
    setPolicies([...policies, createdPolicy]);
    setNewPolicy({
      name: '',
      description: '',
      ruleType: 'rate-limiting',
      targetEndpoints: [],
      action: 'block',
      thresholdValue: 100,
      active: true
    });
    setShowAddPolicyModal(false);
  };
  
  const togglePolicyStatus = (policyId) => {
    setPolicies(policies.map(policy => 
      policy.id === policyId ? {...policy, active: !policy.active} : policy
    ));
  };
  
  const deleteEndpoint = (endpointId) => {
    if (window.confirm('Are you sure you want to delete this endpoint?')) {
      setApiEndpoints(apiEndpoints.filter(endpoint => endpoint.id !== endpointId));
    }
  };
  
  const deletePolicy = (policyId) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      setPolicies(policies.filter(policy => policy.id !== policyId));
    }
  };
  
  // Helper to get appropriate color for vulnerability score
  const getVulnerabilityColor = (score) => {
    switch(score) {
      case 'Critical': return '#ff3366';
      case 'High': return '#ff9900';
      case 'Medium': return '#ffcc00';
      case 'Low': return '#03befc';
      default: return '#99a8c7';
    }
  };
  
  // Helper to get appropriate icon for rule type
  const getRuleTypeIcon = (type) => {
    switch(type) {
      case 'rate-limiting': return <Activity size={16} />;
      case 'pattern-matching': return <Search size={16} />;
      case 'ip-restriction': return <Globe size={16} />;
      case 'content-validation': return <FileText size={16} />;
      default: return <Shield size={16} />;
    }
  };
  
  return (
    <div className="api-security-page">
      <div className="panel-header">
        <div className="header-icon">
          <Server size={28} />
        </div>
        <h2>API Security</h2>
        <div className="tab-navigation">
          <button 
            className={activeTab === 'endpoints' ? 'active' : ''} 
            onClick={() => setActiveTab('endpoints')}
          >
            Endpoints
          </button>
          <button 
            className={activeTab === 'policies' ? 'active' : ''} 
            onClick={() => setActiveTab('policies')}
          >
            Security Policies
          </button>
          <button 
            className={activeTab === 'analytics' ? 'active' : ''} 
            onClick={() => setActiveTab('analytics')}
          >
            API Analytics
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading API security data...</p>
        </div>
      ) : (
        <>
          {/* API Endpoints Tab */}
          {activeTab === 'endpoints' && (
            <div className="endpoints-tab">
              <div className="tab-header">
                <h3>API Endpoints</h3>
                <button 
                  className="add-button"
                  onClick={() => setShowAddEndpointModal(true)}
                >
                  <Plus size={16} />
                  Add Endpoint
                </button>
              </div>
              
              <div className="security-summary">
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(3, 190, 252, 0.2)' }}>
                    <Server size={20} />
                  </div>
                  <div className="summary-info">
                    <span className="summary-value">{apiEndpoints.length}</span>
                    <span className="summary-label">Monitored Endpoints</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(255, 0, 255, 0.2)' }}>
                    <Shield size={20} />
                  </div>
                  <div className="summary-info">
                    <span className="summary-value">
                      {apiEndpoints.filter(e => e.authentication).length}
                    </span>
                    <span className="summary-label">Auth Protected</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(255, 51, 102, 0.2)' }}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="summary-info">
                    <span className="summary-value">
                      {apiEndpoints.filter(e => ['High', 'Critical'].includes(e.vulnerabilityScore)).length}
                    </span>
                    <span className="summary-label">High Risk Endpoints</span>
                  </div>
                </div>
              </div>
              
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Endpoint</th>
                      <th>Method</th>
                      <th>Description</th>
                      <th>Rate Limit</th>
                      <th>Auth</th>
                      <th>Risk</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiEndpoints.map(endpoint => (
                      <tr key={endpoint.id}>
                        <td>{endpoint.path}</td>
                        <td>
                          <span className={`method-badge ${endpoint.method.toLowerCase()}`}>
                            {endpoint.method}
                          </span>
                        </td>
                        <td>{endpoint.description}</td>
                        <td>{endpoint.rateLimitPerMin} req/min</td>
                        <td>
                          {endpoint.authentication ? 
                            <CheckCircle size={18} className="auth-icon yes" /> : 
                            <XCircle size={18} className="auth-icon no" />}
                        </td>
                        <td>
                          <span 
                            className="vulnerability-badge"
                            style={{ 
                              backgroundColor: `${getVulnerabilityColor(endpoint.vulnerabilityScore)}20`,
                              color: getVulnerabilityColor(endpoint.vulnerabilityScore)
                            }}
                          >
                            {endpoint.vulnerabilityScore}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="icon-button edit">
                              <Edit size={16} />
                            </button>
                            <button 
                              className="icon-button delete"
                              onClick={() => deleteEndpoint(endpoint.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Security Policies Tab */}
          {activeTab === 'policies' && (
            <div className="policies-tab">
              <div className="tab-header">
                <h3>Security Policies</h3>
                <button 
                  className="add-button"
                  onClick={() => setShowAddPolicyModal(true)}
                >
                  <Plus size={16} />
                  Add Policy
                </button>
              </div>
              
              <div className="security-summary">
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(3, 190, 252, 0.2)' }}>
                    <Shield size={20} />
                  </div>
                  <div className="summary-info">
                    <span className="summary-value">{policies.length}</span>
                    <span className="summary-label">Total Policies</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(0, 255, 170, 0.2)' }}>
                    <CheckCircle size={20} />
                  </div>
                  <div className="summary-info">
                    <span className="summary-value">
                      {policies.filter(p => p.active).length}
                    </span>
                    <span className="summary-label">Active Policies</span>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="summary-icon" style={{ backgroundColor: 'rgba(255, 0, 255, 0.2)' }}>
                    <XCircle size={20} />
                  </div>
                  <div className="summary-info">
                    <span className="summary-value">
                      {policies.filter(p => !p.active).length}
                    </span>
                    <span className="summary-label">Inactive Policies</span>
                  </div>
                </div>
              </div>
              
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Targets</th>
                      <th>Action</th>
                      <th>Last Triggered</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map(policy => (
                      <tr key={policy.id}>
                        <td>
                          <div className="policy-name-cell">
                            <Shield size={16} className="policy-icon" />
                            <div>
                              <div className="policy-name">{policy.name}</div>
                              <div className="policy-description">{policy.description}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`rule-type-badge ${policy.ruleType}`}>
                            {policy.ruleType.replace('-', ' ')}
                          </span>
                        </td>
                        <td>
                          <div className="target-endpoints">
                            {policy.targetEndpoints.map((target, index) => (
                              <span key={index} className="target-chip">
                                {target}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span className={`action-badge ${policy.action}`}>
                            {policy.action}
                          </span>
                        </td>
                        <td>
                          {policy.lastTriggered ? 
                            new Date(policy.lastTriggered).toLocaleString() : 
                            'Never'}
                        </td>
                        <td>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={policy.active}
                              onChange={() => togglePolicyStatus(policy.id)}
                            />
                            <span className="slider"></span>
                          </label>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="icon-button info">
                              <Info size={16} />
                            </button>
                            <button className="icon-button edit">
                              <Edit size={16} />
                            </button>
                            <button 
                              className="icon-button delete"
                              onClick={() => deletePolicy(policy.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* API Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              <div className="tab-header">
                <h3>API Analytics</h3>
                <div className="time-filter">
                  <span>Time Range:</span>
                  <select>
                    <option>Last 24 Hours</option>
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>Custom Range</option>
                  </select>
                </div>
              </div>
              
              <div className="analytics-dashboard">
                <div className="analytics-card total-requests">
                  <h4>Total API Requests</h4>
                  <div className="stat-value">42,849</div>
                  <div className="trend up">+12.5% from previous period</div>
                </div>
                
                <div className="analytics-card blocked-requests">
                  <h4>Blocked Requests</h4>
                  <div className="stat-value">1,284</div>
                  <div className="trend down">-3.2% from previous period</div>
                </div>
                
                <div className="analytics-card avg-response">
                  <h4>Avg. Response Time</h4>
                  <div className="stat-value">128ms</div>
                  <div className="trend neutral">+2ms from previous period</div>
                </div>
                
                <div className="analytics-card error-rate">
                  <h4>Error Rate</h4>
                  <div className="stat-value">2.4%</div>
                  <div className="trend down">-0.5% from previous period</div>
                </div>
                
                <div className="analytics-graph">
                  <h4>API Traffic Overview</h4>
                  <div className="graph-placeholder">
                    <div className="graph-message">
                      <Server size={24} />
                      <p>Interactive traffic graph would appear here</p>
                      <p className="small-text">Displays API request volume, response times, and error rates over time</p>
                    </div>
                  </div>
                </div>
                
                <div className="analytics-table">
                  <h4>Top API Routes</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Endpoint</th>
                        <th>Requests</th>
                        <th>Avg. Time</th>
                        <th>Error %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>/api/auth/login</td>
                        <td>12,456</td>
                        <td>95ms</td>
                        <td>1.2%</td>
                      </tr>
                      <tr>
                        <td>/api/products</td>
                        <td>8,932</td>
                        <td>115ms</td>
                        <td>0.8%</td>
                      </tr>
                      <tr>
                        <td>/api/users</td>
                        <td>5,678</td>
                        <td>140ms</td>
                        <td>1.7%</td>
                      </tr>
                      <tr>
                        <td>/api/files/upload</td>
                        <td>2,345</td>
                        <td>320ms</td>
                        <td>4.3%</td>
                      </tr>
                      <tr>
                        <td>/api/admin/settings</td>
                        <td>1,289</td>
                        <td>110ms</td>
                        <td>1.9%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Add Endpoint Modal */}
      {showAddEndpointModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New API Endpoint</h3>
              <button 
                className="close-button" 
                onClick={() => setShowAddEndpointModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddEndpoint}>
              <div className="form-group">
                <label>Path</label>
                <input 
                  type="text" 
                  value={newEndpoint.path}
                  onChange={e => setNewEndpoint({...newEndpoint, path: e.target.value})}
                  placeholder="/api/resource"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>HTTP Method</label>
                <select 
                  value={newEndpoint.method}
                  onChange={e => setNewEndpoint({...newEndpoint, method: e.target.value})}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  value={newEndpoint.description}
                  onChange={e => setNewEndpoint({...newEndpoint, description: e.target.value})}
                  placeholder="Brief description of this endpoint"
                />
              </div>
              
              <div className="form-group">
                <label>Rate Limit (req/min)</label>
                <input 
                  type="number" 
                  value={newEndpoint.rateLimitPerMin}
                  onChange={e => setNewEndpoint({...newEndpoint, rateLimitPerMin: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={newEndpoint.authentication}
                    onChange={e => setNewEndpoint({...newEndpoint, authentication: e.target.checked})}
                  />
                  Requires Authentication
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddEndpointModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Add Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Policy Modal */}
      {showAddPolicyModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Security Policy</h3>
              <button 
                className="close-button" 
                onClick={() => setShowAddPolicyModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddPolicy}>
              <div className="form-group">
                <label>Policy Name</label>
                <input 
                  type="text" 
                  value={newPolicy.name}
                  onChange={e => setNewPolicy({...newPolicy, name: e.target.value})}
                  placeholder="Security Policy Name"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={newPolicy.description}
                  onChange={e => setNewPolicy({...newPolicy, description: e.target.value})}
                  placeholder="Describe what this policy does"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label>Rule Type</label>
                <select 
                  value={newPolicy.ruleType}
                  onChange={e => setNewPolicy({...newPolicy, ruleType: e.target.value})}
                >
                  <option value="rate-limiting">Rate Limiting</option>
                  <option value="pattern-matching">Pattern Matching</option>
                  <option value="ip-restriction">IP Restriction</option>
                  <option value="content-validation">Content Validation</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Target Endpoints (comma separated)</label>
                <input 
                  type="text" 
                  value={newPolicy.targetEndpoints.join(', ')}
                  onChange={e => setNewPolicy({
                    ...newPolicy, 
                    targetEndpoints: e.target.value.split(',').map(s => s.trim())
                  })}
                  placeholder="/api/resource, /api/other/*"
                />
              </div>
              
              <div className="form-group">
                <label>Action</label>
                <select 
                  value={newPolicy.action}
                  onChange={e => setNewPolicy({...newPolicy, action: e.target.value})}
                >
                  <option value="block">Block</option>
                  <option value="alert">Alert Only</option>
                  <option value="challenge">Challenge</option>
                  <option value="throttle">Throttle</option>
                </select>
              </div>
              
              {newPolicy.ruleType === 'rate-limiting' && (
                <div className="form-group">
                  <label>Threshold (req/min)</label>
                  <input 
                    type="number" 
                    value={newPolicy.thresholdValue}
                    onChange={e => setNewPolicy({...newPolicy, thresholdValue: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
              )}
              
              <div className="form-group checkbox-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={newPolicy.active}
                    onChange={e => setNewPolicy({...newPolicy, active: e.target.checked})}
                  />
                  Enable Policy
                </label>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddPolicyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Add Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Missing component imports for the analytics tab
const Activity = () => <div style={{ width: 16, height: 16 }}></div>;
const Search = () => <div style={{ width: 16, height: 16 }}></div>;
const Globe = () => <div style={{ width: 16, height: 16 }}></div>;
const FileText = () => <div style={{ width: 16, height: 16 }}></div>;

export default APISecurityPage; 