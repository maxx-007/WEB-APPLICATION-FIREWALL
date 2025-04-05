import React, { useEffect, useState, useRef } from "react";
import { fetchFirewallRules, addFirewallRule, deleteFirewallRule, logout, setAuthToken } from "../services/api";
import { useNavigate } from "react-router-dom";
import * as THREE from 'three';
import { 
  ChevronRight, 
  LogOut, 
  Shield, 
  Activity, 
  AlertTriangle, 
  Terminal, 
  Zap, 
  Lock,
  Radar
} from "lucide-react";
import "./Dashboard.css";

const Dashboard = () => {
    const [rules, setRules] = useState([]);
    const [newRuleName, setNewRuleName] = useState("");
    const [newRulePattern, setNewRulePattern] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState("SECURE");
    const [threatLevel, setThreatLevel] = useState(Math.floor(Math.random() * 20)); // Random initial threat level
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const [error, setError] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);

    
    // Terminal effect text
    const terminalMessages = [
      "Initializing secure connection...",
      "Scanning network perimeter...",
      "Threat detection system online...",
      "Neural firewall active...",
      "Quantum encryption engaged...",
      "System integrity verified...",
    ];
    const [currentTerminalMessage, setCurrentTerminalMessage] = useState(0);

    // Three.js setup
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;
        
        // Get container dimensions for more accurate sizing
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = window.innerHeight;
        
        // Scene setup
        const scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x0a192f, 0.035);
        
        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
        camera.position.z = 5;
        
        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvasRef.current,
            alpha: true,
            antialias: true 
        });
        renderer.setSize(containerWidth, containerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // Grid setup - creates the TRON-like grid effect
        const gridHelper1 = new THREE.GridHelper(50, 50, 0x00ffff, 0x003333);
        gridHelper1.position.set(0, -5, 0);
        scene.add(gridHelper1);
        
        const gridHelper2 = new THREE.GridHelper(50, 50, 0xff00ff, 0x330033);
        gridHelper2.position.set(0, -5, 0);
        gridHelper2.rotation.x = Math.PI / 2;
        scene.add(gridHelper2);
        
        // Create digital particles for cyber atmosphere
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 2000;
        const posArray = new Float32Array(particlesCount * 3);
        
        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 50;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.08,
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });
        
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);
        
        // Create a second particle system with different color
        const particles2Geometry = new THREE.BufferGeometry();
        const particles2Count = 1000;
        const pos2Array = new Float32Array(particles2Count * 3);
        
        for (let i = 0; i < particles2Count * 3; i++) {
            pos2Array[i] = (Math.random() - 0.5) * 30;
        }
        
        particles2Geometry.setAttribute('position', new THREE.BufferAttribute(pos2Array, 3));
        
        const particles2Material = new THREE.PointsMaterial({
            size: 0.05,
            color: 0xff00ff,
            transparent: true,
            opacity: 0.7
        });
        
        const particles2Mesh = new THREE.Points(particles2Geometry, particles2Material);
        scene.add(particles2Mesh);
        
        // Light beams - creates laser-like effects
        const createLightBeam = (x, y, color, thickness = 0.02) => {
            const beamGeometry = new THREE.CylinderGeometry(thickness, thickness, 30, 16);
            const beamMaterial = new THREE.MeshBasicMaterial({ 
                color: color,
                transparent: true,
                opacity: 0.7
            });
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.set(x, y, -15);
            beam.rotation.x = Math.PI / 2;
            scene.add(beam);
            return beam;
        };
        
        // Create multiple beams for a more dynamic scene
        const beams = [
            createLightBeam(-8, 0, 0x00ffff),
            createLightBeam(8, 0, 0xff00ff),
            createLightBeam(-4, 3, 0x00ccff, 0.01),
            createLightBeam(4, -3, 0xff00cc, 0.01),
            createLightBeam(0, -6, 0x00ffaa, 0.015)
        ];
        
        // Create circular shield effect
        const shieldGeometry = new THREE.RingGeometry(4, 4.1, 64);
        const shieldMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.rotation.x = Math.PI / 2;
        shield.position.z = -10;
        scene.add(shield);
        
        // Inner shield ring
        const innerShieldGeometry = new THREE.RingGeometry(2, 2.1, 64);
        const innerShieldMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff00ff, 
            transparent: true, 
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const innerShield = new THREE.Mesh(innerShieldGeometry, innerShieldMaterial);
        innerShield.rotation.x = Math.PI / 2;
        innerShield.position.z = -10;
        scene.add(innerShield);
        
        // Animation loop
        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            
            // Rotate grids
            gridHelper1.rotation.y += 0.002;
            gridHelper2.rotation.z += 0.001;
            
            // Move particles
            particlesMesh.rotation.y += 0.0005;
            particlesMesh.rotation.x += 0.0001;
            particles2Mesh.rotation.y -= 0.0003;
            particles2Mesh.rotation.z += 0.0002;
            
            // Pulse light beams and shields
            const time = Date.now() * 0.001;
            beams.forEach((beam, i) => {
                beam.material.opacity = 0.5 + Math.sin(time + i * 0.5) * 0.3;
                beam.scale.y = 1 + Math.sin(time * 0.5 + i) * 0.1;
            });
            
            shield.scale.set(
                1 + Math.sin(time * 0.7) * 0.1,
                1 + Math.sin(time * 0.7) * 0.1,
                1
            );
            shield.material.opacity = 0.3 + Math.sin(time) * 0.2;
            
            innerShield.rotation.z += 0.01;
            innerShield.material.opacity = 0.3 + Math.cos(time * 1.5) * 0.2;
            
            renderer.render(scene, camera);
        };
        
        // Handle window resize
        const handleResize = () => {
            const newWidth = containerRef.current.clientWidth;
            const newHeight = window.innerHeight;
            
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };
        
        window.addEventListener('resize', handleResize);
        animate();
        
        // Terminal message rotation
        const messageInterval = setInterval(() => {
            setCurrentTerminalMessage((prev) => (prev + 1) % terminalMessages.length);
        }, 3000);
        
        // Random threat level simulation
        const threatInterval = setInterval(() => {
            setThreatLevel(Math.floor(Math.random() * 20));
        }, 5000);
        
        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
            clearInterval(messageInterval);
            clearInterval(threatInterval);
            cancelAnimationFrame(animationFrameRef.current);
            
            // Clean up Three.js objects
            scene.remove(gridHelper1);
            scene.remove(gridHelper2);
            scene.remove(particlesMesh);
            scene.remove(particles2Mesh);
            beams.forEach(beam => scene.remove(beam));
            scene.remove(shield);
            scene.remove(innerShield);
            
            // Dispose of geometries and materials
            particlesGeometry.dispose();
            particlesMaterial.dispose();
            particles2Geometry.dispose();
            particles2Material.dispose();
            shieldGeometry.dispose();
            shieldMaterial.dispose();
            innerShieldGeometry.dispose();
            innerShieldMaterial.dispose();
            
            renderer.dispose();
        };
    }, []);

    // Fetch firewall rules when the component loads
    useEffect(() => {
        async function loadRules() {
            try {
                setIsLoading(true);
                const fetchedRules = await fetchFirewallRules();
                setRules(fetchedRules);
                // Update system status based on rules count
                setSystemStatus(fetchedRules.length > 0 ? "SECURE" : "VULNERABLE");
            } catch (error) {
                console.error("Failed to load rules:", error);
                setSystemStatus("ALERT");
            } finally {
                setIsLoading(false);
            }
        }
        loadRules();
    }, []);

    // Handle adding a new rule
    const handleAddRule = async (e) => {
      e.preventDefault();
      if (!newRuleName || !newRulePattern) return;
    
      try {
        // Create a rule object instead of passing separate parameters
        const ruleData = {
          rule_name: newRuleName,
          rule_pattern: newRulePattern
        };
        
        const newRule = await addFirewallRule(ruleData);
        
        if (newRule) {
          // Create a temporary unique ID if server doesn't provide one
          const ruleWithId = newRule.id ? newRule : {...newRule, id: `temp-${Date.now()}`};
          setRules([...rules, ruleWithId]);
          setNewRuleName("");
          setNewRulePattern("");
          setShowAddForm(false);
        }
      } catch (error) {
        console.error("Failed to add rule:", error);
        setError("Failed to add new rule. Please try again.");
      }
    };
    
    // Handle rule deletion
    const handleDeleteRule = async (ruleId) => {
        try {
            await deleteFirewallRule(ruleId);
            setRules(rules.filter(rule => rule.id !== ruleId));
            
            // Play digital sound effect for successful deletion
            playDigitalSound(554, 0.1);
            setTimeout(() => playDigitalSound(440, 0.1), 150);
        } catch (error) {
            console.error("Failed to delete rule:", error);
            // Error sound
            playDigitalSound(220, 0.2);
        }
    };

    // Handle logout
    const handleLogout = async () => {
      try {
          // Play digital sound effects first
          playDigitalSound(660, 0.1);
          setTimeout(() => playDigitalSound(550, 0.1), 100);
          setTimeout(() => playDigitalSound(440, 0.1), 200);
          setTimeout(() => playDigitalSound(330, 0.1), 300);
          
          // Then handle logout logic AFTER sounds finish
          setTimeout(async () => {
              // First call the API
              await logout();
              
              // Then remove auth token
              localStorage.removeItem("authToken");
              
              // Update auth state before navigation
              setAuthToken(null); // This is imported from your services/api
              
              // Wait a tiny bit to avoid rapid state changes
              setTimeout(() => {
                  navigate("/login");
              }, 50);
          }, 400);
      } catch (error) {
          console.error("Logout failed:", error);
      }
  };
    
    // Simple digital sound effect function
    const playDigitalSound = (frequency, duration) => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.error("Audio playback failed:", error);
        }
    };

    return (
        <div className="cyberpunk-container" ref={containerRef}>
            {/* Canvas for Three.js */}
            <canvas ref={canvasRef} className="background-canvas" />
            
            {/* Overlay effects */}
            <div className="overlay-gradient"></div>
            <div className="cyber-scanlines"></div>
            <div className="cyber-noise"></div>
            
            {/* Header */}
            <header className="cyber-header">
                <div className="logo-container">
                    <Shield className="logo-icon" size={28} />
                    <h1 className="logo-text">
                        <span className="cyan-text">CYBER</span>
                        <span className="pink-text">WAF</span>
                    </h1>
                </div>
                
                {/* System stats in header */}
                <div className="system-stats">
                    <div className="cyber-stat">
                        <span className="stat-label">SYSTEM</span>
                        <div className="stat-value-container">
                            <span className={`cyber-status ${getSystemStatusClass(systemStatus)}`}>
                                {systemStatus}
                            </span>
                            <span className={`status-indicator ${getSystemStatusClass(systemStatus)}`}></span>
                        </div>
                    </div>
                    
                    <div className="cyber-stat">
                        <span className="stat-label">THREAT LEVEL</span>
                        <div className="threat-meter">
                            <div 
                                className={`threat-meter-fill ${getThreatLevelClass(threatLevel)}`}
                                style={{ width: `${(threatLevel / 20) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                
                <div className="header-actions">
                    <div className="cyber-terminal">
                        <Terminal size={14} className="terminal-icon" />
                        <span className="terminal-text">
                            {terminalMessages[currentTerminalMessage]}
                        </span>
                    </div>
                    
                    <button 
                        onClick={handleLogout} 
                        className="cyber-button-danger"
                    >
                        <LogOut size={18} />
                        <span>DISCONNECT</span>
                    </button>
                </div>
            </header>
            
            <div className="container">
                {/* Main title with animated brackets */}
                <div className="cyber-section-title">
                    <span className="cyber-bracket">[</span>
                    <Activity className="section-icon" size={22} />
                    <h2>FIREWALL RULES</h2>
                    <span className="cyber-bracket">]</span>
                </div>
                
                {/* Add Firewall Rule Form */}
                <div className="cyber-panel">
                    <div className="cyber-panel-header">
                        <ChevronRight className="panel-icon" size={20} />
                        <h3>ADD NEW PROTECTION RULE</h3>
                    </div>
                    
                    <form onSubmit={handleAddRule} className="rule-form">
                        <div className="form-grid">
                            <div className="cyber-input-container">
                                <input 
                                    type="text" 
                                    placeholder="Rule Name" 
                                    value={newRuleName} 
                                    onChange={(e) => setNewRuleName(e.target.value)} 
                                    className="cyber-input"
                                />
                                <div className="cyber-input-line"></div>
                            </div>
                            
                            <div className="cyber-input-container">
                                <input 
                                    type="text" 
                                    placeholder="Rule Pattern" 
                                    value={newRulePattern} 
                                    onChange={(e) => setNewRulePattern(e.target.value)} 
                                    className="cyber-input"
                                />
                                <div className="cyber-input-line"></div>
                            </div>
                        </div>
                        
                        <button type="submit" className="cyber-button">
                            <span>DEPLOY RULE</span>
                            <Shield size={18} className="button-icon" />
                        </button>
                    </form>
                </div>
                
                {/* Display Firewall Rules */}
                <div className="cyber-panel">
                    <div className="cyber-panel-header">
                        <ChevronRight className="panel-icon" size={20} />
                        <h3>ACTIVE PROTECTION GRID</h3>
                    </div>
                    
                    <div className="panel-content">
                        {isLoading ? (
                            <div className="loading-container">
                                <div className="cyber-spinner"></div>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="cyber-table">
                                    <thead>
                                        <tr>
                                            <th>RULE ID</th>
                                            <th>RULE SIGNATURE</th>
                                            <th>PATTERN MATCH</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rules.length > 0 ? (
                                            rules.map((rule, index) => (
                                                <tr 
                                                    key={rule.id || index} 
                                                    className="cyber-table-row"
                                                >
                                                    <td className="rule-id">
                                                        <div className="table-cell-with-icon">
                                                            <Lock size={14} className="cell-icon" />
                                                            {rule.id || `RULE-${index + 1}`}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="table-cell-with-icon">
                                                            <Zap size={14} className="cell-icon" />
                                                            {rule.rule_name}
                                                        </div>
                                                    </td>
                                                    <td className="rule-pattern">{rule.rule_pattern}</td>
                                                    <td>
                                                        <button
                                                            onClick={() => handleDeleteRule(rule.id)}
                                                            className="cyber-button-small-danger"
                                                        >
                                                            TERMINATE
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="empty-table-message">
                                                    <AlertTriangle className="warning-icon" />
                                                    <span className="cyber-alert-text">
                                                        No protection rules detected. System vulnerable.
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Dashboard metrics */}
                <div className="metrics-grid">
                    <div className="cyber-metric-card">
                        <div className="cyber-metric-icon cyber-icon-blue">
                            <Shield size={22} />
                        </div>
                        <div className="metric-data">
                            <h4 className="metric-label">SYSTEM STATUS</h4>
                            <p className={`metric-value ${getSystemStatusClass(systemStatus)}`}>
                                <span className={`status-dot ${getSystemStatusClass(systemStatus)}`}></span>
                                {systemStatus}
                            </p>
                        </div>
                    </div>
                    
                    <div className="cyber-metric-card">
                        <div className="cyber-metric-icon cyber-icon-pink">
                            <Activity size={22} />
                        </div>
                        <div className="metric-data">
                            <h4 className="metric-label">RULES ACTIVE</h4>
                            <p className="metric-value rules-count">
                                {rules.length}
                            </p>
                        </div>
                    </div>
                    
                    <div className="cyber-metric-card">
                        <div className="cyber-metric-icon cyber-icon-purple">
                            <Radar size={22} />
                        </div>
                        <div className="metric-data">
                            <h4 className="metric-label">LAST SCAN</h4>
                            <p className="metric-value time-value">{new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper functions for class names
function getSystemStatusClass(status) {
    switch(status) {
        case "SECURE": return "status-secure";
        case "VULNERABLE": return "status-warning";
        default: return "status-danger";
    }
}

function getThreatLevelClass(level) {
    if (level < 5) return "threat-low";
    if (level < 10) return "threat-medium";
    return "threat-high";
}

export default Dashboard;