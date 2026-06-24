import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as startupService from '../services/startupService';

// Futuristic inline SVG preset icons
const PRESET_LOGOS = [
  {
    id: 'preset_1',
    name: 'Apex Delta',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full text-cyanGlow" fill="none" stroke="currentColor" stroke-width="2.5">
  <polygon points="50,15 90,80 10,80" stroke-linejoin="round" />
  <polygon points="50,35 75,75 25,75" stroke-linejoin="round" opacity="0.5" />
  <circle cx="50" cy="55" r="8" fill="currentColor" />
</svg>`
  },
  {
    id: 'preset_2',
    name: 'Nova Sphere',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full text-blueGlow" fill="none" stroke="currentColor" stroke-width="2.5">
  <circle cx="50" cy="50" r="30" />
  <ellipse cx="50" cy="50" rx="40" ry="10" transform="rotate(-30 50 50)" />
  <circle cx="50" cy="50" r="10" fill="currentColor" />
</svg>`
  },
  {
    id: 'preset_3',
    name: 'Fusion Core',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full text-greenGlow" fill="none" stroke="currentColor" stroke-width="2.5">
  <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" stroke-linejoin="round" />
  <polygon points="50,25 72,38 72,62 50,75 28,62 28,38" stroke-linejoin="round" opacity="0.6" />
  <circle cx="50" cy="50" r="6" fill="currentColor" />
</svg>`
  },
  {
    id: 'preset_4',
    name: 'Vortex Hub',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full text-warningGlow" fill="none" stroke="currentColor" stroke-width="2.5">
  <path d="M20,50 Q35,20 50,50 T80,50" />
  <path d="M20,60 Q35,30 50,60 T80,60" opacity="0.5" />
  <path d="M20,40 Q35,10 50,40 T80,40" opacity="0.5" />
  <circle cx="50" cy="50" r="6" fill="currentColor" />
</svg>`
  },
  {
    id: 'preset_5',
    name: 'Bio Catalyst',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full text-purple-400" fill="none" stroke="currentColor" stroke-width="2.5">
  <path d="M50,15 C50,15 80,45 80,65 C80,80 65,90 50,90 C35,90 20,80 20,65 C20,45 50,15 50,15 Z" />
  <circle cx="50" cy="65" r="8" fill="currentColor" />
</svg>`
  },
  {
    id: 'preset_6',
    name: 'Apex Node',
    svg: `<svg viewBox="0 0 100 100" class="w-full h-full text-rose-500" fill="none" stroke="currentColor" stroke-width="2.5">
  <path d="M15,20 L50,10 L85,20 L80,60 C75,80 50,90 50,90 C50,90 25,80 20,60 Z" />
  <polygon points="50,35 60,55 40,55" fill="currentColor" />
</svg>`
  }
];

const COUNTRY_DETAILS = {
  'India': {
    flag: '🇮🇳',
    code: 'IND',
    tax: '12% (Moderate Taxes)',
    strength: 'Strong agricultural and fabric resources',
    desc: 'India offers an emerging industrial economy with rapid resource extraction capabilities, making it ideal for farming, dairy, and textiles.'
  },
  'United States': {
    flag: '🇺🇸',
    code: 'USA',
    tax: '18% (High Taxes)',
    strength: 'Market power and energy infrastructure',
    desc: 'The US offers massive consumer market demand and premium pricing stability, providing substantial scaling bonuses for advanced manufacturing.'
  },
  'United Kingdom': {
    flag: '🇬🇧',
    code: 'GBR',
    tax: '16% (Moderate Taxes)',
    strength: 'Global logistics and trade hub route',
    desc: 'The UK provides special import/export custom multipliers, lowering trade tariffs and accelerating high-end retail supply lines.'
  },
  'Germany': {
    flag: '🇩🇪',
    code: 'DEU',
    tax: '15% (Moderate Taxes)',
    strength: 'Heavy machinery and industrial leads',
    desc: 'Germany features exceptional mechanical efficiency multipliers, reducing machine wear and output assembly time in heavy factories.'
  },
  'Japan': {
    flag: '🇯🇵',
    code: 'JPN',
    tax: '14% (Moderate Taxes)',
    strength: 'Advanced tech micro-processors',
    desc: 'Japan provides extensive government tech credits, lowering overhead for electronic assembly and retail parts distribution.'
  },
  'Brazil': {
    flag: '🇧🇷',
    code: 'BRA',
    tax: '10% (Low Taxes)',
    strength: 'Abundant raw materials and crop lands',
    desc: 'Brazil offers the lowest operational taxes and cheapest land acquisition costs, making primary sector farming and mining highly lucrative.'
  },
  'Australia': {
    flag: '🇦🇺',
    code: 'AUS',
    tax: '11% (Low Taxes)',
    strength: 'Incredible lithium and steel extraction',
    desc: 'Australia boasts massive lithium, iron, and gold reserve extraction coefficients, giving heavy mining corporations immense advantages.'
  }
};

const FINANCES = {
  'India': { symbol: '₹', amount: 1000000, formatted: '₹10,00,000' },
  'United States': { symbol: '$', amount: 120000, formatted: '$120,000' },
  'United Kingdom': { symbol: '£', amount: 80000, formatted: '£80,000' },
  'Germany': { symbol: '€', amount: 100000, formatted: '€100,000' },
  'Japan': { symbol: '¥', amount: 12000000, formatted: '¥12,000,000' },
  'Brazil': { symbol: 'R$', amount: 500000, formatted: 'R$500,000' },
  'Australia': { symbol: 'A$', amount: 150000, formatted: 'A$150,000' }
};

const INDUSTRIES = {
  'Primary Sector': ['Farming', 'Dairy', 'Mining'],
  'Factories': ['Garment Factory', 'Food Processing Factory', 'Construction Factory'],
  'Manufacturing': ['Automobile Manufacturing', 'Electronics Manufacturing'],
  'Retail': ['Clothing Store', 'Electronics Store', 'Restaurant', 'Car Showroom']
};

export default function StartupRegistration() {
  const { user, token, logout, updateUserStartupInfo } = useAuth();
  const navigate = useNavigate();

  // --- Form States ---
  const [startupName, setStartupName] = useState('');
  const [country, setCountry] = useState('India');
  const [industry, setIndustry] = useState('Primary Sector');
  const [businessType, setBusinessType] = useState('Farming');
  const [selectedLogoId, setSelectedLogoId] = useState('preset_1');
  const [uploadedLogo, setUploadedLogo] = useState('');
  
  // --- UI feedback states ---
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync business type when industry sector changes
  useEffect(() => {
    const availableTypes = INDUSTRIES[industry];
    if (availableTypes && availableTypes.length > 0) {
      setBusinessType(availableTypes[0]);
    }
  }, [industry]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Image uploader handler (Converts to Base64)
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 2MB limit. Please choose a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setUploadedLogo(uploadEvent.target.result);
      setSelectedLogoId('custom');
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  // Get SVG markup or uploaded Base64 string for preview
  const getActiveLogoMarkup = () => {
    if (selectedLogoId === 'custom' && uploadedLogo) {
      return `<img src="${uploadedLogo}" alt="Custom Logo" class="w-full h-full object-contain rounded" />`;
    }
    const preset = PRESET_LOGOS.find(l => l.id === selectedLogoId);
    return preset ? preset.svg : PRESET_LOGOS[0].svg;
  };

  const validateName = (name) => {
    if (!name.trim()) return 'Startup name is required.';
    if (name.trim().length < 3) return 'Startup name must be at least 3 characters.';
    if (name.trim().length > 30) return 'Startup name must be at most 30 characters.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Client validation
    const nameErr = validateName(startupName);
    if (nameErr) {
      setErrorMsg(nameErr);
      return;
    }

    setIsSubmitting(true);
    try {
      const activeLogo = selectedLogoId === 'custom' ? uploadedLogo : getActiveLogoMarkup();

      const startupPayload = {
        startupName: startupName.trim(),
        country,
        industry,
        businessType,
        logo: activeLogo
      };

      const response = await startupService.createStartup(startupPayload, token);

      if (response.success && response.startup) {
        setSuccessMsg('Conglomerate node initialized! Redirecting to grid...');
        // Update AuthContext user state
        updateUserStartupInfo(response.startup._id, country);
        
        setTimeout(() => {
          navigate('/app/dashboard');
        }, 1500);
      } else {
        throw new Error(response.message || 'Failed to register startup.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'System network error during startup configuration.');
      setIsSubmitting(false);
    }
  };

  const selectedFinances = FINANCES[country] || FINANCES['India'];
  const selectedDetails = COUNTRY_DETAILS[country] || COUNTRY_DETAILS['India'];

  return (
    <div className="bg-gameBg min-h-screen text-white relative overflow-hidden font-body px-4 py-8 md:py-12">
      {/* Background Grid Pattern Overlay */}
      <div className="grid-overlay"></div>
      <div className="glow-radial-overlay"></div>

      {/* Decorative ambient blurred nodes */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-cyanGlow/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blueGlow/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Navigation / Header Brand */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
          <Link to="/" className="h-8 hover:opacity-80 transition-opacity">
            <img src="/assets/logo.svg" alt="CapitalGrid Logo" className="h-full" />
          </Link>
          <div className="flex items-center gap-4">
            {user?.profilePicture && (
              <img src={user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full border border-cyanGlow/30 hidden sm:block" />
            )}
            <span className="text-xs text-text-secondary hidden md:inline">
              Authenticated: <strong className="text-white">{user?.fullName}</strong>
            </span>
            <button 
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-950/20 border border-red-500/30 hover:bg-red-900/40 text-red-400 text-xs font-display uppercase tracking-widest rounded transition-all"
            >
              Logout <i className="fa-solid fa-power-off ml-1"></i>
            </button>
          </div>
        </div>

        {/* Title HUD Banner */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold tracking-widest text-white uppercase mb-2">
            Build Your Company.
          </h1>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-widest text-cyanGlow uppercase mb-4">
            Shape The Economy.
          </h2>
          <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Every great empire begins with a single decision. Choose your nation, industry and identity.
          </p>
        </div>

        {/* Action Form Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Side */}
          <div className="lg:col-span-7 glass-card p-6 md:p-8 border border-white/5 shadow-2xl relative">
            {/* Scifi Scanner overlay decoration */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyanGlow/40 to-transparent"></div>
            
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyanGlow animate-ping"></span>
              Identity Setup Panel
            </h3>

            {/* Notifications */}
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-950/35 border border-red-500/30 rounded text-red-400 text-xs flex items-start gap-3 animate-shake">
                <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-6 p-4 bg-green-950/35 border border-green-500/30 rounded text-green-400 text-xs flex items-start gap-3">
                <i className="fa-solid fa-circle-check mt-0.5"></i>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              {/* Field 1: Startup Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-text-secondary flex justify-between">
                  <span>Startup Name</span>
                  <span className="text-[9px] text-text-muted">3-30 characters</span>
                </label>
                <input 
                  type="text" 
                  className="glass-input text-sm"
                  placeholder="e.g. AgroRise, UrbanThreads, Nova Motors"
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  disabled={isSubmitting}
                  maxLength={30}
                />
              </div>

              {/* Field 2: Country Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-display uppercase tracking-widest text-text-secondary">
                  Base Country Location
                </label>
                <select 
                  className="glass-input text-sm bg-gameBg cursor-pointer"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isSubmitting}
                >
                  {Object.keys(COUNTRY_DETAILS).map((cName) => (
                    <option key={cName} value={cName} className="bg-gameBg">
                      {COUNTRY_DETAILS[cName].flag} {cName}
                    </option>
                  ))}
                </select>
                
                {/* Dynamic Country HUD Card */}
                {country && selectedDetails && (
                  <div className="mt-3 p-4 bg-white/2 border border-white/5 rounded relative overflow-hidden transition-all duration-300">
                    <div className="absolute right-3 top-3 text-4xl opacity-10 pointer-events-none">
                      {selectedDetails.flag}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{selectedDetails.flag}</span>
                      <span className="font-display font-bold text-xs uppercase tracking-wider text-white">
                        {country} HUD Status
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs mt-3 pt-3 border-t border-white/5">
                      <div>
                        <span className="text-[9px] font-display uppercase text-text-muted block">Tax Rate</span>
                        <strong className="text-cyanGlow">{selectedDetails.tax}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] font-display uppercase text-text-muted block">Resource Strengths</span>
                        <strong className="text-blueGlow text-[10px] truncate block">{selectedDetails.strength}</strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-3 leading-relaxed border-t border-white/5 pt-2">
                      {selectedDetails.desc}
                    </p>
                  </div>
                )}
              </div>

              {/* Field 3 & 4: Industry & Business Type (Side by Side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-text-secondary">
                    Industry Category
                  </label>
                  <select 
                    className="glass-input text-sm bg-gameBg cursor-pointer"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {Object.keys(INDUSTRIES).map((indName) => (
                      <option key={indName} value={indName} className="bg-gameBg">
                        {indName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-display uppercase tracking-widest text-text-secondary">
                    Business Type (Sector Spec)
                  </label>
                  <select 
                    className="glass-input text-sm bg-gameBg cursor-pointer"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    disabled={isSubmitting}
                  >
                    {(INDUSTRIES[industry] || []).map((bType) => (
                      <option key={bType} value={bType} className="bg-gameBg">
                        {bType}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 5: Startup Logo Chooser */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-display uppercase tracking-widest text-text-secondary flex justify-between">
                  <span>Select Corporate Logo</span>
                  <span className="text-[9px] text-text-muted">Choose preset or upload custom</span>
                </label>
                
                {/* 6 Futuristic Preset Logos */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PRESET_LOGOS.map((logo) => (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => {
                        setSelectedLogoId(logo.id);
                        setUploadedLogo('');
                      }}
                      className={`p-3 bg-white/2 border rounded flex items-center justify-center h-16 hover:border-cyanGlow/40 hover:bg-white/4 transition-all relative group ${
                        selectedLogoId === logo.id ? 'border-cyanGlow bg-cyanGlow/5 shadow-cyan' : 'border-white/5'
                      }`}
                      title={logo.name}
                      disabled={isSubmitting}
                    >
                      <div className="w-10 h-10 flex items-center justify-center" dangerouslySetInnerHTML={{ __html: logo.svg }} />
                      <span className="absolute bottom-1 text-[8px] font-display text-text-muted group-hover:text-white transition-colors truncate max-w-full px-1">
                        {logo.name}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Upload Button */}
                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-white/2 border border-white/10 hover:border-cyanGlow/30 hover:bg-white/4 text-xs rounded cursor-pointer transition-all disabled:opacity-50">
                    <i className="fa-solid fa-cloud-arrow-up text-cyanGlow"></i>
                    <span>Upload Custom Image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleLogoUpload}
                      disabled={isSubmitting}
                    />
                  </label>
                  {uploadedLogo && selectedLogoId === 'custom' && (
                    <span className="text-xs text-greenGlow flex items-center gap-1.5">
                      <i className="fa-solid fa-check-double animate-pulse"></i> Custom Image Locked
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn btn-primary w-full py-4 mt-2 shadow-cyan relative"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-notch animate-spin"></i> Initializing Conglomerate Assets...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-circle-check"></i> Initialize Startup Conglomerate
                  </span>
                )}
              </button>

            </form>
          </div>

          {/* Preview Card Side */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 flex flex-col gap-6">
            
            <div className="glass-card p-6 border border-white/5 relative overflow-hidden bg-gradient-to-b from-glassBg to-black/80">
              {/* Corner tech lines decoration */}
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyanGlow/30 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyanGlow/30 pointer-events-none"></div>
              
              <div className="badge neon-text-blue mb-6">
                <i className="fa-solid fa-display"></i> Live HUD Card Preview
              </div>

              <div className="flex flex-col items-center text-center my-6">
                {/* Logo Frame */}
                <div className="w-24 h-24 p-4 rounded-xl bg-white/2 border border-white/10 flex items-center justify-center shadow-lg relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyanGlow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div 
                    className="w-full h-full flex items-center justify-center relative z-10" 
                    dangerouslySetInnerHTML={{ __html: getActiveLogoMarkup() }} 
                  />
                </div>

                {/* Company Name */}
                <h3 className="font-display text-xl font-black mt-6 tracking-widest text-white uppercase break-all px-2">
                  {startupName.trim() || 'UNREGISTERED ENTITY'}
                </h3>
                
                {/* ID Badge Tag placeholder */}
                <span className="text-[10px] font-display text-cyanGlow uppercase tracking-widest mt-1 bg-cyanGlow/5 border border-cyanGlow/25 px-2 py-0.5 rounded">
                  CG-{selectedDetails.code}-######
                </span>
              </div>

              {/* Company Meta Grid */}
              <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-white/5 text-sm">
                
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-text-secondary font-display uppercase tracking-wider">Base Nation</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span>{selectedDetails.flag}</span>
                    <span>{country}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-text-secondary font-display uppercase tracking-wider">Industry Sector</span>
                  <span className="font-bold text-white uppercase tracking-wider text-xs">
                    {industry}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-text-secondary font-display uppercase tracking-wider">Business Activity</span>
                  <span className="font-bold text-cyanGlow text-xs uppercase tracking-widest">
                    {businessType}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-t border-white/5 mt-2 pt-3">
                  <span className="text-xs text-text-secondary font-display uppercase tracking-wider">Starting Capital</span>
                  <span className="font-display font-black text-lg text-greenGlow">
                    {selectedFinances.formatted}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-text-secondary font-display uppercase tracking-wider">Entity Status</span>
                  <span className="text-[10px] font-display uppercase tracking-widest px-2 py-0.5 bg-green-950/30 text-greenGlow border border-green-500/20 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-greenGlow animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>

              </div>
            </div>

            {/* Information Lore Box */}
            <div className="p-4 bg-white/2 border border-white/5 rounded text-xs leading-relaxed text-text-secondary">
              <i className="fa-solid fa-circle-info text-cyanGlow mr-1"></i>{' '}
              <strong>Attention Founder:</strong> Verify all choices before locking in. Operating sectors determine starting resource nodes, and tax regions are non-transferable under Step 3 compliance protocols.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
