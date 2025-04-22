import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  Bell, 
  Shield, 
  Key, 
  Save, 
  RefreshCw,
  Database,
  Server,
  Globe,
  Clock
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'WAF Defender',
    adminEmail: 'admin@example.com',
    enableNotifications: true,
    notificationEmail: 'alerts@example.com',
    dataRetentionDays: 30,
    theme: 'dark',
    autoBlockAttacks: true,
    sensitiveDataMasking: true
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    rateLimit: 100,
    maxRequestSize: 10,
    allowedIPs: '',
    blockTor: true,
    blockAnonymousProxies: true,
    ipGeolocation: true,
    requestValidation: true,
    sqlInjectionProtection: true,
    xssProtection: true,
    csrfProtection: true
  });
  
  const [apiSettings, setApiSettings] = useState({
    enableApi: true,
    requireApiKey: true,
    rateLimitApi: 1000,
    allowCors: false,
    corsOrigins: '',
    apiTimeout: 30,
    enableWebhooks: true,
    webhookUrl: 'https://example.com/webhook'
  });
  
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 7,
    backupLocation: 'local',
    backupEncryption: true,
    lastBackup: '2023-06-10T15:30:45'
  });
  
  useEffect(() => {
    // Simulate loading settings from server
    setTimeout(() => {
      setLoading(false);
    }, 1200);
  }, []);
  
  const handleSaveSettings = (section) => {
    // Show saving indicator
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      
      // Show success message
      alert(`${section} settings saved successfully!`);
    }, 800);
  };
  
  const handleInputChange = (section, field, value) => {
    // Handle different setting sections
    switch(section) {
      case 'general':
        setGeneralSettings(prev => ({ ...prev, [field]: value }));
        break;
      case 'security':
        setSecuritySettings(prev => ({ ...prev, [field]: value }));
        break;
      case 'api':
        setApiSettings(prev => ({ ...prev, [field]: value }));
        break;
      case 'backup':
        setBackupSettings(prev => ({ ...prev, [field]: value }));
        break;
      default:
        break;
    }
  };
  
  // Toggle input handler for checkboxes
  const handleToggle = (section, field) => {
    // Handle different setting sections
    switch(section) {
      case 'general':
        setGeneralSettings(prev => ({ ...prev, [field]: !prev[field] }));
        break;
      case 'security':
        setSecuritySettings(prev => ({ ...prev, [field]: !prev[field] }));
        break;
      case 'api':
        setApiSettings(prev => ({ ...prev, [field]: !prev[field] }));
        break;
      case 'backup':
        setBackupSettings(prev => ({ ...prev, [field]: !prev[field] }));
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="settings-page">
      <div className="panel-header">
        <div className="header-icon">
          <SettingsIcon size={28} />
        </div>
        <h2>System Settings</h2>
      </div>
      
      <div className="settings-container">
        <div className="settings-sidebar">
          <button 
            className={activeTab === 'general' ? 'active' : ''}
            onClick={() => setActiveTab('general')}
          >
            <User size={18} />
            <span>General</span>
          </button>
          
          <button 
            className={activeTab === 'security' ? 'active' : ''}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} />
            <span>Security</span>
          </button>
          
          <button 
            className={activeTab === 'api' ? 'active' : ''}
            onClick={() => setActiveTab('api')}
          >
            <Server size={18} />
            <span>API</span>
          </button>
          
          <button 
            className={activeTab === 'backup' ? 'active' : ''}
            onClick={() => setActiveTab('backup')}
          >
            <Database size={18} />
            <span>Backup & Storage</span>
          </button>
        </div>
        
        <div className="settings-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading settings...</p>
            </div>
          ) : (
            <>
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="settings-panel">
                  <h3>General Settings</h3>
                  <p className="settings-description">
                    Configure basic application settings and notification preferences.
                  </p>
                  
                  <div className="settings-form">
                    <div className="form-group">
                      <label htmlFor="siteName">Application Name</label>
                      <input 
                        type="text" 
                        id="siteName"
                        value={generalSettings.siteName}
                        onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="adminEmail">Administrator Email</label>
                      <div className="input-with-icon">
                        <Mail size={16} />
                        <input 
                          type="email" 
                          id="adminEmail"
                          value={generalSettings.adminEmail}
                          onChange={(e) => handleInputChange('general', 'adminEmail', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group toggle-group">
                      <label htmlFor="enableNotifications">
                        <Bell size={16} />
                        Enable Notifications
                      </label>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          id="enableNotifications"
                          checked={generalSettings.enableNotifications}
                          onChange={() => handleToggle('general', 'enableNotifications')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    
                    {generalSettings.enableNotifications && (
                      <div className="form-group">
                        <label htmlFor="notificationEmail">Notification Email</label>
                        <input 
                          type="email" 
                          id="notificationEmail"
                          value={generalSettings.notificationEmail}
                          onChange={(e) => handleInputChange('general', 'notificationEmail', e.target.value)}
                        />
                      </div>
                    )}
                    
                    <div className="form-group">
                      <label htmlFor="dataRetentionDays">Data Retention (days)</label>
                      <input 
                        type="number" 
                        id="dataRetentionDays"
                        value={generalSettings.dataRetentionDays}
                        onChange={(e) => handleInputChange('general', 'dataRetentionDays', parseInt(e.target.value))}
                        min="1"
                        max="365"
                      />
                      <small>Number of days to keep logs and attack data</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="theme">UI Theme</label>
                      <select 
                        id="theme"
                        value={generalSettings.theme}
                        onChange={(e) => handleInputChange('general', 'theme', e.target.value)}
                      >
                        <option value="dark">Cyberpunk Dark</option>
                        <option value="light">Tron Light</option>
                        <option value="terminal">Terminal</option>
                        <option value="neon">Neon Night</option>
                      </select>
                    </div>
                    
                    <div className="form-group toggle-group">
                      <label htmlFor="autoBlockAttacks">
                        <Shield size={16} />
                        Automatically Block Attacks
                      </label>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          id="autoBlockAttacks"
                          checked={generalSettings.autoBlockAttacks}
                          onChange={() => handleToggle('general', 'autoBlockAttacks')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    
                    <div className="form-group toggle-group">
                      <label htmlFor="sensitiveDataMasking">
                        <Key size={16} />
                        Mask Sensitive Data in Logs
                      </label>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          id="sensitiveDataMasking"
                          checked={generalSettings.sensitiveDataMasking}
                          onChange={() => handleToggle('general', 'sensitiveDataMasking')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        className="save-button"
                        onClick={() => handleSaveSettings('General')}
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="settings-panel">
                  <h3>Security Settings</h3>
                  <p className="settings-description">
                    Configure application protection settings and security features.
                  </p>
                  
                  <div className="settings-form">
                    <div className="form-group">
                      <label htmlFor="rateLimit">Rate Limit (requests per minute)</label>
                      <input 
                        type="number" 
                        id="rateLimit"
                        value={securitySettings.rateLimit}
                        onChange={(e) => handleInputChange('security', 'rateLimit', parseInt(e.target.value))}
                        min="1"
                      />
                      <small>Maximum number of requests allowed per minute from a single IP</small>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="maxRequestSize">Maximum Request Size (MB)</label>
                      <input 
                        type="number" 
                        id="maxRequestSize"
                        value={securitySettings.maxRequestSize}
                        onChange={(e) => handleInputChange('security', 'maxRequestSize', parseInt(e.target.value))}
                        min="1"
                        max="100"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="allowedIPs">Allowed IP Addresses (comma separated)</label>
                      <textarea 
                        id="allowedIPs"
                        value={securitySettings.allowedIPs}
                        onChange={(e) => handleInputChange('security', 'allowedIPs', e.target.value)}
                        placeholder="e.g. 192.168.1.1, 10.0.0.0/24"
                        rows="3"
                      />
                      <small>Leave empty to allow all IPs</small>
                    </div>
                    
                    <div className="toggles-section">
                      <h4>Protection Features</h4>
                      
                      <div className="form-group toggle-group">
                        <label htmlFor="blockTor">
                          <Globe size={16} />
                          Block Tor Exit Nodes
                        </label>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            id="blockTor"
                            checked={securitySettings.blockTor}
                            onChange={() => handleToggle('security', 'blockTor')}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      
                      <div className="form-group toggle-group">
                        <label htmlFor="blockAnonymousProxies">
                          <Globe size={16} />
                          Block Anonymous Proxies
                        </label>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            id="blockAnonymousProxies"
                            checked={securitySettings.blockAnonymousProxies}
                            onChange={() => handleToggle('security', 'blockAnonymousProxies')}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      
                      <div className="form-group toggle-group">
                        <label htmlFor="ipGeolocation">
                          <Globe size={16} />
                          Enable IP Geolocation
                        </label>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            id="ipGeolocation"
                            checked={securitySettings.ipGeolocation}
                            onChange={() => handleToggle('security', 'ipGeolocation')}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="toggles-section">
                      <h4>Attack Prevention</h4>
                      
                      <div className="form-group toggle-group">
                        <label htmlFor="requestValidation">
                          <Shield size={16} />
                          Request Validation
                        </label>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            id="requestValidation"
                            checked={securitySettings.requestValidation}
                            onChange={() => handleToggle('security', 'requestValidation')}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      
                      <div className="form-group toggle-group">
                        <label htmlFor="sqlInjectionProtection">
                          <Shield size={16} />
                          SQL Injection Protection
                        </label>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            id="sqlInjectionProtection"
                            checked={securitySettings.sqlInjectionProtection}
                            onChange={() => handleToggle('security', 'sqlInjectionProtection')}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      
                      <div className="form-group toggle-group">
                        <label htmlFor="xssProtection">
                          <Shield size={16} />
                          XSS Protection
                        </label>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            id="xssProtection"
                            checked={securitySettings.xssProtection}
                            onChange={() => handleToggle('security', 'xssProtection')}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                      
                      <div className="form-group toggle-group">
                        <label htmlFor="csrfProtection">
                          <Shield size={16} />
                          CSRF Protection
                        </label>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            id="csrfProtection"
                            checked={securitySettings.csrfProtection}
                            onChange={() => handleToggle('security', 'csrfProtection')}
                          />
                          <span className="slider"></span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        className="save-button"
                        onClick={() => handleSaveSettings('Security')}
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* API Settings */}
              {activeTab === 'api' && (
                <div className="settings-panel">
                  <h3>API Settings</h3>
                  <p className="settings-description">
                    Configure API access, rate limits, and webhooks.
                  </p>
                  
                  <div className="settings-form">
                    <div className="form-group toggle-group">
                      <label htmlFor="enableApi">
                        <Server size={16} />
                        Enable API
                      </label>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          id="enableApi"
                          checked={apiSettings.enableApi}
                          onChange={() => handleToggle('api', 'enableApi')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    
                    {apiSettings.enableApi && (
                      <>
                        <div className="form-group toggle-group">
                          <label htmlFor="requireApiKey">
                            <Key size={16} />
                            Require API Key
                          </label>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              id="requireApiKey"
                              checked={apiSettings.requireApiKey}
                              onChange={() => handleToggle('api', 'requireApiKey')}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="rateLimitApi">API Rate Limit (requests per hour)</label>
                          <input 
                            type="number" 
                            id="rateLimitApi"
                            value={apiSettings.rateLimitApi}
                            onChange={(e) => handleInputChange('api', 'rateLimitApi', parseInt(e.target.value))}
                            min="1"
                          />
                        </div>
                        
                        <div className="form-group toggle-group">
                          <label htmlFor="allowCors">
                            <Globe size={16} />
                            Allow CORS
                          </label>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              id="allowCors"
                              checked={apiSettings.allowCors}
                              onChange={() => handleToggle('api', 'allowCors')}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                        
                        {apiSettings.allowCors && (
                          <div className="form-group">
                            <label htmlFor="corsOrigins">Allowed Origins (comma separated)</label>
                            <textarea 
                              id="corsOrigins"
                              value={apiSettings.corsOrigins}
                              onChange={(e) => handleInputChange('api', 'corsOrigins', e.target.value)}
                              placeholder="e.g. https://example.com, https://app.example.com"
                              rows="3"
                            />
                            <small>Leave empty to allow all origins (not recommended)</small>
                          </div>
                        )}
                        
                        <div className="form-group">
                          <label htmlFor="apiTimeout">API Timeout (seconds)</label>
                          <input 
                            type="number" 
                            id="apiTimeout"
                            value={apiSettings.apiTimeout}
                            onChange={(e) => handleInputChange('api', 'apiTimeout', parseInt(e.target.value))}
                            min="1"
                            max="120"
                          />
                        </div>
                        
                        <div className="form-group toggle-group">
                          <label htmlFor="enableWebhooks">
                            <Server size={16} />
                            Enable Webhooks
                          </label>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              id="enableWebhooks"
                              checked={apiSettings.enableWebhooks}
                              onChange={() => handleToggle('api', 'enableWebhooks')}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                        
                        {apiSettings.enableWebhooks && (
                          <div className="form-group">
                            <label htmlFor="webhookUrl">Webhook URL</label>
                            <input 
                              type="url" 
                              id="webhookUrl"
                              value={apiSettings.webhookUrl}
                              onChange={(e) => handleInputChange('api', 'webhookUrl', e.target.value)}
                              placeholder="https://example.com/webhook"
                            />
                          </div>
                        )}
                      </>
                    )}
                    
                    <div className="form-actions">
                      <button 
                        className="save-button"
                        onClick={() => handleSaveSettings('API')}
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Backup Settings */}
              {activeTab === 'backup' && (
                <div className="settings-panel">
                  <h3>Backup & Storage Settings</h3>
                  <p className="settings-description">
                    Configure automated backups and data retention.
                  </p>
                  
                  <div className="settings-form">
                    <div className="form-group toggle-group">
                      <label htmlFor="autoBackup">
                        <Database size={16} />
                        Automatic Backups
                      </label>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          id="autoBackup"
                          checked={backupSettings.autoBackup}
                          onChange={() => handleToggle('backup', 'autoBackup')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    
                    {backupSettings.autoBackup && (
                      <>
                        <div className="form-group">
                          <label htmlFor="backupFrequency">Backup Frequency</label>
                          <select 
                            id="backupFrequency"
                            value={backupSettings.backupFrequency}
                            onChange={(e) => handleInputChange('backup', 'backupFrequency', e.target.value)}
                          >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="backupRetention">Backup Retention (days)</label>
                          <input 
                            type="number" 
                            id="backupRetention"
                            value={backupSettings.backupRetention}
                            onChange={(e) => handleInputChange('backup', 'backupRetention', parseInt(e.target.value))}
                            min="1"
                            max="365"
                          />
                          <small>Number of days to keep backups</small>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="backupLocation">Backup Storage Location</label>
                          <select 
                            id="backupLocation"
                            value={backupSettings.backupLocation}
                            onChange={(e) => handleInputChange('backup', 'backupLocation', e.target.value)}
                          >
                            <option value="local">Local Storage</option>
                            <option value="s3">Amazon S3</option>
                            <option value="gcloud">Google Cloud Storage</option>
                            <option value="azure">Azure Blob Storage</option>
                          </select>
                        </div>
                        
                        <div className="form-group toggle-group">
                          <label htmlFor="backupEncryption">
                            <Key size={16} />
                            Encrypt Backups
                          </label>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              id="backupEncryption"
                              checked={backupSettings.backupEncryption}
                              onChange={() => handleToggle('backup', 'backupEncryption')}
                            />
                            <span className="slider"></span>
                          </label>
                        </div>
                      </>
                    )}
                    
                    <div className="backup-status">
                      <h4>Backup Status</h4>
                      <div className="status-row">
                        <div className="status-label">
                          <Clock size={16} />
                          Last Backup:
                        </div>
                        <div className="status-value">
                          {backupSettings.lastBackup 
                            ? new Date(backupSettings.lastBackup).toLocaleString() 
                            : 'Never'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button 
                        className="backup-now-button"
                        onClick={() => alert('Manual backup initiated!')}
                      >
                        <Database size={16} />
                        Backup Now
                      </button>
                      
                      <button 
                        className="save-button"
                        onClick={() => handleSaveSettings('Backup')}
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 