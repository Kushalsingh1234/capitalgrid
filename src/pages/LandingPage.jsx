import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import countriesData from '../data/countries';
import sectorsData from '../data/industries';

export default function LandingPage() {
  // --- States ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFlowIndex, setActiveFlowIndex] = useState(0);
  const [selectedCountryKey, setSelectedCountryKey] = useState('india');
  const [logs, setLogs] = useState([
    { id: 1, time: '[16:15:30]', text: '🌾 <span class="player">AresCorp</span> sold Cotton to <span class="facility">Weaving Mill</span>' },
    { id: 2, time: '[16:15:31]', text: '👕 <span class="player">ApexRetail</span> manufactured <span class="units">150 Custom Jackets</span>' },
    { id: 3, time: '[16:15:33]', text: '🚗 <span class="player">GenesisAuto</span> opened a <span class="facility">Car Showroom</span>' },
    { id: 4, time: '[16:15:34]', text: '🏦 Logistical services rented by <span class="facility">Heavy Forge</span> from <span class="player">QuantumLogistics</span>' }
  ]);

  // --- Refs ---
  const canvasRef = useRef(null);

  // --- Selected Country HUD Data ---
  const selectedCountry = countriesData.find(c => c.id === selectedCountryKey) || countriesData[0];

  // --- Effects ---
  
  // 1. Navbar Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      const nav = document.getElementById('main-navbar');
      if (window.scrollY > 50) {
        nav?.classList.add('scrolled');
      } else {
        nav?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Interactive Canvas World Network Map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    let nodes = [];
    let connections = [];
    let particles = [];

    const initNetwork = () => {
      nodes = [
        { id: 'USA', name: 'New York Hub', x: width * 0.25, y: height * 0.35, size: 5 },
        { id: 'UK', name: 'London Hub', x: width * 0.45, y: height * 0.28, size: 4 },
        { id: 'GERMANY', name: 'Berlin Hub', x: width * 0.52, y: height * 0.26, size: 4 },
        { id: 'BRAZIL', name: 'Sao Paulo Hub', x: width * 0.35, y: height * 0.75, size: 4.5 },
        { id: 'INDIA', name: 'Mumbai Hub', x: width * 0.68, y: height * 0.48, size: 5 },
        { id: 'JAPAN', name: 'Tokyo Hub', x: width * 0.85, y: height * 0.32, size: 5 },
        { id: 'AUSTRALIA', name: 'Sydney Hub', x: width * 0.88, y: height * 0.8, size: 4.5 }
      ];

      connections = [
        { from: 'USA', to: 'UK' },
        { from: 'USA', to: 'BRAZIL' },
        { from: 'UK', to: 'GERMANY' },
        { from: 'GERMANY', to: 'INDIA' },
        { from: 'INDIA', to: 'JAPAN' },
        { from: 'JAPAN', to: 'AUSTRALIA' },
        { from: 'BRAZIL', to: 'GERMANY' },
        { from: 'AUSTRALIA', to: 'USA' },
        { from: 'USA', to: 'INDIA' }
      ];
    };

    const spawnParticle = () => {
      if (connections.length === 0) return;
      const randomConn = connections[Math.floor(Math.random() * connections.length)];
      const startNode = nodes.find(n => n.id === randomConn.from);
      const endNode = nodes.find(n => n.id === randomConn.to);

      if (startNode && endNode) {
        particles.push({
          x: startNode.x,
          y: startNode.y,
          targetX: endNode.x,
          targetY: endNode.y,
          progress: 0,
          speed: 0.005 + Math.random() * 0.008,
          color: Math.random() > 0.5 ? '#00d2ff' : '#0066ff'
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      initNetwork();
    };

    window.addEventListener('resize', handleResize);
    initNetwork();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw stylized ambient dot matrix background
      ctx.fillStyle = 'rgba(0, 210, 255, 0.015)';
      const cols = 25;
      const rows = 15;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          ctx.beginPath();
          ctx.arc((width / cols) * c + (width / cols) / 2, (height / rows) * r + (height / rows) / 2, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Connection Routes
      ctx.lineWidth = 1;
      connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 210, 255, 0.07)';
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();
        }
      });

      // Draw Active Particles (Cargo Flow)
      particles.forEach((part, index) => {
        part.progress += part.speed;
        part.x = part.x + (part.targetX - part.x) * part.progress;
        part.y = part.y + (part.targetY - part.y) * part.progress;

        ctx.beginPath();
        ctx.arc(part.x, part.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = part.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = part.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (part.progress >= 1) {
          particles.splice(index, 1);
        }
      });

      // Draw Country Hubs
      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = '#00d2ff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00d2ff';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = '700 8px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(node.id, node.x, node.y - 12);
      });

      if (Math.random() < 0.03 && particles.length < 25) {
        spawnParticle();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // 3. Live Ledger Stream Ticker
  useEffect(() => {
    const playersList = ['AresCorp', 'ApexRetail', 'QuantumLogistics', 'StarlightFarms', 'CyberSteel', 'NeuronBaking', 'NovaMines', 'GenesisAuto', 'ZeroGravity'];
    const factoriesList = ['Steel Refinery', 'Silicon Lab', 'Weaving Mill', 'Microchip Assembly', 'Heavy Forge', 'Garment Floor'];
    const actionsList = [
      (p1, p2) => `🌾 <span class="player">${p1}</span> sold Cotton to <span class="facility">${p2 || 'Garment Factory'}</span>`,
      (p1) => `👕 <span class="player">${p1}</span> manufactured <span class="units">150 Custom Jackets</span>`,
      (p1) => `🚗 <span class="player">${p1}</span> launched standard sedan sales at <span class="facility">Car Showroom</span>`,
      (p1, p2) => `🏦 Logistical services rented by <span class="facility">${p2 || 'Heavy Factory'}</span> from <span class="player">${p1}</span>`,
      (p1, p2) => `⛏️ <span class="player">${p1}</span> shipped 400 tons of Iron to <span class="facility">${p2 || 'Refinery'}</span>`,
      (p1) => `💻 <span class="player">${p1}</span> assembled <span class="units">300 Quantum Tablets</span>`
    ];

    const interval = setInterval(() => {
      const p1 = playersList[Math.floor(Math.random() * playersList.length)];
      const targetFactory = factoriesList[Math.floor(Math.random() * factoriesList.length)];
      const actionFunc = actionsList[Math.floor(Math.random() * actionsList.length)];

      const d = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timeStr = `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;

      setLogs(prev => {
        const nextLogs = [...prev, {
          id: Date.now(),
          time: timeStr,
          text: actionFunc(p1, targetFactory)
        }];
        if (nextLogs.length > 5) nextLogs.shift();
        return nextLogs;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 4. Sequential Flow Diagram Pulsing Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFlowIndex(prev => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gameBg text-white min-h-screen relative overflow-x-hidden font-body">
      {/* Background Overlay */}
      <div className="grid-overlay"></div>
      <div className="glow-radial-overlay"></div>

      {/* Navbar */}
      <nav className="navbar" id="main-navbar">
        <div className="navbar-container">
          <Link to="/" className="brand-logo">
            <img src="/assets/logo.svg" alt="CapitalGrid Logo" className="logo-image" />
          </Link>

          <button 
            className={`menu-toggle ${isMobileMenuOpen ? 'open' : ''}`} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>

          <ul className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            <li className="nav-item"><a href="#" className="nav-link active">Home</a></li>
            <li className="nav-item"><a href="#economy-section" className="nav-link">Economy</a></li>
            <li className="nav-item"><a href="#industries-section" className="nav-link">Industries</a></li>
            <li className="nav-item"><a href="#how-it-works-section" className="nav-link">How It Works</a></li>
            <li className="nav-item"><a href="#community-section" className="nav-link">Community</a></li>
          </ul>

          <div className="nav-buttons">
            <Link to="/login" className="btn btn-secondary">Login</Link>
            <Link to="/signup" className="btn btn-primary">Start Building</Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO SECTION */}
      <header className="hero-section" id="home-section">
        <div className="hero-map-wrapper">
          <canvas ref={canvasRef} id="map-canvas"></canvas>
        </div>

        <div className="hero-container container">
          <div className="hero-content">
            <div className="badge neon-text-blue">
              <i className="fa-solid fa-gamepad"></i> Multiplayer Live Economy
            </div>
            <h1 className="hero-title leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Build Companies.<br />
              <span className="text-gradient">Control Industries.</span><br />
              Shape The Economy.
            </h1>
            <p className="hero-subtitle">
              Every product in CapitalGrid is created by a real player. Farmers grow resources, factories manufacture goods, retailers sell products, and businesses depend on each other to thrive. Build your empire inside a living, player-driven economy.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="btn btn-large btn-primary">
                Start Your Company <i className="fa-solid fa-arrow-right"></i>
              </Link>
              <a href="#economy-section" className="btn btn-large btn-secondary">
                Explore The Economy <i className="fa-solid fa-network-wired"></i>
              </a>
            </div>
          </div>

          <div className="hero-visuals">
            <div className="floating-cards-container">
              <div className="floating-mini-card item-farming" style={{ '--delay': '0s' }}>
                <div className="card-icon"><i className="fa-solid fa-wheat-awn"></i></div>
                <div className="card-info">
                  <span className="card-tag">RESOURCE</span>
                  <span className="card-name">Farming Sector</span>
                </div>
              </div>

              <div className="floating-mini-card item-factory" style={{ '--delay': '2.5s' }}>
                <div className="card-icon"><i className="fa-solid fa-industry"></i></div>
                <div className="card-info">
                  <span className="card-tag">PRODUCTION</span>
                  <span className="card-name">Garment Factory</span>
                </div>
              </div>

              <div className="floating-mini-card item-retail" style={{ '--delay': '5s' }}>
                <div className="card-icon"><i className="fa-solid fa-store"></i></div>
                <div className="card-info">
                  <span className="card-tag">COMMERCE</span>
                  <span className="card-name">Car Showroom</span>
                </div>
              </div>
            </div>

            <div className="activity-feed-terminal">
              <div className="terminal-header">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="terminal-title">LIVE LEDGER STREAM</span>
                <span className="terminal-status neon-text-cyan">
                  <i className="fa-solid fa-circle-nodes pulse-fast mr-1"></i> CONNECTED
                </span>
              </div>
              <div className="terminal-body">
                {logs.map((log) => (
                  <div key={log.id} className="log-entry">
                    <span className="log-time">{log.time}</span>{' '}
                    <span dangerouslySetInnerHTML={{ __html: log.text }}></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hero-stats-bar">
          <div className="container stats-bar-container">
            <div className="stat-item">
              <div className="stat-value">5+</div>
              <div className="stat-label">Industries</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">20+</div>
              <div className="stat-label">Products</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value">7</div>
              <div className="stat-label">Countries</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item animate-pulse-glow">
              <div className="stat-value text-gradient-cyan">100%</div>
              <div className="stat-label">Player Driven Economy</div>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION 2: HOW THE ECONOMY WORKS */}
      <section className="section economy-section" id="economy-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag neon-text-cyan">ECOSYSTEM LAYER</div>
            <h2 className="section-title" style={{ fontFamily: 'Outfit, sans-serif' }}>One Economy. Thousands Of Possibilities.</h2>
            <p className="section-subtitle">Every business relies on another. Nothing exists in isolation.</p>
          </div>

          <div className="flowcharts-container">
            {/* Flow 1 */}
            <div className="flow-track-box glass-card">
              <div className="flow-track-header">
                <span className="flow-badge text-cyan"><i className="fa-solid fa-shirt"></i> Textile Supply Chain</span>
              </div>
              <div className="flow-steps">
                <div className={`flow-node ${activeFlowIndex === 0 ? 'active-pulse' : ''}`}>
                  <div className="node-icon"><i className="fa-solid fa-wheat-awn"></i></div>
                  <span className="node-name">Farmer</span>
                  <span className="node-meta">Raw Cotton</span>
                </div>
                <div className="flow-connector"><div className="flow-pulse-line"></div></div>
                <div className={`flow-node ${activeFlowIndex === 1 ? 'active-pulse' : ''}`}>
                  <div className="node-icon"><i className="fa-solid fa-scissors"></i></div>
                  <span className="node-name">Garment Factory</span>
                  <span className="node-meta">Manufactures Apparel</span>
                </div>
                <div className="flow-connector"><div className="flow-pulse-line"></div></div>
                <div className={`flow-node ${activeFlowIndex === 2 ? 'active-pulse' : ''}`}>
                  <div className="node-icon"><i className="fa-solid fa-store"></i></div>
                  <span className="node-name">Clothing Retail</span>
                  <span className="node-meta">Sells to Public</span>
                </div>
                <div className="flow-connector"><div className="flow-pulse-line"></div></div>
                <div className={`flow-node ${activeFlowIndex === 3 ? 'active-pulse' : ''}`}>
                  <div className="node-icon"><i className="fa-solid fa-users"></i></div>
                  <span className="node-name">Customers</span>
                  <span className="node-meta">Market Demand</span>
                </div>
              </div>
            </div>

            {/* Flow 2 */}
            <div className="flow-track-box glass-card">
              <div className="flow-track-header">
                <span className="flow-badge text-blue"><i className="fa-solid fa-car"></i> Heavy Industrial Chain</span>
              </div>
              <div className="flow-steps">
                <div className={`flow-node ${activeFlowIndex === 0 ? 'active-pulse' : ''}`}>
                  <div className="node-icon"><i className="fa-solid fa-hard-hat"></i></div>
                  <span className="node-name">Mining</span>
                  <span className="node-meta">Iron & Steel Ore</span>
                </div>
                <div className="flow-connector"><div className="flow-pulse-line"></div></div>
                <div className={`flow-node ${activeFlowIndex === 1 ? 'active-pulse' : ''}`}>
                  <div className="node-icon"><i className="fa-solid fa-industry"></i></div>
                  <span className="node-name">Construction Factory</span>
                  <span className="node-meta">Processes Steel Parts</span>
                </div>
                <div className="flow-connector"><div className="flow-pulse-line"></div></div>
                <div className={`flow-node ${activeFlowIndex === 2 ? 'active-pulse' : ''}`}>
                  <div className="node-icon"><i className="fa-solid fa-gears"></i></div>
                  <span className="node-name">Automobile Mfg.</span>
                  <span className="node-meta">Assembles Vehicles</span>
                </div>
                <div className="flow-connector"><div className="flow-pulse-line"></div></div>
                <div className={`flow-node ${activeFlowIndex === 3 ? 'active-pulse' : ''}`}>
                  <div className="node-icon"><i className="fa-solid fa-warehouse"></i></div>
                  <span className="node-name">Car Showroom</span>
                  <span className="node-meta">High-Tier Sales</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flow-statement-box text-center">
            <h3 className="glow-quote-text">
              "Your success doesn't depend on defeating other players.<br />
              It depends on becoming <span className="neon-text-cyan">valuable</span> to them."
            </h3>
          </div>
        </div>
      </section>

      {/* SECTION 3: CHOOSE YOUR INDUSTRY */}
      <section className="section industries-section" id="industries-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag neon-text-blue">SECTOR MATRIX</div>
            <h2 className="section-title" style={{ fontFamily: 'Outfit, sans-serif' }}>Choose Your Path To Power</h2>
            <p className="section-subtitle">Select which sector of the global economy you want to dominate.</p>
          </div>

          <div className="industry-grid">
            {sectorsData.map((sect) => (
              <div key={sect.id} className="industry-card glass-card">
                <div className="industry-card-glow"></div>
                <div className="industry-icon-wrapper">
                  <i className={sect.icon}></i>
                </div>
                <h3 className="industry-title">{sect.title}</h3>
                <p className="industry-desc">{sect.desc}</p>
                <div className="industry-divider"></div>
                <span className="includes-label">Includes:</span>
                <ul className="includes-list">
                  {sect.includes.map((inc, i) => (
                    <li key={i}><i className={inc.icon}></i> {inc.name}</li>
                  ))}
                </ul>
                <div className="card-action-overlay">
                  <span className="explore-btn">Inspect Sector <i className="fa-solid fa-plus"></i></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: BUILD YOUR OWN COMPANY */}
      <section className="section timeline-section" id="how-it-works-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag neon-text-cyan">THE ROADMAP</div>
            <h2 className="section-title" style={{ fontFamily: 'Outfit, sans-serif' }}>Every Empire Starts With One Decision</h2>
            <p className="section-subtitle">A step-by-step breakdown of your journey to global dominance.</p>
          </div>

          <div className="timeline-wrapper">
            <div className="timeline-progress-bar">
              <div className="timeline-progress-fill" style={{ height: '70%' }}></div>
            </div>

            <div className="timeline-steps">
              {[
                { s: '01', icon: 'fa-user-plus', t: 'Create Your Account', d: 'Establish your global player identity and secure your network access credentials.' },
                { s: '02', icon: 'fa-file-signature', t: 'Register Your Startup', d: 'Pick your business name, structure your corporate entity, and secure starting capital.' },
                { s: '03', icon: 'fa-earth-americas', t: 'Choose A Country', d: 'Determine your strategic physical base based on regional tax laws and resource availability.' },
                { s: '04', icon: 'fa-briefcase', t: 'Select Your Industry', d: 'Find your specialization across four economic sectors to maximize operational efficiency.' },
                { s: '05', icon: 'fa-boxes-packing', t: 'Produce Products', d: 'Optimize manufacturing nodes, gather materials, and output high-quality custom goods.' },
                { s: '06', icon: 'fa-right-left', t: 'Trade With Real Players', d: 'Establish supply contracts, manage logistics, and negotiate prices in a living market.' },
                { s: '07', icon: 'fa-ranking-star', t: 'Grow Into An Empire', d: 'Reinvest earnings, expand horizontally or vertically, and take control of world markets.' }
              ].map((step, idx) => (
                <div key={idx} className="timeline-step glass-card active">
                  <div className="step-num-glow">{step.s}</div>
                  <div className="step-icon"><i className={`fa-solid ${step.icon}`}></i></div>
                  <h3 className="step-title">{step.t}</h3>
                  <p className="step-desc">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: GLOBAL BUSINESS EXPERIENCE */}
      <section className="section countries-section" id="countries-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag neon-text-blue">TERRITORIAL DIVISION</div>
            <h2 className="section-title" style={{ fontFamily: 'Outfit, sans-serif' }}>Build Anywhere In The World</h2>
            <p className="section-subtitle">Every country has its own opportunities, taxes and economic advantages.</p>
          </div>

          <div className="global-map-interactive-container">
            <div className="countries-grid">
              {countriesData.map((country) => (
                <div 
                  key={country.id} 
                  className={`country-card glass-card ${selectedCountryKey === country.id ? 'active' : ''}`}
                  onClick={() => setSelectedCountryKey(country.id)}
                >
                  <div className="country-header">
                    <span className="flag-icon">{country.flag}</span>
                    <h3 className="country-name">{country.name}</h3>
                  </div>
                  <div className="country-mini-stats">
                    <span>Tax Rate: <strong>{country.taxLabel}</strong></span>
                    <span>Strength: <strong>{country.strengthLabel}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="country-hud-panel glass-card">
              <div className="hud-scanner-line"></div>
              <div className="hud-header">
                <span className="hud-tag">DATAFEED LINKED</span>
                <div className="hud-country-title-row">
                  <span className="hud-flag">{selectedCountry.flag}</span>
                  <h3 className="hud-country-name">{selectedCountry.name}</h3>
                </div>
                <span className="hud-status neon-text-cyan"><i className="fa-solid fa-chart-line"></i> SYSTEM STATUS: STABLE</span>
              </div>

              <div className="hud-body">
                <div className="hud-stat-group">
                  <div className="hud-stat-labels">
                    <span className="hud-stat-title">Corporate Tax Rate</span>
                    <span className="hud-stat-value">{selectedCountry.taxLabel}</span>
                  </div>
                  <div className="hud-progress-track">
                    <div className="hud-progress-fill bg-cyan" style={{ width: `${selectedCountry.taxRate * 4}%` }}></div>
                  </div>
                  <p className="hud-stat-desc">{selectedCountry.taxDesc}</p>
                </div>

                <div className="hud-stat-group">
                  <div className="hud-stat-labels">
                    <span className="hud-stat-title">Economic Strength</span>
                    <span className="hud-stat-value text-blue">{selectedCountry.strengthLabel}</span>
                  </div>
                  <div className="hud-progress-track">
                    <div className="hud-progress-fill bg-blue" style={{ width: `${selectedCountry.strength}%` }}></div>
                  </div>
                  <p className="hud-stat-desc">{selectedCountry.strengthDesc}</p>
                </div>

                <div className="hud-stat-group">
                  <div className="hud-stat-labels">
                    <span className="hud-stat-title">Resource Availability</span>
                    <span className="hud-stat-value">{selectedCountry.resourcesLabel}</span>
                  </div>
                  <div className="hud-progress-track">
                    <div className="hud-progress-fill bg-green" style={{ width: `${selectedCountry.resources}%` }}></div>
                  </div>
                  <p className="hud-stat-desc">{selectedCountry.resourcesDesc}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: WHY CAPITALGRID IS DIFFERENT */}
      <section className="section differentiators-section" id="differentiators-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag neon-text-cyan">CORE CAPABILITIES</div>
            <h2 className="section-title" style={{ fontFamily: 'Outfit, sans-serif' }}>More Than A Tycoon Game</h2>
            <p className="section-subtitle">Experience a simulation deep enough to match the complexities of real global economics.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card glass-card">
              <div className="feature-icon"><i className="fa-solid fa-users-rays"></i></div>
              <h3 className="feature-title">Real Player Economy</h3>
              <p className="feature-desc">Your suppliers are real players. Price shifts, resource deficits, and demand spikes are driven by actual participant choices.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon"><i className="fa-solid fa-network-wired"></i></div>
              <h3 className="feature-title">Interconnected Industries</h3>
              <p className="feature-desc">Every business creates opportunities for others. Retailers cannot sell without manufacturers, who cannot assemble without raw mining resources.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon"><i className="fa-solid fa-brain"></i></div>
              <h3 className="feature-title">Strategic Decisions</h3>
              <p className="feature-desc">Every purchase matters. Negotiate trade agreements, adjust warehouse stock sizes, set retail margins, and compete on the open exchange.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon"><i className="fa-solid fa-globe"></i></div>
              <h3 className="feature-title">Country Simulation</h3>
              <p className="feature-desc">Every nation offers unique advantages. Leverage regional shipping routes, specialized resource fields, and custom taxation guidelines.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon"><i className="fa-solid fa-chart-line"></i></div>
              <h3 className="feature-title">Endless Growth</h3>
              <p className="feature-desc">Build small or dominate entire industries. Remain a specialized supplier or integrate vertically to become a trillion-dollar conglomerate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: FINAL CTA */}
      <section className="section final-cta-section" id="community-section">
        <div className="cta-pulse-glow"></div>
        <div className="container text-center cta-content-wrapper">
          <div className="badge neon-text-cyan pulse">
            <i className="fa-solid fa-tower-broadcast"></i> BROADCAST ACTIVE
          </div>
          <h2 className="cta-title" style={{ fontFamily: 'Outfit, sans-serif' }}>The Economy Is Waiting For Its Next Giant.</h2>
          <p className="cta-subtitle">Will you become a farmer, a manufacturer, a retailer, or the company everyone depends on?</p>
          
          <div className="cta-buttons">
            <Link to="/signup" className="btn btn-large btn-primary shadow-glow">
              Start Building Your Empire <i className="fa-solid fa-hammer"></i>
            </Link>
            <a href="#discord" className="btn btn-large btn-secondary">
              Join The Community <i className="fa-brands fa-discord"></i>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="game-footer">
        <div className="container footer-container">
          <div className="footer-brand-side">
            <div className="footer-logo">
              <img src="/assets/logo.svg" alt="CapitalGrid Logo" className="logo-image" />
            </div>
            <p className="footer-tagline">Build Companies. Shape Economies.</p>
            <p className="footer-copyright">&copy; 2026 CapitalGrid Studio. All rights reserved. Game content and materials are trademarks of their respective owners.</p>
          </div>

          <div className="footer-links-side">
            <div className="footer-link-group">
              <h4>Navigation</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><a href="#economy-section">Economy</a></li>
                <li><a href="#industries-section">Industries</a></li>
                <li><a href="#community-section">Community</a></li>
              </ul>
            </div>
            
            <div className="footer-link-group">
              <h4>Legal</h4>
              <ul>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms Of Service</a></li>
              </ul>
            </div>

            <div className="footer-link-group">
              <h4>Social Media</h4>
              <div className="social-icons">
                <a href="#discord" aria-label="Discord" className="social-icon"><i className="fa-brands fa-discord"></i></a>
                <a href="#twitter" aria-label="Twitter / X" className="social-icon"><i className="fa-brands fa-x-twitter"></i></a>
                <a href="#youtube" aria-label="YouTube" className="social-icon"><i className="fa-brands fa-youtube"></i></a>
                <a href="#steam" aria-label="Steam" className="social-icon"><i className="fa-brands fa-steam"></i></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
