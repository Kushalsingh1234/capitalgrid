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

            {/* Layout Grid */}
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
                        <div className="p-3 bg-white/2 border border-white/5 rounded text-xs">
                          <span className="text-text-muted text-[10px] font-display uppercase tracking-widest block mb-1">Total Valuation</span>
                          <span className="font-display font-black text-cyanGlow text-sm">
                            {formatCurrency(parseFloat(listQuantity) * parseFloat(listPricePerUnit), startup.country)}
                          </span>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-2.5 bg-gradient-to-r from-cyanGlow/10 to-blueGlow/10 border border-cyanGlow/25 hover:border-cyanGlow/50 hover:from-cyanGlow/20 hover:to-blueGlow/20 text-cyanGlow font-display text-[10px] font-bold uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
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
                                      className={`px-3 py-1.5 rounded font-display text-[9px] uppercase tracking-widest font-bold transition-all border ${
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
          </>
        )}

      </div>
    </div>
  );
}
