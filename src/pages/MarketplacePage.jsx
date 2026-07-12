import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import * as startupService from '../services/startupService';
import * as marketplaceService from '../services/marketplaceService';
import PRODUCTS from '../data/products';

const CURRENCY_SYMBOLS = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'Germany': '€',
  'Japan': '¥',
  'Brazil': 'R$',
  'Australia': 'A$'
};

const renderFlagImage = (countryName) => {
  if (!countryName) return null;
  const normalized = countryName.toLowerCase().trim();
  const codes = {
    'india': 'in', 'in': 'in', 'ind': 'in',
    'united states': 'us', 'us': 'us', 'usa': 'us',
    'united kingdom': 'gb', 'uk': 'gb', 'gb': 'gb', 'gbr': 'gb',
    'germany': 'de', 'de': 'de', 'deu': 'de',
    'japan': 'jp', 'jp': 'jp', 'jpn': 'jp',
    'brazil': 'br', 'br': 'br', 'bra': 'br',
    'australia': 'au', 'au': 'au', 'aus': 'au'
  };
  const code = codes[normalized];
  if (!code) return <span className="text-sm shrink-0">🌐</span>;
  return (
    <img 
      src={`https://flagcdn.com/w40/${code}.png`} 
      alt={countryName} 
      className="w-4 h-2.5 object-cover rounded-sm border border-white/10 shrink-0" 
      title={countryName}
    />
  );
};

export default function MarketplacePage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [startup, setStartup] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [buyingId, setBuyingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // NCR Tab & Trade State
  const [activeTab, setActiveTab] = useState('exchange');
  const [ncrCatalog, setNcrCatalog] = useState([]);
  const [selectedNcrCategory, setSelectedNcrCategory] = useState('All');
  const [ncrTradeModal, setNcrTradeModal] = useState({
    show: false,
    mode: 'buy',
    product: null,
    quantity: 1
  });

  // Listing Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [listQuantity, setListQuantity] = useState('');
  const [listPricePerUnit, setListPricePerUnit] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Helper: Find product details
  const getProductDetails = (productId) => {
    const OVERRIDES = {
      water: { name: 'Water', icon: 'fa-solid fa-droplet text-blue-400' },
      cows: { name: 'Cows', icon: 'fa-solid fa-cow text-blue-400' },
      hens: { name: 'Hens', icon: 'fa-solid fa-dove text-blue-400' },
      energy: { name: 'Energy', icon: 'fa-solid fa-bolt text-blue-400' },
      clay: { name: 'Clay', icon: 'fa-solid fa-shapes text-blue-400' }
    };
    if (OVERRIDES[productId]) return OVERRIDES[productId];

    for (const category in PRODUCTS) {
      const prod = PRODUCTS[category].find(p => p.id === productId);
      if (prod) return prod;
    }
    return { name: productId, icon: 'fa-solid fa-box' };
  };

  const getProductIcon = (productId) => {
    return getProductDetails(productId).icon;
  };

  const formatCurrency = (amount, countryName) => {
    const symbol = CURRENCY_SYMBOLS[countryName] || '$';
    return `${symbol}${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  // Fetch Page Data
  const fetchData = async () => {
    try {
      if (!token) return;
      setErrorMsg('');
      
      const startupRes = await startupService.getMyStartup(token);
      if (startupRes.success && startupRes.startup) {
        setStartup(startupRes.startup);
      } else {
        setErrorMsg('Failed to load corporate profile.');
      }

      const listingsRes = await marketplaceService.getListings(token);
      if (listingsRes.success && listingsRes.listings) {
        setListings(listingsRes.listings);
      } else {
        setErrorMsg('Failed to load marketplace listings.');
      }

      const ncrCatalogRes = await marketplaceService.getNcrCatalog(token);
      if (ncrCatalogRes.success && ncrCatalogRes.catalog) {
        setNcrCatalog(ncrCatalogRes.catalog);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error loading marketplace nodes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle NCR trade transaction
  const handleNcrTrade = async (e) => {
    e.preventDefault();
    if (!ncrTradeModal.product) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const finalQty = parseInt(ncrTradeModal.quantity, 10) || 1;

    try {
      let response;
      if (ncrTradeModal.mode === 'buy') {
        response = await marketplaceService.buyFromNcr({
          productId: ncrTradeModal.product.productId,
          quantity: finalQty
        }, token);
      } else {
        response = await marketplaceService.sellToNcr({
          productId: ncrTradeModal.product.productId,
          quantity: finalQty
        }, token);
      }

      if (response.success) {
        setSuccessMsg(response.message || 'NCR trade contract signed successfully.');
        setNcrTradeModal({ show: false, mode: 'buy', product: null, quantity: 1 });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'NCR transaction rejected by treasury.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Form Submission (Listing item)
  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !listQuantity || !listPricePerUnit) {
      setErrorMsg('All listing fields are required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await marketplaceService.createListing({
        productId: selectedProductId,
        quantity: parseInt(listQuantity, 10),
        pricePerUnit: parseFloat(listPricePerUnit)
      }, token);

      if (response.success) {
        setSuccessMsg(response.message);
        // Reset form
        setSelectedProductId('');
        setListQuantity('');
        setListPricePerUnit('');
        // Refresh local startup data & listings
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to list asset.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Listing Purchase
  const handleBuyListing = async (listingId) => {
    setBuyingId(listingId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await marketplaceService.buyListing(listingId, token);
      if (response.success) {
        setSuccessMsg(response.message);
        // Refresh local data
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to purchase asset.');
    } finally {
      setBuyingId(null);
    }
  };

  // Filter startup's inventory items with quantity > 0
  const listableItems = startup?.inventory?.filter(item => item.quantity > 0) || [];

  // Update quantity validation based on selected product
  const selectedInventoryItem = listableItems.find(item => item.productId === selectedProductId);
  const maxAvailable = selectedInventoryItem ? selectedInventoryItem.quantity : 0;

  if (loading) {
    return (
      <div className="bg-gameBg min-h-screen text-white flex items-center justify-center relative font-body">
        <div className="grid-overlay"></div>
        <div className="glow-radial-overlay"></div>
        <div className="glass-card max-w-sm w-full p-8 text-center border border-cyanGlow/20 relative z-10">
          <div className="w-16 h-16 border-4 border-t-cyanGlow border-r-cyanGlow/40 border-b-cyanGlow/10 border-l-cyanGlow/20 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="font-display text-sm tracking-widest text-cyanGlow uppercase animate-pulse">
            Accessing Exchange Ledger
          </h3>
          <p className="text-xs text-text-secondary mt-2">
            Loading real-time market data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gameBg min-h-screen text-white relative overflow-hidden font-body px-4 py-8 md:py-12">
      {/* Background Overlays */}
      <div className="grid-overlay"></div>
      <div className="glow-radial-overlay"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Navigation / Header Brand */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
          <Link to="/app/dashboard" className="h-8 hover:opacity-80 transition-opacity w-36 block">
            <Logo className="h-full w-full" />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link 
              to="/app/dashboard" 
              className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-display uppercase tracking-widest rounded transition-all"
            >
              <i className="fa-solid fa-arrow-left mr-1.5"></i> Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-950/20 border border-red-500/30 hover:bg-red-900/40 text-red-400 text-xs font-display uppercase tracking-widest rounded transition-all"
            >
              Logout <i className="fa-solid fa-power-off ml-1"></i>
            </button>
          </div>
        </div>

        {/* HUD Notification Area */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/35 border border-red-500/30 rounded text-red-400 text-xs flex items-center gap-3">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-950/35 border border-green-500/30 rounded text-green-450 text-xs flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-greenGlow"></i>
            <span className="text-greenGlow">{successMsg}</span>
          </div>
        )}

        {startup && (
          <>
            {/* User Startup Status Banner */}
            <div className="glass-card p-6 border border-cyanGlow/20 bg-gradient-to-b from-glassBg to-cyanGlow/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-cyanGlow/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="font-display text-lg font-black uppercase tracking-wider text-white">
                    {startup.startupName}
                  </h2>
                  <span className="text-[10px] font-display text-cyanGlow uppercase tracking-widest px-2 py-0.5 bg-cyanGlow/10 border border-cyanGlow/20 rounded">
                    Buyer Node
                  </span>
                </div>
                <p className="text-xs text-text-secondary flex items-center gap-1.5">
                  {renderFlagImage(startup.country)}
                  <span>HQ: {startup.country}</span>
                  <span className="text-text-muted">|</span>
                  <span className="font-mono text-cyanGlow">{startup.startupId}</span>
                </p>
              </div>

              <div className="text-left md:text-right border-t md:border-t-0 border-white/5 pt-4 md:pt-0 w-full md:w-auto">
                <span className="text-[10px] font-display uppercase tracking-widest text-text-muted block mb-1">Available Funds</span>
                <h3 className="font-display font-black text-2xl text-greenGlow tracking-wide">
                  {formatCurrency(startup.currentBalance, startup.country)}
                </h3>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mb-6 border-b border-white/5 pb-3 font-display">
              <button
                onClick={() => {
                  setActiveTab('exchange');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`px-4 py-2 text-xs uppercase tracking-widest font-extrabold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'exchange'
                    ? 'border-cyanGlow text-cyanGlow'
                    : 'border-transparent text-text-secondary hover:text-white'
                }`}
              >
                Player Exchange
              </button>
              <button
                onClick={() => {
                  setActiveTab('ncr');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`px-4 py-2 text-xs uppercase tracking-widest font-extrabold transition-all border-b-2 cursor-pointer ${
                  activeTab === 'ncr'
                    ? 'border-cyanGlow text-cyanGlow'
                    : 'border-transparent text-text-secondary hover:text-white'
                }`}
              >
                National Commodity Reserve (NCR)
              </button>
            </div>

            {/* Layout Grid */}
            {activeTab === 'exchange' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Create Listing Form */}
                <div className="lg:col-span-1">
                  <div className="glass-card p-6 border border-white/5 relative bg-black/40">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyanGlow/30 to-transparent"></div>
                    
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
                      <i className="fa-solid fa-square-plus text-cyanGlow"></i>
                      Create Listing
                    </h3>

                    {listableItems.length === 0 ? (
                      <div className="text-center py-8 bg-white/2 border border-white/5 rounded">
                        <i className="fa-solid fa-boxes-stacked text-3xl text-text-muted/40 mb-3"></i>
                        <p className="text-xs text-text-secondary px-4">
                          No inventory available to list. You must produce items first.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleCreateListing} className="space-y-4">
                        
                        {/* Product Field */}
                        <div>
                          <label htmlFor="product" className="block text-[10px] font-display uppercase tracking-wider text-text-secondary mb-1.5">
                            Product
                          </label>
                          <select
                            id="product"
                            value={selectedProductId}
                            onChange={(e) => {
                              setSelectedProductId(e.target.value);
                              setListQuantity('');
                            }}
                            required
                            className="w-full glass-input bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-cyanGlow/40 focus:outline-none"
                          >
                            <option value="">-- Choose Product --</option>
                            {listableItems.map(item => (
                              <option key={item.productId} value={item.productId}>
                                {item.productName} (Available: {item.quantity})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Market Price Comparison Card */}
                        {selectedProductId && (() => {
                          const ncrProductPrice = ncrCatalog.find(i => i.productId === selectedProductId);
                          const cheapestPlayerListing = listings
                            .filter(l => l.productId === selectedProductId && l.status === 'Active' && String(l.seller) !== String(startup?._id))
                            .sort((a, b) => a.pricePerUnit - b.pricePerUnit)[0];

                          return (
                            <div className="p-3 bg-white/5 border border-white/10 rounded mb-4 text-xs font-mono">
                              <span className="text-text-muted text-[10px] font-display uppercase tracking-widest block mb-2 font-sans">Market Price Comparison</span>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <span className="text-[9px] text-text-secondary block">Player Exchange (Cheapest)</span>
                                  <span className="text-greenGlow font-bold">
                                    {cheapestPlayerListing ? formatCurrency(cheapestPlayerListing.pricePerUnit, startup.country) : 'None available'}
                                  </span>
                                  <span className="text-[8px] text-text-muted block">({cheapestPlayerListing ? `${cheapestPlayerListing.quantity} units` : '0 units'})</span>
                                </div>
                                <div>
                                  <span className="text-[9px] text-text-secondary block">Govt Reserve Price</span>
                                  <span className="text-amber-400 font-bold">
                                    {ncrProductPrice ? formatCurrency(ncrProductPrice.ncrSellPrice, startup.country) : 'N/A'}
                                  </span>
                                  <span className="text-[8px] text-text-muted block">(Unlimited inventory)</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Quantity Field */}
                        <div>
                          <label htmlFor="quantity" className="block text-[10px] font-display uppercase tracking-wider text-text-secondary mb-1.5">
                            Quantity {maxAvailable > 0 && <span className="text-cyanGlow text-[9px] font-mono">(Max: {maxAvailable})</span>}
                          </label>
                          <input
                            id="quantity"
                            type="number"
                            min="1"
                            max={maxAvailable || undefined}
                            value={listQuantity}
                            onChange={(e) => setListQuantity(e.target.value)}
                            placeholder="e.g. 10"
                            required
                            className="w-full glass-input bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-cyanGlow/40 focus:outline-none"
                          />
                        </div>

                        {/* Price Per Unit Field */}
                        <div>
                          <label htmlFor="pricePerUnit" className="block text-[10px] font-display uppercase tracking-wider text-text-secondary mb-1.5">
                            Price per Unit ({CURRENCY_SYMBOLS[startup.country] || '$'})
                          </label>
                          <input
                            id="pricePerUnit"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={listPricePerUnit}
                            onChange={(e) => setListPricePerUnit(e.target.value)}
                            placeholder="Price per unit"
                            required
                            className="w-full glass-input bg-black/60 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-cyanGlow/40 focus:outline-none"
                          />
                        </div>

                        {/* Total Listing Cost Display */}
                        {listQuantity && listPricePerUnit && (
                          <div className="p-3 bg-white/2 border border-white/5 rounded text-xs font-mono">
                            <span className="text-text-muted text-[10px] font-display uppercase tracking-widest block mb-1 font-sans">Total Valuation</span>
                            <span className="font-display font-black text-cyanGlow text-sm">
                              {formatCurrency(parseFloat(listQuantity) * parseFloat(listPricePerUnit), startup.country)}
                            </span>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-2.5 bg-gradient-to-r from-cyanGlow/10 to-blueGlow/10 border border-cyanGlow/25 hover:border-cyanGlow/50 hover:from-cyanGlow/20 hover:to-blueGlow/20 text-cyanGlow font-display text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {submitting ? (
                            <>
                              <i className="fa-solid fa-spinner animate-spin"></i>
                              Listing...
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-tags"></i>
                              Publish Listing
                            </>
                          )}
                        </button>

                      </form>
                    )}
                  </div>
                </div>

                {/* Right Column: Active Listings */}
                <div className="lg:col-span-2">
                  <div className="glass-card p-6 border border-white/5 bg-black/40 h-full flex flex-col">
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-greenGlow animate-pulse"></span>
                      <i className="fa-solid fa-store text-cyanGlow"></i>
                      Global Assets Exchange
                    </h3>

                    {listings.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                        <i className="fa-solid fa-store-slash text-4xl text-text-muted/30 mb-4"></i>
                        <p className="text-sm text-text-secondary font-display uppercase tracking-wider">
                          Exchange is currently empty
                        </p>
                        <p className="text-xs text-text-muted mt-1 max-w-sm">
                          No products listed for sale at this cycle. Publish listings to kickstart the global economy.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-text-muted font-display uppercase tracking-widest">
                              <th className="pb-3 font-semibold">Seller Node</th>
                              <th className="pb-3 font-semibold">Asset Type</th>
                              <th className="pb-3 font-semibold text-right">Quantity</th>
                              <th className="pb-3 font-semibold text-right">Unit Price</th>
                              <th className="pb-3 font-semibold text-right">Total Price</th>
                              <th className="pb-3 font-semibold text-right">Time</th>
                              <th className="pb-3 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {listings.map((listing) => {
                              const isOwnListing = String(listing.seller) === String(startup._id);
                              const formattedUnit = formatCurrency(listing.pricePerUnit, listing.sellerCountry);
                              const formattedTotal = formatCurrency(listing.totalPrice, listing.sellerCountry);

                              return (
                                <tr key={listing._id} className="hover:bg-white/2 transition-colors">
                                  <td className="py-4 pr-3">
                                    <div className="font-bold text-white max-w-[120px] truncate" title={listing.sellerStartupName}>
                                      {listing.sellerStartupName}
                                    </div>
                                      <div className="text-[10px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                                        {renderFlagImage(listing.sellerCountry)}
                                        <span>{listing.sellerCountry}</span>
                                      </div>
                                  </td>
                                  <td className="py-4 pr-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center text-cyanGlow">
                                        <i className={getProductIcon(listing.productId)}></i>
                                      </div>
                                      <span className="font-medium text-white">{listing.productName}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 text-right font-mono text-white font-semibold">
                                    {listing.quantity}
                                  </td>
                                  <td className="py-4 text-right font-mono text-cyanGlow font-medium">
                                    {formattedUnit}
                                  </td>
                                  <td className="py-4 text-right font-mono text-greenGlow font-bold">
                                    {formattedTotal}
                                  </td>
                                  <td className="py-4 text-right text-[10px] text-text-muted">
                                    {getRelativeTime(listing.createdAt)}
                                  </td>
                                  <td className="py-4 text-right pl-3">
                                    {isOwnListing ? (
                                      <span className="inline-block text-[9px] font-display uppercase tracking-widest px-2.5 py-1 bg-white/5 border border-white/10 text-text-muted rounded-full cursor-default">
                                        Your Listing
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleBuyListing(listing._id)}
                                        disabled={buyingId !== null || startup.currentBalance < listing.totalPrice}
                                        className={`px-3 py-1.5 rounded font-display text-[9px] uppercase tracking-widest font-bold transition-all border cursor-pointer ${
                                          startup.currentBalance < listing.totalPrice
                                            ? 'bg-red-950/20 border-red-500/20 text-red-500/50 cursor-not-allowed'
                                            : 'bg-greenGlow/10 hover:bg-greenGlow/25 border-greenGlow/30 hover:border-greenGlow/60 text-greenGlow'
                                        }`}
                                      >
                                        {buyingId === listing._id ? (
                                          <i className="fa-solid fa-spinner animate-spin text-[8px]"></i>
                                        ) : startup.currentBalance < listing.totalPrice ? (
                                          'No Funds'
                                        ) : (
                                          'Buy'
                                        )}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Category Filters */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="glass-card p-6 border border-white/5 bg-black/40">
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
                      <i className="fa-solid fa-filter text-cyanGlow"></i>
                      Category Filter
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {['All', 'Agriculture', 'Mining', 'Construction', 'Manufacturing', 'Food', 'Electronics', 'Utilities'].map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedNcrCategory(cat)}
                          className={`w-full text-left px-3 py-2 rounded text-xs font-mono transition-all cursor-pointer ${
                            selectedNcrCategory === cat
                              ? 'bg-cyanGlow/10 text-cyanGlow border-l-2 border-cyanGlow font-bold pl-2.5'
                              : 'text-text-secondary hover:bg-white/2 hover:text-white pl-2.5'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-6 border border-white/5 bg-black/40 text-xs">
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                      <i className="fa-solid fa-circle-info text-cyanGlow"></i>
                      Reserve Liquidity
                    </h3>
                    <p className="text-text-secondary leading-relaxed mb-3 font-sans">
                      The National Commodity Reserve guarantees liquidity by maintaining unlimited inventory blocks at premium spreads.
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5 text-text-secondary font-mono text-[11px]">
                      <li>Govt Sell: High cap offer</li>
                      <li>Govt Buy: Liquidation floor</li>
                      <li>Inventory: Unlimited</li>
                    </ul>
                  </div>
                </div>

                {/* Right Column: NCR Table Ledger (lg:col-span-2) */}
                <div className="lg:col-span-2">
                  <div className="glass-card p-6 border border-white/5 bg-black/40">
                    <h3 className="font-display text-xs font-bold uppercase tracking-wider text-text-secondary mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <i className="fa-solid fa-building-shield text-cyanGlow"></i>
                      Government Liquidity Ledger
                    </h3>

                    {ncrCatalog.length === 0 ? (
                      <div className="text-center py-12 text-text-muted">
                        No products available in government reserves.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-white/10 text-text-muted font-display uppercase tracking-widest">
                              <th className="pb-3 font-semibold">Commodity</th>
                              <th className="pb-3 font-semibold">Category</th>
                              <th className="pb-3 font-semibold text-right">Govt Buy</th>
                              <th className="pb-3 font-semibold text-right">Govt Sell</th>
                              <th className="pb-3 font-semibold text-right">Availability</th>
                              <th className="pb-3 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {ncrCatalog
                              .filter(item => selectedNcrCategory === 'All' || item.category === selectedNcrCategory)
                              .map(item => (
                                <tr key={item.productId} className="hover:bg-white/2 transition-colors">
                                  <td className="py-4 pr-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center text-cyanGlow">
                                        <i className={getProductIcon(item.productId)}></i>
                                      </div>
                                      <span className="font-bold text-white">{item.productName}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 text-text-secondary font-mono">{item.category}</td>
                                  <td className="py-4 text-right font-mono text-cyanGlow font-medium">
                                    {formatCurrency(item.ncrBuyPrice, startup.country)}
                                  </td>
                                  <td className="py-4 text-right font-mono text-greenGlow font-bold">
                                    {formatCurrency(item.ncrSellPrice, startup.country)}
                                  </td>
                                  <td className="py-4 text-right font-mono text-text-secondary">
                                    Unlimited
                                  </td>
                                  <td className="py-4 text-right pl-3">
                                    <div className="flex justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setNcrTradeModal({
                                            show: true,
                                            mode: 'sell',
                                            product: item,
                                            quantity: 1
                                          });
                                        }}
                                        className="px-2.5 py-1.5 rounded bg-red-950/20 hover:bg-red-900/40 border border-red-500/30 text-red-400 font-display text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer font-sans"
                                      >
                                        Sell
                                      </button>
                                      <button
                                        onClick={() => {
                                          setNcrTradeModal({
                                            show: true,
                                            mode: 'buy',
                                            product: item,
                                            quantity: 1
                                          });
                                        }}
                                        className="px-2.5 py-1.5 rounded bg-greenGlow/10 hover:bg-greenGlow/25 border border-greenGlow/30 hover:border-greenGlow/60 text-greenGlow font-display text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer font-sans"
                                      >
                                        Buy
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </>
        )}

        {/* NCR Trade Confirmation Modal */}
        {ncrTradeModal.show && ncrTradeModal.product && (() => {
          const prod = ncrTradeModal.product;
          const mode = ncrTradeModal.mode;
          const unitPrice = mode === 'buy' ? prod.ncrSellPrice : prod.ncrBuyPrice;
          const totalVal = unitPrice * ncrTradeModal.quantity;
          const availableStock = startup.inventory?.find(i => i.productId === prod.productId)?.quantity || 0;
          const hasSufficientStock = mode === 'sell' ? availableStock >= ncrTradeModal.quantity : true;
          const hasSufficientFunds = mode === 'buy' ? startup.currentBalance >= totalVal : true;

          return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="glass-card max-w-sm w-full p-6 border border-cyanGlow/20 bg-gradient-to-b from-glassBg to-black/95 relative overflow-hidden font-mono text-xs text-white">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-cyanGlow"></div>
                
                <h3 className="font-display font-extrabold text-xs uppercase tracking-wider text-cyanGlow mb-4 font-sans">
                  Confirm NCR Trade Contract
                </h3>

                <div className="p-3 bg-white/2 border border-white/5 rounded-lg flex items-center gap-3 mb-4 font-sans">
                  <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-cyanGlow">
                    <i className={getProductIcon(prod.productId)}></i>
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-xs uppercase text-white">{prod.productName}</h4>
                    <p className="text-[10px] text-text-secondary mt-0.5">NCR Treasury Direct Trade</p>
                  </div>
                </div>

                <form onSubmit={handleNcrTrade} className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-text-secondary">Trade Mode</span>
                    <span className={`font-bold ${mode === 'buy' ? 'text-greenGlow' : 'text-red-400'}`}>
                      {mode === 'buy' ? 'Buying from NCR' : 'Selling to NCR'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-text-secondary">Government Price</span>
                    <span className="font-bold">{formatCurrency(unitPrice, startup.country)} / unit</span>
                  </div>

                  {mode === 'sell' && (
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-text-secondary">Warehouse Stock</span>
                      <span className="font-bold">{availableStock} units available</span>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1 font-sans">
                      <label htmlFor="ncr-qty" className="block text-[10px] text-text-secondary uppercase">Quantity</label>
                      {(() => {
                        const maxQty = mode === 'sell' ? availableStock : Math.floor(startup.currentBalance / unitPrice);
                        return maxQty > 0 && (
                          <span className="text-[9px] text-text-muted font-mono">Limit: {maxQty}</span>
                        );
                      })()}
                    </div>
                    {(() => {
                      const maxQty = mode === 'sell' ? availableStock : Math.floor(startup.currentBalance / unitPrice);
                      const displayMaxQty = Math.max(1, maxQty);
                      const showMaxButton = mode === 'sell';

                      return (
                        <div className="flex items-center bg-black/60 border border-white/10 rounded px-3 py-1.5">
                          <button
                            type="button"
                            onClick={() => setNcrTradeModal(prev => ({ ...prev, quantity: Math.max(1, Math.min(displayMaxQty, (parseInt(prev.quantity, 10) || 1) - 1)) }))}
                            className="w-5 h-5 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 text-white text-[10px] rounded cursor-pointer mr-2"
                          >
                            -
                          </button>
                          <input
                            id="ncr-qty"
                            type="number"
                            min="1"
                            max={displayMaxQty}
                            value={ncrTradeModal.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setNcrTradeModal(prev => ({ ...prev, quantity: '' }));
                              } else {
                                const parsed = parseInt(val, 10);
                                if (!isNaN(parsed)) {
                                  setNcrTradeModal(prev => ({ ...prev, quantity: Math.max(1, Math.min(displayMaxQty, parsed)) }));
                                }
                              }
                            }}
                            onBlur={() => {
                              if (ncrTradeModal.quantity === '' || ncrTradeModal.quantity < 1) {
                                setNcrTradeModal(prev => ({ ...prev, quantity: 1 }));
                              }
                            }}
                            className="w-full bg-transparent border-none focus:outline-none text-center text-white font-mono"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setNcrTradeModal(prev => ({ ...prev, quantity: Math.min(displayMaxQty, (parseInt(prev.quantity, 10) || 1) + 1) }))}
                            className="w-5 h-5 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 text-white text-[10px] rounded cursor-pointer ml-2"
                          >
                            +
                          </button>
                          {showMaxButton && (
                            <button
                              type="button"
                              onClick={() => setNcrTradeModal(prev => ({ ...prev, quantity: displayMaxQty }))}
                              className="px-2 py-0.5 border border-cyanGlow/30 bg-cyan-950/20 hover:bg-cyanGlow/25 text-cyanGlow text-[9px] rounded font-display uppercase tracking-wider cursor-pointer ml-2 shrink-0 font-sans"
                              title="Set to maximum possible quantity"
                            >
                              Max
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-3 bg-black/35 rounded border border-white/5">
                    <div className="flex justify-between items-center">
                      <span>{mode === 'buy' ? 'Total Cost' : 'Estimated Revenue'}</span>
                      <span className={`font-bold text-sm ${mode === 'buy' ? 'text-red-400' : 'text-greenGlow'}`}>
                        {formatCurrency(totalVal, startup.country)}
                      </span>
                    </div>
                  </div>

                  {mode === 'buy' && !hasSufficientFunds && (
                    <p className="text-red-400 text-[10px] animate-pulse">
                      * Insufficient funds. Contract cannot be finalized.
                    </p>
                  )}

                  {mode === 'sell' && !hasSufficientStock && (
                    <p className="text-red-400 text-[10px] animate-pulse">
                      * Insufficient stock. Contract cannot be finalized.
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setNcrTradeModal({ show: false, mode: 'buy', product: null, quantity: 1 })}
                      className="flex-1 py-2 border border-white/10 bg-white/5 hover:bg-white/10 rounded font-display text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || (mode === 'buy' && !hasSufficientFunds) || (mode === 'sell' && !hasSufficientStock)}
                      className={`flex-1 py-2 rounded font-display text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer border ${
                        mode === 'buy'
                          ? 'bg-greenGlow/10 hover:bg-greenGlow/25 border-greenGlow/30 hover:border-greenGlow/60 text-greenGlow'
                          : 'bg-red-950/20 hover:bg-red-900/40 border border-red-500/30 text-red-400'
                      } disabled:opacity-30 disabled:cursor-not-allowed font-sans`}
                    >
                      {submitting ? 'Finalizing...' : 'Finalize Contract'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
