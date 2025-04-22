import React, { useState, useEffect } from 'react';
import { 
  Globe, Shield, AlertTriangle, MapPin, BarChart2, Plus, Trash2, 
  Check, X, Upload, Download, RefreshCw, Search
} from 'lucide-react';
import './IPManagement.css';

const IPManagement = () => {
  const [activeTab, setActiveTab] = useState('blocklist');
  const [loading, setLoading] = useState(true);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [allowedIPs, setAllowedIPs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIPEntry, setNewIPEntry] = useState({
    ip: '',
    type: 'block', // 'block' or 'allow'
    notes: '',
    expiration: '',
    networkPrefix: 32, // For CIDR notation
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  useEffect(() => {
    // Simulate loading data with mock data
    setTimeout(() => {
      const mockBlockedIPs = [
        {
          id: 1,
          ip: '192.168.1.1',
          cidr: '192.168.1.1/32',
          status: 'active',
          dateAdded: '2023-06-01T10:21:32',
          expiration: '2023-12-01T00:00:00',
          reason: 'Repeated login attempts',
          incidents: 28,
          country: 'United States',
          automatic: false
        },
        {
          id: 2,
          ip: '10.0.0.1',
          cidr: '10.0.0.0/24',
          status: 'active',
          dateAdded: '2023-05-15T08:43:10',
          expiration: null,
          reason: 'Known malicious network',
          incidents: 153,
          country: 'Russia',
          automatic: false
        },
        {
          id: 3,
          ip: '203.0.113.50',
          cidr: '203.0.113.50/32',
          status: 'expired',
          dateAdded: '2023-04-23T14:32:45',
          expiration: '2023-05-23T14:32:45',
          reason: 'SQL injection attempts',
          incidents: 12,
          country: 'China',
          automatic: true
        },
        {
          id: 4,
          ip: '198.51.100.76',
          cidr: '198.51.100.76/32',
          status: 'active',
          dateAdded: '2023-06-10T11:05:22',
          expiration: '2023-09-10T11:05:22',
          reason: 'XSS attack attempts',
          incidents: 47,
          country: 'Ukraine',
          automatic: true
        },
        {
          id: 5,
          ip: '172.16.0.1',
          cidr: '172.16.0.0/16',
          status: 'active',
          dateAdded: '2023-06-12T16:23:11',
          expiration: null,
          reason: 'Corporate network block',
          incidents: 0,
          country: 'Various',
          automatic: false
        }
      ];
      
      const mockAllowedIPs = [
        {
          id: 1,
          ip: '192.168.5.10',
          cidr: '192.168.5.10/32',
          status: 'active',
          dateAdded: '2023-06-05T09:12:30',
          expiration: null,
          notes: 'Office network',
          country: 'United States'
        },
        {
          id: 2,
          ip: '172.20.0.1',
          cidr: '172.20.0.0/16',
          status: 'active',
          dateAdded: '2023-05-20T15:33:42',
          expiration: null,
          notes: 'VPN network range',
          country: 'Global'
        },
        {
          id: 3,
          ip: '10.10.10.5',
          cidr: '10.10.10.5/32',
          status: 'expired',
          dateAdded: '2023-04-10T11:45:36',
          expiration: '2023-05-10T11:45:36',
          notes: 'Temporary developer access',
          country: 'Canada'
        }
      ];
      
      setBlockedIPs(mockBlockedIPs);
      setAllowedIPs(mockAllowedIPs);
      setLoading(false);
    }, 1500);
  }, []);
  
  const handleAddIP = (e) => {
    e.preventDefault();
    // In real app, would call API to add IP
    const now = new Date().toISOString();
    const newEntry = {
      id: Math.floor(Math.random() * 10000),
      ip: newIPEntry.ip,
      cidr: `${newIPEntry.ip}/${newIPEntry.networkPrefix}`,
      status: 'active',
      dateAdded: now,
      expiration: newIPEntry.expiration || null,
      country: 'Unknown',
      automatic: false
    };
    
    if (newIPEntry.type === 'block') {
      newEntry.reason = newIPEntry.notes;
      newEntry.incidents = 0;
      setBlockedIPs([...blockedIPs, newEntry]);
    } else {
      newEntry.notes = newIPEntry.notes;
      setAllowedIPs([...allowedIPs, newEntry]);
    }
    
    // Reset form
    setNewIPEntry({
      ip: '',
      type: 'block',
      notes: '',
      expiration: '',
      networkPrefix: 32
    });
    setShowAddModal(false);
  };
  
  const handleDeleteIP = (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type === 'block' ? 'blocked' : 'allowed'} IP?`)) {
      if (type === 'block') {
        setBlockedIPs(blockedIPs.filter(ip => ip.id !== id));
      } else {
        setAllowedIPs(allowedIPs.filter(ip => ip.id !== id));
      }
    }
  };
  
  // Filter functions
  const getFilteredIPs = (ips) => {
    return ips
      .filter(ip => 
        ip.ip.includes(searchQuery) || 
        ip.cidr.includes(searchQuery) ||
        (ip.reason && ip.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (ip.notes && ip.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ip.country.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter(ip => filterStatus === 'all' || ip.status === filterStatus);
  };
  
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleBulkAction = (action) => {
    // In a real app, this would trigger API calls or file uploads/downloads
    alert(`In a real application, this would ${action === 'import' ? 'import' : 'export'} IP lists.`);
  };
  
  return (
    <div className="ip-management-page">
      <div className="panel-header">
        <div className="header-icon">
          <Globe size={28} />
        </div>
        <h2>IP Management</h2>
      </div>
      
      <div className="tab-navigation-secondary">
        <button 
          className={activeTab === 'blocklist' ? 'active' : ''} 
          onClick={() => setActiveTab('blocklist')}
        >
          <Shield size={16} />
          IP Blocklist
        </button>
        <button 
          className={activeTab === 'allowlist' ? 'active' : ''} 
          onClick={() => setActiveTab('allowlist')}
        >
          <Check size={16} />
          IP Allowlist
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''} 
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart2 size={16} />
          Traffic Analytics
        </button>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading IP data...</p>
        </div>
      ) : (
        <>
          {(activeTab === 'blocklist' || activeTab === 'allowlist') && (
            <div className="ip-list-container">
              <div className="action-bar">
                <div className="action-bar-left">
                  <button 
                    className="action-button primary"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={16} />
                    Add IP {activeTab === 'blocklist' ? 'Block' : 'Exception'}
                  </button>
                  <button 
                    className="action-button"
                    onClick={() => handleBulkAction('import')}
                  >
                    <Upload size={16} />
                    Import
                  </button>
                  <button 
                    className="action-button"
                    onClick={() => handleBulkAction('export')}
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>
                
                <div className="action-bar-right">
                  <div className="search-container">
                    <Search size={16} />
                    <input 
                      type="text" 
                      placeholder="Search IP addresses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="status-filter"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                  </select>
                  
                  <button 
                    className="action-button icon-only"
                    onClick={handleRefresh}
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
              
              <div className="ip-metrics">
                {activeTab === 'blocklist' && (
                  <>
                    <div className="metric-tile">
                      <div className="metric-value">{blockedIPs.filter(ip => ip.status === 'active').length}</div>
                      <div className="metric-label">Active Blocks</div>
                    </div>
                    
                    <div className="metric-tile">
                      <div className="metric-value">{blockedIPs.filter(ip => ip.automatic).length}</div>
                      <div className="metric-label">Auto-Generated</div>
                    </div>
                    
                    <div className="metric-tile">
                      <div className="metric-value">{blockedIPs.filter(ip => ip.cidr.includes('/32')).length}</div>
                      <div className="metric-label">Single IPs</div>
                    </div>
                    
                    <div className="metric-tile">
                      <div className="metric-value">{blockedIPs.filter(ip => !ip.cidr.includes('/32')).length}</div>
                      <div className="metric-label">IP Ranges</div>
                    </div>
                  </>
                )}
                
                {activeTab === 'allowlist' && (
                  <>
                    <div className="metric-tile">
                      <div className="metric-value">{allowedIPs.filter(ip => ip.status === 'active').length}</div>
                      <div className="metric-label">Active Exceptions</div>
                    </div>
                    
                    <div className="metric-tile">
                      <div className="metric-value">{allowedIPs.filter(ip => ip.cidr.includes('/32')).length}</div>
                      <div className="metric-label">Single IPs</div>
                    </div>
                    
                    <div className="metric-tile">
                      <div className="metric-value">{allowedIPs.filter(ip => !ip.cidr.includes('/32')).length}</div>
                      <div className="metric-label">IP Ranges</div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="ip-table-container">
                {activeTab === 'blocklist' && (
                  <table className="ip-table">
                    <thead>
                      <tr>
                        <th>IP Address/Range</th>
                        <th>Status</th>
                        <th>Date Added</th>
                        <th>Expiration</th>
                        <th>Reason</th>
                        <th>Incidents</th>
                        <th>Country</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredIPs(blockedIPs).map(ip => (
                        <tr key={ip.id} className={ip.status === 'expired' ? 'row-expired' : ''}>
                          <td>
                            <div className="ip-cell">
                              <span className="monospace">{ip.cidr}</span>
                              {ip.automatic && <span className="auto-tag">Auto</span>}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${ip.status}`}>
                              {ip.status}
                            </span>
                          </td>
                          <td>{new Date(ip.dateAdded).toLocaleDateString()}</td>
                          <td>
                            {ip.expiration ? new Date(ip.expiration).toLocaleDateString() : 'Never'}
                          </td>
                          <td>{ip.reason}</td>
                          <td>{ip.incidents}</td>
                          <td>
                            <div className="country-cell">
                              <MapPin size={14} />
                              {ip.country}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="icon-button delete"
                                onClick={() => handleDeleteIP(ip.id, 'block')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {activeTab === 'allowlist' && (
                  <table className="ip-table">
                    <thead>
                      <tr>
                        <th>IP Address/Range</th>
                        <th>Status</th>
                        <th>Date Added</th>
                        <th>Expiration</th>
                        <th>Notes</th>
                        <th>Country</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredIPs(allowedIPs).map(ip => (
                        <tr key={ip.id} className={ip.status === 'expired' ? 'row-expired' : ''}>
                          <td>
                            <div className="ip-cell">
                              <span className="monospace">{ip.cidr}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${ip.status}`}>
                              {ip.status}
                            </span>
                          </td>
                          <td>{new Date(ip.dateAdded).toLocaleDateString()}</td>
                          <td>
                            {ip.expiration ? new Date(ip.expiration).toLocaleDateString() : 'Never'}
                          </td>
                          <td>{ip.notes}</td>
                          <td>
                            <div className="country-cell">
                              <MapPin size={14} />
                              {ip.country}
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="icon-button delete"
                                onClick={() => handleDeleteIP(ip.id, 'allow')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="analytics-container">
              <div className="metrics-row">
                <div className="metric-card">
                  <div className="metric-icon">
                    <Shield size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-title">Blocked Requests</div>
                    <div className="metric-value-large">4,328</div>
                    <div className="metric-subtitle">Last 7 days</div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-title">Top Malicious Country</div>
                    <div className="metric-value-large">Russia</div>
                    <div className="metric-subtitle">32% of all blocks</div>
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-icon">
                    <Globe size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-title">Total Protected IPs</div>
                    <div className="metric-value-large">2.1M+</div>
                    <div className="metric-subtitle">IP addresses in range</div>
                  </div>
                </div>
              </div>
              
              <div className="charts-container">
                <div className="chart-panel">
                  <h3>Blocked Requests by Country</h3>
                  <div className="chart-placeholder">
                    <div className="placeholder-message">
                      Interactive geographical chart would appear here, showing blocked requests by country
                    </div>
                  </div>
                </div>
                
                <div className="chart-panel">
                  <h3>Block Trend (Last 30 Days)</h3>
                  <div className="chart-placeholder">
                    <div className="placeholder-message">
                      Line chart would appear here, showing daily blocked request counts over time
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="threat-intelligence-panel">
                <h3>Top Threat Intelligence</h3>
                <div className="threat-intel-grid">
                  <div className="threat-intel-card">
                    <div className="threat-intel-header">
                      <Shield size={18} />
                      <h4>BotNet Activity</h4>
                    </div>
                    <p className="threat-text">
                      Multiple IP ranges showing coordinated scan patterns detected from Asia-Pacific region.
                    </p>
                    <div className="threat-footer">
                      <span className="threat-level high">High Risk</span>
                      <span className="threat-time">2 hours ago</span>
                    </div>
                  </div>
                  
                  <div className="threat-intel-card">
                    <div className="threat-intel-header">
                      <AlertTriangle size={18} />
                      <h4>Brute Force Attacks</h4>
                    </div>
                    <p className="threat-text">
                      Increased login attempt failures from Eastern European IP ranges detected.
                    </p>
                    <div className="threat-footer">
                      <span className="threat-level medium">Medium Risk</span>
                      <span className="threat-time">6 hours ago</span>
                    </div>
                  </div>
                  
                  <div className="threat-intel-card">
                    <div className="threat-intel-header">
                      <Globe size={18} />
                      <h4>New Attack Vector</h4>
                    </div>
                    <p className="threat-text">
                      Novel injection technique targeting API endpoints identified from several IPs.
                    </p>
                    <div className="threat-footer">
                      <span className="threat-level critical">Critical Risk</span>
                      <span className="threat-time">12 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Add IP Modal */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {activeTab === 'blocklist' ? 'Add IP Block' : 'Add IP Exception'}
              </h3>
              <button 
                className="close-button" 
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddIP}>
              <div className="form-group">
                <label>IP Address</label>
                <input 
                  type="text" 
                  value={newIPEntry.ip}
                  onChange={e => setNewIPEntry({...newIPEntry, ip: e.target.value})}
                  placeholder="e.g. 192.168.1.1"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Network Prefix (CIDR Notation)</label>
                <select 
                  value={newIPEntry.networkPrefix}
                  onChange={e => setNewIPEntry({...newIPEntry, networkPrefix: parseInt(e.target.value)})}
                >
                  <option value="32">Single IP (/32)</option>
                  <option value="24">Class C Network (/24)</option>
                  <option value="16">Class B Network (/16)</option>
                  <option value="8">Class A Network (/8)</option>
                </select>
              </div>
              
              {activeTab === 'blocklist' && (
                <div className="form-group">
                  <label>
                    {newIPEntry.type === 'block' ? 'Reason for Blocking' : 'Notes'}
                  </label>
                  <textarea 
                    value={newIPEntry.notes}
                    onChange={e => setNewIPEntry({...newIPEntry, notes: e.target.value})}
                    placeholder={newIPEntry.type === 'block' ? 'Why is this IP being blocked?' : 'Notes about this IP exception'}
                    rows="3"
                  />
                </div>
              )}
              
              {activeTab === 'allowlist' && (
                <div className="form-group">
                  <label>Notes</label>
                  <textarea 
                    value={newIPEntry.notes}
                    onChange={e => setNewIPEntry({...newIPEntry, notes: e.target.value})}
                    placeholder="Notes about this IP exception"
                    rows="3"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label>Expiration (Optional)</label>
                <input 
                  type="datetime-local" 
                  value={newIPEntry.expiration}
                  onChange={e => setNewIPEntry({...newIPEntry, expiration: e.target.value})}
                />
                <small>Leave blank for permanent {activeTab === 'blocklist' ? 'block' : 'exception'}</small>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  {activeTab === 'blocklist' ? 'Add Block' : 'Add Exception'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPManagement; 