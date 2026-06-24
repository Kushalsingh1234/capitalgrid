/* ==========================================================================
   CapitalGrid - Interactive Animations & HUD Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- NAVBAR SCROLL STATE ---
  const navbar = document.getElementById('main-navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // --- MOBILE NAV MENU TOGGLE ---
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.getElementById('nav-links');
  
  mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close menu when clicking a link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });


  // --- SECTION ENTRANCE REVEAL TRIGGERS ---
  const revealElements = document.querySelectorAll('.industry-card, .feature-card, .section-header, .flow-track-box');
  
  // Apply initial reveal class
  revealElements.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => revealObserver.observe(el));


  // --- HERO GLOWING WORLD NETWORK (CANVAS) ---
  const canvas = document.getElementById('map-canvas');
  const ctx = canvas.getContext('2d');
  
  let width = canvas.width = canvas.offsetWidth;
  let height = canvas.height = canvas.offsetHeight;

  // Handle Resize
  window.addEventListener('resize', () => {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
    initNetwork();
  });

  // Map Nodes (Representative Global Hubs)
  let nodes = [];
  let connections = [];
  let particles = [];

  function initNetwork() {
    nodes = [
      { id: 'USA', name: 'New York Hub', x: width * 0.25, y: height * 0.35, size: 5 },
      { id: 'UK', name: 'London Hub', x: width * 0.45, y: height * 0.28, size: 4 },
      { id: 'GERMANY', name: 'Berlin Hub', x: width * 0.52, y: height * 0.26, size: 4 },
      { id: 'BRAZIL', name: 'Sao Paulo Hub', x: width * 0.35, y: height * 0.75, size: 4.5 },
      { id: 'INDIA', name: 'Mumbai Hub', x: width * 0.68, y: height * 0.48, size: 5 },
      { id: 'JAPAN', name: 'Tokyo Hub', x: width * 0.85, y: height * 0.32, size: 5 },
      { id: 'AUSTRALIA', name: 'Sydney Hub', x: width * 0.88, y: height * 0.8, size: 4.5 }
    ];

    // Establish logical trade links
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
  }

  // Spawn trading transaction particle
  function spawnParticle() {
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
  }

  // Animation Loop for network map
  function animateNetwork() {
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

      // Draw particle glow
      ctx.beginPath();
      ctx.arc(part.x, part.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = part.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = part.color;
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      // Remove completed particles
      if (part.progress >= 1) {
        particles.splice(index, 1);
      }
    });

    // Draw Country Hubs
    nodes.forEach(node => {
      // Glow Ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Core Node
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fillStyle = '#00d2ff';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00d2ff';
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      // Label text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '700 8px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(node.id, node.x, node.y - 12);
    });

    // Spawn new particles periodically
    if (Math.random() < 0.03 && particles.length < 25) {
      spawnParticle();
    }

    requestAnimationFrame(animateNetwork);
  }

  // Initialize and run Network Map
  initNetwork();
  animateNetwork();


  // --- HERO LIVE ACTIVITY LEDGER FEED TICKER ---
  const logsContainer = document.getElementById('activity-logs');
  
  const players = ['AresCorp', 'ApexRetail', 'QuantumLogistics', 'StarlightFarms', 'CyberSteel', 'NeuronBaking', 'NovaMines', 'GenesisAuto', 'ZeroGravity'];
  const materials = ['Iron Ore', 'High-Grade Silicon', 'Organic Milk', 'Cotton Fiber', 'Processors', 'Synthetic Fabrics', 'Steel Sheets'];
  const factories = ['Steel Refinery', 'Silicon Lab', 'Dairy Processor', 'Weaving Mill', 'Microchip Assembly', 'Heavy Forge', 'Garment Floor'];
  
  const actions = [
    (p1, p2) => `🌾 <span class="player">${p1}</span> sold Cotton to <span class="facility">${p2 || 'Garment Factory'}</span>`,
    (p1) => `👕 <span class="player">${p1}</span> manufactured <span class="units">150 Custom Jackets</span>`,
    (p1) => `🚗 <span class="player">${p1}</span> launched standard sedan sales at <span class="facility">Car Showroom</span>`,
    (p1, p2) => `🏦 Logistical services rented by <span class="facility">${p2 || 'Heavy Factory'}</span> from <span class="player">${p1}</span>`,
    (p1, p2) => `⛏️ <span class="player">${p1}</span> shipped 400 tons of Iron to <span class="facility">${p2 || 'Ares Refinery'}</span>`,
    (p1) => `💻 <span class="player">${p1}</span> assembled <span class="units">300 Quantum Tablets</span>`,
    (p1) => `🍔 <span class="player">${p1}</span> served 500 meals at premium <span class="facility">Downtown Restaurant</span>`
  ];

  function getFormattedTime() {
    const d = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
  }

  function addNewLog() {
    const p1 = players[Math.floor(Math.random() * players.length)];
    // Ensure p2 is different
    let p2 = players[Math.floor(Math.random() * players.length)];
    while (p2 === p1) {
      p2 = players[Math.floor(Math.random() * players.length)];
    }
    const targetFactory = factories[Math.floor(Math.random() * factories.length)];
    const actFunc = actions[Math.floor(Math.random() * actions.length)];

    const logText = actFunc(p1, targetFactory);
    const timeStr = getFormattedTime();

    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.innerHTML = `<span class="log-time">${timeStr}</span> ${logText}`;
    
    logsContainer.appendChild(logEntry);

    // Keep max 5 logs visible for aesthetic scroll limit
    while (logsContainer.children.length > 5) {
      logsContainer.removeChild(logsContainer.firstChild);
    }
  }

  // Ticker updates every 3 seconds
  setInterval(addNewLog, 3000);


  // --- SECTION 2: SEQUENTIAL FLOW DIAGRAM ANIMATION ---
  // Highlight sequentially to demonstrate ecosystem flow
  let activeChainIndex = 0;
  
  const chain1Nodes = [
    document.getElementById('node-farmer'),
    document.getElementById('node-garment'),
    document.getElementById('node-clothing-retail'),
    document.getElementById('node-textile-customers')
  ];

  const chain2Nodes = [
    document.getElementById('node-mining'),
    document.getElementById('node-construction-factory'),
    document.getElementById('node-automobile-manufacturing'),
    document.getElementById('car-showroom') // Wait, the ID in index.html is node-car-showroom, let's verify
  ];

  // Fix index.html reference selector
  const c2Node4 = document.getElementById('node-car-showroom') || document.getElementById('car-showroom');
  const chain2CorrectedNodes = [
    document.getElementById('node-mining'),
    document.getElementById('node-construction-factory'),
    document.getElementById('node-automobile-manufacturing'),
    c2Node4
  ];

  function runFlowSequencer() {
    // Deactivate all
    chain1Nodes.concat(chain2CorrectedNodes).forEach(node => {
      if (node) node.classList.remove('active-pulse');
    });

    // Activate index step
    const n1 = chain1Nodes[activeChainIndex];
    const n2 = chain2CorrectedNodes[activeChainIndex];
    
    if (n1) n1.classList.add('active-pulse');
    if (n2) n2.classList.add('active-pulse');

    activeChainIndex = (activeChainIndex + 1) % 4;
  }

  // Cycle flows every 2.5 seconds
  setInterval(runFlowSequencer, 2500);


  // --- SECTION 4: TIMELINE PROGRESS OBSERVING ---
  const timelineProgressFill = document.getElementById('timeline-progress-line');
  const timelineSection = document.getElementById('how-it-works-section');
  const timelineSteps = document.querySelectorAll('.timeline-step');

  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateTimelineProgress();
      }
    });
  }, { threshold: 0.2 });

  if (timelineSection) {
    timelineObserver.observe(timelineSection);
  }

  function animateTimelineProgress() {
    let currentStep = 0;
    timelineProgressFill.style.height = '0%';
    
    // Cycle and activate step-by-step
    const interval = setInterval(() => {
      if (currentStep >= timelineSteps.length) {
        clearInterval(interval);
        return;
      }
      
      const stepEl = timelineSteps[currentStep];
      stepEl.classList.add('active');
      
      // Calculate progress fill percentage
      const percent = ((currentStep) / (timelineSteps.length - 1)) * 100;
      timelineProgressFill.style.height = `${percent}%`;
      
      currentStep++;
    }, 450);
  }


  // --- SECTION 5: GLOBAL BUSINESS INTERACTIVE HUDS ---
  const countryCards = document.querySelectorAll('.country-card');
  const hudFlag = document.getElementById('hud-country-flag');
  const hudName = document.getElementById('hud-country-name');
  
  const hudTaxVal = document.getElementById('hud-tax-val');
  const hudTaxBar = document.getElementById('hud-tax-bar');
  const hudTaxDesc = document.getElementById('hud-tax-desc');

  const hudStrengthVal = document.getElementById('hud-strength-val');
  const hudStrengthBar = document.getElementById('hud-strength-bar');
  const hudStrengthDesc = document.getElementById('hud-strength-desc');

  const hudResourcesVal = document.getElementById('hud-resources-val');
  const hudResourcesBar = document.getElementById('hud-resources-bar');
  const hudResourcesDesc = document.getElementById('hud-resources-desc');

  // Country database configuration
  const countryDb = {
    india: {
      flag: '🇮🇳',
      name: 'India',
      tax: 12,
      taxLabel: '12%',
      taxDesc: 'Favorable corporate taxing. Boosts early-stage startup viability and fast liquidity reinvestment.',
      strength: 80,
      strengthLabel: 'High Growth',
      strengthDesc: 'Emerging industrial sector with skyrocketing consumer demand. Retail spaces experience hyper-activity.',
      resources: 90,
      resourcesLabel: 'Abundant',
      resourcesDesc: 'Extremely rich in agricultural and fabric materials. Ideal base location for Primary Sector and textile setups.'
    },
    usa: {
      flag: '🇺🇸',
      name: 'United States',
      tax: 18,
      taxLabel: '18%',
      taxDesc: 'Higher tax rate offset by massive local consumption and global shipping advantages.',
      strength: 95,
      strengthLabel: 'Market Power',
      strengthDesc: 'World\'s primary capital center. Highly stable pricing indexes on raw goods and materials.',
      resources: 75,
      resourcesLabel: 'High',
      resourcesDesc: 'High availability of industrial parts and energy resources. Top-tier manufacturing hub.'
    },
    uk: {
      flag: '🇬🇧',
      name: 'United Kingdom',
      tax: 16,
      taxLabel: '16%',
      taxDesc: 'Standard European tax rules. Offset by special customs agreements on shipping imports/exports.',
      strength: 70,
      strengthLabel: 'Trade Hub',
      strengthDesc: 'Financial capital of the Western hemisphere. Excellent options for low-cost banking and loans.',
      resources: 60,
      resourcesLabel: 'Moderate',
      resourcesDesc: 'Moderate raw minerals. Highly optimized for high-end retail networks and distribution.'
    },
    germany: {
      flag: '🇩🇪',
      name: 'Germany',
      tax: 15,
      taxLabel: '15%',
      taxDesc: 'Balanced business tax structure, incentivizing mechanical and automobile production setups.',
      strength: 85,
      strengthLabel: 'Industrial Lead',
      strengthDesc: 'Strong European economic driver. High efficiency multipliers on complex heavy factory equipment.',
      resources: 70,
      resourcesLabel: 'Steady',
      resourcesDesc: 'Steady supplies of coal and metal parts. Ideal location for automotive and assembly lines.'
    },
    japan: {
      flag: '🇯🇵',
      name: 'Japan',
      tax: 14,
      taxLabel: '14%',
      taxDesc: 'Low technology taxes. High government grants for electronics manufacturers.',
      strength: 75,
      strengthLabel: 'Tech Dominant',
      strengthDesc: 'Advanced micro-processor markets. Electronics retail commands premium profit margins.',
      resources: 50,
      resourcesLabel: 'Scarce',
      resourcesDesc: 'Scarce raw metals. Highly dependent on importing resources, but offset by high processing yield.'
    },
    brazil: {
      flag: '🇧🇷',
      name: 'Brazil',
      tax: 10,
      taxLabel: '10%',
      taxDesc: 'Lowest corporate tax rate in the hemisphere. Extremely cheap startup formation costs.',
      strength: 65,
      strengthLabel: 'Raw Materials',
      strengthDesc: 'Highly liquid resource trading center. High volatility, offering arbitrage trading opportunities.',
      resources: 95,
      resourcesLabel: 'Abundant',
      resourcesDesc: 'Unmatched agricultural lands and iron reserves. The ultimate primary resource provider.'
    },
    australia: {
      flag: '🇦🇺',
      name: 'Australia',
      tax: 11,
      taxLabel: '11%',
      taxDesc: 'Favorable extraction tax credits. Lower royalties on mined minerals.',
      strength: 68,
      strengthLabel: 'Mining Giant',
      strengthDesc: 'Stable oceanic trade route connections. Reliable shipping and raw materials market rates.',
      resources: 92,
      resourcesLabel: 'Abundant',
      resourcesDesc: 'Incredibly massive gold, lithium, and steel reserves. The perfect environment for mining companies.'
    }
  };

  countryCards.forEach(card => {
    card.addEventListener('click', () => {
      // Deactivate current active card
      countryCards.forEach(c => c.classList.remove('active'));
      
      // Activate clicked
      card.classList.add('active');
      
      // Retrieve key and database object
      const countryKey = card.dataset.country;
      const data = countryDb[countryKey];
      
      if (data) {
        // Trigger quick blink animation on HUD to simulate load
        const hudEl = document.getElementById('country-hud');
        hudEl.style.opacity = 0.5;
        setTimeout(() => {
          hudEl.style.opacity = 1;
        }, 120);

        // Update Text values
        hudFlag.textContent = data.flag;
        hudName.textContent = data.name;
        
        hudTaxVal.textContent = data.taxLabel;
        hudTaxDesc.textContent = data.taxDesc;
        hudTaxBar.style.width = `${data.tax * 4}%`; // scale representation

        hudStrengthVal.textContent = data.strengthLabel;
        hudStrengthDesc.textContent = data.strengthDesc;
        hudStrengthBar.style.width = `${data.strength}%`;

        hudResourcesVal.textContent = data.resourcesLabel;
        hudResourcesDesc.textContent = data.resourcesDesc;
        hudResourcesBar.style.width = `${data.resources}%`;
      }
    });
  });

});
