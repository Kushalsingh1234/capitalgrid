import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import countriesData from '../data/countries';
import sectorsData from '../data/industries';

// Mapping country IDs to FlagCDN two-letter ISO country codes
const flagCodes = {
  india: 'in',
  usa: 'us',
  uk: 'gb',
  germany: 'de',
  japan: 'jp',
  brazil: 'br',
  australia: 'au'
};

// Inline SVG illustrations for the Industry Cards (royalty-free, lightweight, responsive)
function SectorIllustration({ id }) {
  if (id === 'primary') {
    return (
      <svg className="sector-svg" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="glowGradBlue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0066ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0066ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="200" height="100" fill="url(#primaryGrad)" rx="8" />
        <path d="M0,100 Q40,65 90,82 T200,68 L200,100 Z" fill="url(#glowGradBlue)" />
        <path d="M-10,95 Q50,75 110,90 T210,80" fill="none" stroke="rgba(0, 102, 255, 0.15)" strokeWidth="1.5" />
        
        {/* Wheat crop illustration */}
        <g transform="translate(35, 30) scale(0.9)">
          <path d="M10,40 Q15,20 12,10 M22,40 Q25,18 24,5" fill="none" stroke="#0066ff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="10" r="2" fill="#60a5fa" />
          <circle cx="24" cy="5" r="2" fill="#3b82f6" />
          <circle cx="9" cy="20" r="1.5" fill="#60a5fa" opacity="0.8" />
          <circle cx="27" cy="15" r="1.5" fill="#3b82f6" opacity="0.8" />
        </g>
        {/* Mining pickaxe / silo outline */}
        <g transform="translate(130, 25) scale(0.85)" stroke="#0066ff" strokeWidth="1.5" fill="none">
          <rect x="10" y="15" width="22" height="35" rx="3" fill="rgba(0, 102, 255, 0.1)" stroke="#3b82f6" strokeWidth="1.5" />
          <path d="M10,15 Q21,3 32,15" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="21" y1="15" x2="21" y2="50" stroke="rgba(255,255,255,0.15)" />
        </g>
      </svg>
    );
  }
  if (id === 'factories') {
    return (
      <svg className="sector-svg" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="factGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect width="200" height="100" fill="url(#factGrad)" rx="8" />
        
        {/* Conveyor belt with gears */}
        <path d="M 25,80 L 175,80" stroke="rgba(0, 102, 255, 0.35)" strokeWidth="4" strokeLinecap="round" />
        <circle cx="45" cy="80" r="4.5" fill="#0066ff" className="spinning-gear" />
        <circle cx="100" cy="80" r="4.5" fill="#0066ff" className="spinning-gear" />
        <circle cx="155" cy="80" r="4.5" fill="#0066ff" className="spinning-gear" />
        
        {/* Factory silhouette */}
        <path d="M 50,80 L 50,45 L 75,60 L 100,45 L 125,60 L 150,45 L 150,80 Z" fill="rgba(0, 102, 255, 0.12)" stroke="#0066ff" strokeWidth="1.8" />
        <line x1="75" y1="45" x2="75" y2="28" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="2" />
        <path d="M75,28 Q80,18 90,22" fill="none" stroke="rgba(0, 102, 255, 0.4)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'manufacturing') {
    return (
      <svg className="sector-svg" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="mfgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect width="200" height="100" fill="url(#mfgGrad)" rx="8" />
        
        {/* Microchip and circuits */}
        <rect x="70" y="25" width="60" height="45" rx="4" fill="rgba(0, 102, 255, 0.15)" stroke="#0066ff" strokeWidth="2" />
        <circle cx="100" cy="47" r="8" fill="rgba(0, 102, 255, 0.2)" stroke="#60a5fa" strokeWidth="1.5" />
        
        <path d="M 20,47 L 70,47 M 130,47 L 180,47 M 100,8 L 100,25 M 100,70 L 100,92" fill="none" stroke="rgba(0, 102, 255, 0.45)" strokeWidth="1.5" strokeDasharray="4,4" className="animated-circuits" />
        <circle cx="20" cy="47" r="3.5" fill="#60a5fa" />
        <circle cx="180" cy="47" r="3.5" fill="#60a5fa" />
        <circle cx="100" cy="8" r="3.5" fill="#0066ff" />
        <circle cx="100" cy="92" r="3.5" fill="#0066ff" />
      </svg>
    );
  }
  if (id === 'retail') {
    return (
      <svg className="sector-svg" viewBox="0 0 200 100">
        <defs>
          <linearGradient id="retailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0B0F19" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <rect width="200" height="100" fill="url(#retailGrad)" rx="8" />
        
        {/* Storefront outline */}
        <path d="M 30,80 L 110,80 M 110,80 L 110,42 L 30,42 Z" fill="rgba(0, 102, 255, 0.08)" stroke="#3b82f6" strokeWidth="1.5" />
        <path d="M 25,42 L 115,42" stroke="#0066ff" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="45" y="55" width="20" height="25" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
        <rect x="75" y="55" width="20" height="25" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
        
        {/* Logistics distribution arrow line */}
        <path d="M 125,65 L 160,65 L 165,70 L 175,70 L 175,75 M 125,75 L 175,75" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        <circle cx="140" cy="75" r="2.5" fill="#60a5fa" />
        <circle cx="165" cy="75" r="2.5" fill="#0066ff" />
      </svg>
    );
  }
  return null;
}

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
  const [visibleNews, setVisibleNews] = useState([0, 1, 2, 3, 4, 5, 6, 7, 8]);

  const [companyStocks, setCompanyStocks] = useState([
    { name: 'ARES CORP', fullName: 'Ares Commodities Corp', price: 142.50, change: '+1.80%', up: true },
    { name: 'APEXRETAIL', fullName: 'Apex Global Retailers', price: 89.20, change: '-0.52%', up: false },
    { name: 'GENESISAUTO', fullName: 'Genesis Automotive Group', price: 210.45, change: '+4.20%', up: true },
    { name: 'CYBERSTEEL', fullName: 'CyberSteel Refineries', price: 64.75, change: '-2.15%', up: false },
    { name: 'STARLIGHT', fullName: 'Starlight Agriculture', price: 118.10, change: '+0.85%', up: true }
  ]);

  // Bloomberg structured news pool
  const newsHeadlines = [
    { type: 'M&A', text: 'AUTOFORGE ACQUIRES MICROCHIP INDUSTRIES IN ALL-STOCK TRANSACTION' },
    { type: 'MARKET', text: 'INDIA WHEAT EXPORTS SURGE 18% AS GLOBAL SUPPLIES TIGHTEN' },
    { type: 'M&A', text: 'GENESISAUTO ACQUIRES CYBERSTEEL REFINERY IN $4.2B DEAL' },
    { type: 'COMMODITY', text: 'STEEL PRICES HIT SIX-MONTH HIGH AMID HEAVY CONSTRUCTION DEMAND' },
    { type: 'M&A', text: 'APEXRETAIL MERGES WITH STARLIGHT LOGISTICS FOR SUPPLY INTEGRATION' },
    { type: 'MARKET', text: 'GLOBAL FUEL PRICES RISE; SHIPPING CHARGES EXPECTED TO INCREMENT' },
    { type: 'M&A', text: 'NOVA MINES ENTERS DEFENSIVE MERGER COMPACT WITH INDUSTRIAL GIANT' },
    { type: 'DEMAND', text: 'ASIAN MANUFACTURING SECTOR REPORT SURGE IN RAW MATERIALS ORDERING' },
    { type: 'M&A', text: 'ARES CORP SECURES CONTROLLING STAKE IN REGIONAL WEAVING MILL' },
    { type: 'M&A', text: 'NEURON BAKING MERGES WITH APEXRETAIL RETAIL NETWORK' },
    { type: 'MARKET', text: 'GERMANY INDUSTRIAL PRODUCTION SURVEY REVEALS RISE IN MACHINERY EXPORTS' },
    { type: 'M&A', text: 'ARES CORP IN TALKS TO ACQUIRE SHORELINE OIL AND FUEL REFINERIES' },
    { type: 'COMMODITY', text: 'COAL INDEX SURGES 5.4% AS POWER DEMAND INCREASES ACROSS EUROPE' },
    { type: 'MARKET', text: 'GLOBAL SHIPPING CONGESTION EASES; FREIGHT CHARGES EXPECTED TO DROP' },
    { type: 'DEMAND', text: 'AUTOFORGE ANNOUNCES NEW SEMICONDUCTOR FABRICATION PLANT IN JAPAN' }
  ];

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

  // 2. Interactive Canvas World Network Map (Relocated to dedicated section)
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

    // Stylized dot-matrix world continents representation (16 rows x 30 cols)
    const WORLD_GRID = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,0,0],
      [0,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,0],
      [0,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,0],
      [0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,0,0],
      [0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1,0,0],
      [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0],
      [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0]
    ];

    const initNetwork = () => {
      nodes = [
        { id: 'USA', name: 'New York Hub', x: width * 0.22, y: height * 0.35, size: 5 },
        { id: 'UK', name: 'London Hub', x: width * 0.43, y: height * 0.28, size: 4 },
        { id: 'GERMANY', name: 'Berlin Hub', x: width * 0.50, y: height * 0.26, size: 4 },
        { id: 'BRAZIL', name: 'Sao Paulo Hub', x: width * 0.33, y: height * 0.72, size: 4.5 },
        { id: 'INDIA', name: 'Mumbai Hub', x: width * 0.65, y: height * 0.48, size: 5 },
        { id: 'JAPAN', name: 'Tokyo Hub', x: width * 0.82, y: height * 0.32, size: 5 },
        { id: 'AUSTRALIA', name: 'Sydney Hub', x: width * 0.85, y: height * 0.8, size: 4.5 }
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
          speed: 0.004 + Math.random() * 0.007,
          color: Math.random() > 0.5 ? '#0066ff' : '#60a5fa'
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      initNetwork();
    };

    // Click handler to select country and scroll down to Countries Section profile
    const handleCanvasClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const clickY = ((event.clientY - rect.top) / rect.height) * canvas.height;

      const clickedNode = nodes.find(node => {
        const dist = Math.hypot(node.x - clickX, node.y - clickY);
        return dist < 22; // click hit radius
      });

      if (clickedNode) {
        setSelectedCountryKey(clickedNode.id.toLowerCase());
        const element = document.getElementById('countries-section');
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('click', handleCanvasClick);
    initNetwork();

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw dot-matrix world map contours for continents
      ctx.fillStyle = 'rgba(0, 102, 255, 0.07)';
      const cols = WORLD_GRID[0].length;
      const rows = WORLD_GRID.length;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (WORLD_GRID[r][c] === 1) {
            ctx.beginPath();
            ctx.arc((width / cols) * c + (width / cols) / 2, (height / rows) * r + (height / rows) / 2, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw Connection Routes
      ctx.lineWidth = 1;
      connections.forEach(conn => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0, 102, 255, 0.12)';
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();
        }
      });

      // Draw Active Particles (Trade Flow)
      particles.forEach((part, index) => {
        part.progress += part.speed;
        part.x = part.x + (part.targetX - part.x) * part.progress;
        part.y = part.y + (part.targetY - part.y) * part.progress;

        ctx.beginPath();
        ctx.arc(part.x, part.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = part.color;
        ctx.shadowBlur = 6;
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
        ctx.strokeStyle = 'rgba(0, 102, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = '#0066ff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 102, 255, 0.5)';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '600 8.5px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.id, node.x, node.y - 12);
      });

      if (Math.random() < 0.035 && particles.length < 25) {
        spawnParticle();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', handleCanvasClick);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // 3. Live Market Activity Ticker logic
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
    }, 2800); // Ticker updates faster for more dynamics

    return () => clearInterval(interval);
  }, []);

  // 4. Sequential Flow Diagram Pulsing Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFlowIndex(prev => (prev + 1) % 4);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // 5. Bloomberg News Feed Panel Rotation (Cycles Visible News Indices, faster 2.8s loop)
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleNews(prev => {
        const nextIndex = (prev[prev.length - 1] + 1) % newsHeadlines.length;
        return [...prev.slice(1), nextIndex];
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // 6. Live Company Stock Price Fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setCompanyStocks(prev => prev.map(stock => {
        const delta = (Math.random() - 0.48) * 1.8;
        const newPrice = Math.max(10, +(stock.price + delta).toFixed(2));
        const diffPercent = (delta / stock.price) * 100;
        const isUp = delta >= 0;
        const changeStr = (isUp ? '+' : '') + diffPercent.toFixed(2) + '%';
        return {
          ...stock,
          price: newPrice,
          change: changeStr,
          up: isUp
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Continuous Stock ticker data (CapitalGrid Blue, continuously scrolls)
  const tickerItems = [
    { name: 'COTTON', change: '▲ 4.2%', up: true },
    { name: 'STEEL', change: '▼ 1.8%', up: false },
    { name: 'COAL', change: '▲ 5.4%', up: true },
    { name: 'OIL', change: '▲ 2.1%', up: true },
    { name: 'CARS', change: '▲ 1.2%', up: true },
    { name: 'MICROCHIPS', change: '▲ 6.3%', up: true },
    { name: 'WHEAT', change: '▼ 0.8%', up: false }
  ];

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
        {/* Transparent Skyline Backdrop Image (SAAS Aesthetics) */}
        <div className="hero-image-background" style={{ backgroundImage: 'url("/assets/city_skyline_hero.png")' }}></div>

        <div className="hero-container container relative z-10">
          {/* Hero Main Content */}
          <div className="hero-content max-w-[850px] w-full">
            <div className="badge">
              <i className="fa-solid fa-gamepad"></i> Multiplayer Live Economy
            </div>
            <h1 className="hero-title leading-tight">
              Build Companies.<br />
              <span className="text-gradient">Control Industries.</span><br />
              Shape The Economy.
            </h1>
            <p className="hero-subtitle">
              Every product in CapitalGrid is created by a real player. Farmers grow resources, factories manufacture goods, retailers sell products, and businesses depend on each other to thrive. Build your empire inside a living, player-driven economy.
            </p>
            <div className="hero-actions mb-8">
              <Link to="/signup" className="btn btn-large btn-primary">
                Start Your Company <i className="fa-solid fa-arrow-right"></i>
              </Link>
              <a href="#economy-section" className="btn btn-large btn-secondary">
                Explore The Economy <i className="fa-solid fa-network-wired"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Stats Bar (Positioned at bottom of Hero stretching full width) */}
        <div className="hero-stats-bar w-full">
          <div className="container stats-bar-container">
            <div className="stat-item">
              <div className="stat-value text-blue-500">5+</div>
              <div className="stat-label">Industries</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value text-blue-500">20+</div>
              <div className="stat-label">Products</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-value text-blue-500">7</div>
              <div className="stat-label">Countries</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item animate-pulse-glow">
              <div className="stat-value text-gradient">100%</div>
              <div className="stat-label">Player Driven Economy</div>
            </div>
          </div>
        </div>

        {/* Live Market Ticker Bar (Styled in CapitalGrid blue, continuously scrolls) */}
        <div className="stock-ticker-bar w-full border-t border-b border-blue-900/30">
          <div className="ticker-track">
            {/* Duplicated for seamless loop */}
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
              <React.Fragment key={idx}>
                <span className="ticker-item inline-flex items-center gap-1.5 px-6 font-display text-xs tracking-wider font-semibold text-gray-300">
                  <span className="ticker-name font-bold text-white">{item.name}</span>
                  <span className={item.up ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {item.change}
                  </span>
                </span>
                <span className="ticker-divider text-blue-900/50">|</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* SECTION 1.5: LIVE MARKET FEED */}
      <section className="section live-market-section bg-gameBg" id="live-market-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag">REAL-TIME MARKET INTELLIGENCE</div>
            <h2 className="section-title">Live Economy & Market Feed</h2>
            <p className="section-subtitle">Monitor corporate mergers, global trade news, and real-time stock fluctuations.</p>
          </div>

          <div className="market-feed-grid mt-12">
            {/* Left Bulletin: Bloomberg News Terminal */}
            <div className="bloomberg-terminal glass-card w-full">
              <div className="terminal-header">
                <span className="dot red pulsing-dot-red"></span>
                <span className="terminal-title">BLOOMBERG NEWS TERMINAL</span>
                <span className="terminal-status"><i className="fa-solid fa-circle-check"></i> LIVE NEWS</span>
              </div>
              <div className="news-list-panel">
                <div className="news-panel-header">BREAKING NEWS Feed</div>
                <div className="news-items-container flex flex-col gap-1 p-3">
                  {visibleNews.map((newsIdx, idx) => {
                    const item = newsHeadlines[newsIdx];
                    return (
                      <div key={idx} className="news-item-row flex items-center gap-2.5 py-2 border-b border-white/5 last:border-0 animate-fade-in">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest ${
                          item.type === 'M&A' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/35 shadow-[0_0_8px_rgba(0,102,255,0.15)]' 
                            : 'bg-gray-800/80 text-gray-400 border border-gray-700/30'
                        }`}>
                          {item.type}
                        </span>
                        <span className="news-headline-text text-[11px] font-semibold tracking-wide text-white flex-grow line-clamp-1">
                          {item.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Bulletin: Stock Prices & Market Graphic */}
            <div className="stock-tracker-panel glass-card w-full">
              <div className="terminal-header">
                <span className="dot green pulsing-dot-green"></span>
                <span className="terminal-title">LIVE COMPANY STOCK TRACKER</span>
                <span className="terminal-status"><i className="fa-solid fa-chart-line"></i> TICKER ON</span>
              </div>
              
              <div className="p-4">
                {/* Stock Price Bulletin List */}
                <div className="stock-list-container mt-0 flex flex-col gap-2">
                  {companyStocks.map((stock, idx) => (
                    <div key={idx} className="stock-row">
                      <div className="stock-name-col">
                        <span className="stock-symbol">{stock.name}</span>
                        <span className="stock-full-name">{stock.fullName}</span>
                      </div>
                      <div className="stock-price-col">
                        <div className="stock-price-val">${stock.price.toFixed(2)}</div>
                        <span className={`stock-change-val ${stock.up ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}`}>
                          {stock.up ? '▲' : '▼'} {stock.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: HOW THE ECONOMY WORKS */}
      <section className="section economy-section" id="economy-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag">GLOBAL ECONOMY</div>
            <h2 className="section-title">One Economy. Thousands Of Possibilities.</h2>
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
              It depends on becoming <span className="text-gradient">valuable</span> to them."
            </h3>
          </div>
        </div>
      </section>

      {/* SECTION 3: CHOOSE YOUR INDUSTRY */}
      <section className="section industries-section" id="industries-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag">INDUSTRY SECTORS</div>
            <h2 className="section-title">Choose Your Path To Power</h2>
            <p className="section-subtitle">Select which sector of the global economy you want to dominate.</p>
          </div>

          <div className="industry-grid">
            {sectorsData.map((sect) => (
              <div key={sect.id} className="industry-card glass-card overflow-hidden">
                <SectorIllustration id={sect.id} />
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
            <div className="section-tag">YOUR JOURNEY</div>
            <h2 className="section-title">Every Empire Starts With One Decision</h2>
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

      {/* SECTION 4.5: GLOBAL TRADE MAP (Transition before Countries section) */}
      <section className="section global-trade-map-section py-20 border-t border-blue-900/10" id="trade-map-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag">GLOBAL LOGISTICS</div>
            <h2 className="section-title">Connected Markets, Global Trade</h2>
            <p className="section-subtitle">
              Click on any major economic hub to inspect the local country profile and tax structure below.
            </p>
          </div>

          <div className="global-map-panel glass-card relative overflow-hidden w-full h-[400px] border border-blue-900/35 shadow-cyan">
            <canvas ref={canvasRef} id="map-canvas" className="w-full h-full cursor-pointer"></canvas>
            <div className="map-interaction-instructions absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider text-blue-400">
              <i className="fa-solid fa-mouse-pointer text-blue-500 animate-pulse"></i> INTERACTIVE HUB RADAR (CLICK TO RADAR SELECT)
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: GLOBAL BUSINESS EXPERIENCE */}
      <section className="section countries-section" id="countries-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="section-tag">GLOBAL PRESENCE</div>
            <h2 className="section-title">Build Anywhere In The World</h2>
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
                  <div className="country-header flex items-center gap-3">
                    <img 
                      src={`https://flagcdn.com/w40/${flagCodes[country.id]}.png`}
                      srcSet={`https://flagcdn.com/w80/${flagCodes[country.id]}.png 2x`}
                      alt={`${country.name} Flag`}
                      className="country-flag-img rounded-[3px] border border-white/10"
                      style={{ width: '26px', height: 'auto', objectFit: 'contain' }}
                    />
                    <h3 className="country-name text-white font-bold">{country.name}</h3>
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
                <span className="hud-tag">COUNTRY PROFILE</span>
                <div className="hud-country-title-row flex items-center gap-3 mt-1.5">
                  <img 
                    src={`https://flagcdn.com/w40/${flagCodes[selectedCountry.id]}.png`}
                    srcSet={`https://flagcdn.com/w80/${flagCodes[selectedCountry.id]}.png 2x`}
                    alt={`${selectedCountry.name} Flag`}
                    className="hud-country-flag-img rounded-[3px] border border-white/10"
                    style={{ width: '32px', height: 'auto', objectFit: 'contain' }}
                  />
                  <h3 className="hud-country-name text-white font-bold">{selectedCountry.name}</h3>
                </div>
                <span className="hud-status"><i className="fa-solid fa-chart-line text-blue-500"></i> ECONOMY: ACTIVE</span>
              </div>

              <div className="hud-body">
                <div className="hud-stat-group">
                  <div className="hud-stat-labels">
                    <span className="hud-stat-title">Corporate Tax Rate</span>
                    <span className="hud-stat-value">{selectedCountry.taxLabel}</span>
                  </div>
                  <div className="hud-progress-track">
                    <div className="hud-progress-fill bg-cyanGlow" style={{ width: `${selectedCountry.taxRate * 4}%` }}></div>
                  </div>
                  <p className="hud-stat-desc">{selectedCountry.taxDesc}</p>
                </div>

                <div className="hud-stat-group">
                  <div className="hud-stat-labels">
                    <span className="hud-stat-title">Economic Strength</span>
                    <span className="hud-stat-value text-blue-500">{selectedCountry.strengthLabel}</span>
                  </div>
                  <div className="hud-progress-track">
                    <div className="hud-progress-fill bg-blue-500" style={{ width: `${selectedCountry.strength}%` }}></div>
                  </div>
                  <p className="hud-stat-desc">{selectedCountry.strengthDesc}</p>
                </div>

                <div className="hud-stat-group">
                  <div className="hud-stat-labels">
                    <span className="hud-stat-title">Resource Availability</span>
                    <span className="hud-stat-value text-green-500">{selectedCountry.resourcesLabel}</span>
                  </div>
                  <div className="hud-progress-track">
                    <div className="hud-progress-fill bg-green-500" style={{ width: `${selectedCountry.resources}%` }}></div>
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
            <div className="section-tag">WHY CAPITALGRID</div>
            <h2 className="section-title">More Than A Tycoon Game</h2>
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

            <div className="feature-card glass-card">
              <div className="feature-icon"><i className="fa-solid fa-code-merge"></i></div>
              <h3 className="feature-title">Mergers & Acquisitions</h3>
              <p className="feature-desc">Acquire competitors, merge supply chains, and secure controlling corporate stakes to rapidly expand your operational scale.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon"><i className="fa-solid fa-scale-balanced"></i></div>
              <h3 className="feature-title">Macroeconomic Drivers</h3>
              <p className="feature-desc">Navigate regional trade tariffs, fluctuating export volumes, and dynamic commodity index adjustments in a deep simulation.</p>
            </div>

            <div className="feature-card glass-card">
              <div className="feature-icon"><i className="fa-solid fa-bolt"></i></div>
              <h3 className="feature-title">Real-Time Fluid Economy</h3>
              <p className="feature-desc">Watch trade flows, resource trades, and news updates tick in real-time as thousands of players make simultaneous decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: FINAL CTA */}
      <section className="section final-cta-section" id="community-section">
        <div className="cta-pulse-glow"></div>
        <div className="container text-center cta-content-wrapper">
          <div className="badge pulse">
            <i className="fa-solid fa-tower-broadcast"></i> JOIN THE MARKET
          </div>
          <h2 className="cta-title">The Economy Is Waiting For Its Next Giant.</h2>
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
