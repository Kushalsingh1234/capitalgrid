import React, { useState, useEffect } from 'react';
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

const formatCurrency = (amount, countryName) => {
  const symbol = CURRENCY_SYMBOLS[countryName] || '$';
  return `${symbol}${amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Map categories to groups for left-sidebar filters
const CATEGORY_MAP = {
  'Farming': 'Agriculture',
  'Dairy': 'Agriculture',
  'Mining': 'Raw Materials',
  'Garment Factory': 'Consumer Goods',
  'Food Processing Factory': 'Food & Consumer Goods',
  'Construction Factory': 'Construction',
  'Automobile Manufacturing': 'Industrial Goods',
  'Electronics Manufacturing': 'Electronics'
};

const CATEGORIES = [
  'All Categories',
  'Raw Materials',
  'Agriculture',
  'Consumer Goods',
  'Food & Consumer Goods',
  'Construction',
  'Electronics',
  'Industrial Goods'
];

// Flatten product lists with helper category metadata
const FLAT_PRODUCTS = [];
for (const sector in PRODUCTS) {
  PRODUCTS[sector].forEach(p => {
    FLAT_PRODUCTS.push({
      ...p,
      categoryGroup: CATEGORY_MAP[sector] || 'Consumer Goods',
      basePrice: sector === 'Mining' ? 120 : sector === 'Farming' ? 80 : sector === 'Dairy' ? 100 : 1500
    });
  });
}

export default function MarketplaceInterface({
  startup,
  inventory = [],
  transactions = [],
  onMarketAction,
  token
}) {
  // UI State
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(FLAT_PRODUCTS[0]?.id || '');
  const [tradeMode, setTradeMode] = useState('buy'); // 'buy' or 'sell'
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name'); // 'name', 'quantity', 'price'
  const [sortAsc, setSortAsc] = useState(true);
  const [trends, setTrends] = useState({});
  const [activeTab, setActiveTab] = useState('exchange');
  const [ncrCatalog, setNcrCatalog] = useState([]);

  // Input forms state
  const [tradeQuantity, setTradeQuantity] = useState(1);
  const [sellPricePerUnit, setSellPricePerUnit] = useState(100);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch active marketplace listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await marketplaceService.getListings(token);
      if (res.success && res.listings) {
        setListings(res.listings);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load real-time marketplace listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();

    const fetchNcrCatalog = async () => {
      try {
        const res = await marketplaceService.getNcrCatalog(token);
        if (res.success && res.catalog) {
          setNcrCatalog(res.catalog);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchNcrCatalog();
    
    // Generate static stable trend arrows
    const stableTrends = {};
    FLAT_PRODUCTS.forEach(p => {
      const charSum = p.id.charCodeAt(0) + p.id.charCodeAt(p.id.length - 1);
      const shift = ((charSum % 140) / 10 - 7).toFixed(1);
      stableTrends[p.id] = {
        percent: shift,
        isUp: parseFloat(shift) >= 0
      };
    });
    setTrends(stableTrends);
  }, [token]);

  // Handle Buy
  const handleBuy = async (productId, qty) => {
    if (!token) return;
    setErrorMessage('');
    setSuccessMessage('');
    setActionInProgress(true);

    if (activeTab === 'ncr') {
      const ncrItem = ncrCatalog.find(i => i.productId === productId);
      if (!ncrItem) {
        setErrorMessage('Product not found in reserve catalog.');
        setActionInProgress(false);
        return;
      }
      const totalCost = ncrItem.ncrSellPrice * qty;
      if (startup.currentBalance < totalCost) {
        setErrorMessage('Insufficient corporate liquidity reserves to process trade.');
        setActionInProgress(false);
        return;
      }
      try {
        const res = await marketplaceService.buyFromNcr({ productId, quantity: qty }, token);
        if (res.success) {
          setSuccessMessage(`Purchase complete: Bought ${qty} units of ${ncrItem.productName} from NCR!`);
          await fetchListings();
          if (onMarketAction) onMarketAction();
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(err.message || 'NCR transaction rejected by treasury.');
      } finally {
        setActionInProgress(false);
      }
      return;
    }

    const activeListings = listings.filter(
      l => l.productId === productId && l.status === 'Active' && l.seller !== startup?._id
    );

    if (activeListings.length === 0) {
      setErrorMessage('No active listings available from other suppliers to purchase.');
      setActionInProgress(false);
      return;
    }

    // Sort to buy from cheapest listing
    const cheapest = [...activeListings].sort((a, b) => a.pricePerUnit - b.pricePerUnit)[0];
    const totalCost = cheapest.pricePerUnit * qty;

    if (startup.currentBalance < totalCost) {
      setErrorMessage('Insufficient corporate liquidity reserves to process trade.');
      setActionInProgress(false);
      return;
    }

    try {
      const res = await marketplaceService.buyListing(cheapest._id, token);
      if (res.success) {
        setSuccessMessage(`Purchase complete: Bought ${qty} units of ${cheapest.productName}!`);
        await fetchListings();
        if (onMarketAction) onMarketAction();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to complete transaction.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle Sell listing creation
  const handleSell = async (productId, qty, price) => {
    if (!token) return;
    setErrorMessage('');
    setSuccessMessage('');
    setActionInProgress(true);

    const stockItem = inventory.find(i => i.productId === productId);
    if (!stockItem || stockItem.quantity < qty) {
      setErrorMessage(`Insufficient stock. You only have ${stockItem ? stockItem.quantity : 0} units available.`);
      setActionInProgress(false);
      return;
    }

    if (activeTab === 'ncr') {
      try {
        const res = await marketplaceService.sellToNcr({ productId, quantity: qty }, token);
        if (res.success) {
          setSuccessMessage(`Sale complete: Sold ${qty} units of ${FLAT_PRODUCTS.find(p => p.id === productId)?.name} to NCR!`);
          await fetchListings();
          if (onMarketAction) onMarketAction();
          setTradeQuantity(1);
        }
      } catch (err) {
        console.error(err);
        setErrorMessage(err.message || 'NCR transaction rejected by treasury.');
      } finally {
        setActionInProgress(false);
      }
      return;
    }

    try {
      const res = await marketplaceService.createListing({
        productId,
        quantity: qty,
        pricePerUnit: price
      }, token);

      if (res.success) {
        setSuccessMessage(`Listing created: Registered ${qty} units of ${FLAT_PRODUCTS.find(p => p.id === productId)?.name} for sale!`);
        await fetchListings();
        if (onMarketAction) onMarketAction();
        setTradeQuantity(1);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to register listing.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Row selection handler
  const handleSelectProduct = (prodId) => {
    setSelectedProductId(prodId);
    setErrorMessage('');
    setSuccessMessage('');
    
    // Autofill defaults
    const prod = FLAT_PRODUCTS.find(p => p.id === prodId);
    if (prod) {
      setSellPricePerUnit(Math.round(prod.basePrice * 1.2));
    }
  };

  // Render shimmering skeleton loader
  const renderSkeletons = () => {
    return Array.from({ length: 5 }).map((_, idx) => (
      <tr key={idx} className="border-b border-white/5 animate-pulse text-text-muted">
        <td className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white/10"></div>
            <div className="h-3 w-16 bg-white/10 rounded animate-pulse"></div>
          </div>
        </td>
        <td className="p-3"><div className="h-3 w-10 bg-white/10 rounded animate-pulse"></div></td>
        <td className="p-3"><div className="h-3 w-12 bg-white/10 rounded animate-pulse"></div></td>
        <td className="p-3"><div className="h-3 w-12 bg-white/10 rounded animate-pulse"></div></td>
        <td className="p-3"><div className="h-3 w-12 bg-white/10 rounded animate-pulse"></div></td>
        <td className="p-3"><div className="h-3 w-8 bg-white/10 rounded animate-pulse"></div></td>
      </tr>
    ));
  };

  const selectedProduct = FLAT_PRODUCTS.find(p => p.id === selectedProductId) || FLAT_PRODUCTS[0];

  // Filtering & Sorting calculations
  const filteredProducts = FLAT_PRODUCTS.filter(p => {
    const matchesCategory = selectedCategory === 'All Categories' || p.categoryGroup === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const processedProducts = filteredProducts.map(p => {
    const activeListings = listings.filter(l => l.productId === p.id && l.status === 'Active');
    const totalQty = activeListings.reduce((sum, l) => sum + l.quantity, 0);
    const minPrice = activeListings.length > 0 
      ? Math.min(...activeListings.map(l => l.pricePerUnit)) 
      : p.basePrice;
    const maxPrice = minPrice * 0.95; // Mock buy price
    
    // Find last transaction price
    const prodTx = transactions.filter(t => t.productId === p.id);
    const lastPrice = prodTx.length > 0 ? prodTx[0].pricePerUnit : p.basePrice * 1.1;

    return {
      ...p,
      availableQuantity: totalQty,
      lowestSellingPrice: minPrice,
      highestBuyingPrice: maxPrice,
      lastTransactionPrice: lastPrice
    };
  }).sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortField === 'quantity') comparison = a.availableQuantity - b.availableQuantity;
    else if (sortField === 'price') comparison = a.lowestSellingPrice - b.lowestSellingPrice;
    
    return sortAsc ? comparison : -comparison;
  });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Statistics summaries
  const todayPurchases = transactions.filter(t => t.transactionType === 'Purchase').length;
  const todaySales = transactions.filter(t => t.transactionType === 'Sale').length;
  const totalRevenue = transactions.filter(t => t.transactionType === 'Sale').reduce((sum, t) => sum + t.totalAmount, 0);
  const totalExpenses = transactions.filter(t => t.transactionType === 'Purchase').reduce((sum, t) => sum + t.totalAmount, 0);

  // Selected trade parameters
  const cheapestListing = listings
    .filter(l => l.productId === selectedProduct.id && l.status === 'Active' && l.seller !== startup?._id)
    .sort((a, b) => a.pricePerUnit - b.pricePerUnit)[0];

  const ncrProductPrice = ncrCatalog.find(i => i.productId === selectedProduct.id);

  const buyPrice = activeTab === 'ncr'
    ? (ncrProductPrice ? ncrProductPrice.ncrSellPrice : selectedProduct.basePrice * 1.5)
    : (cheapestListing ? cheapestListing.pricePerUnit : selectedProduct.basePrice * 1.25);

  const sellPrice = activeTab === 'ncr'
    ? (ncrProductPrice ? ncrProductPrice.ncrBuyPrice : selectedProduct.basePrice * 0.8)
    : sellPricePerUnit;

  const estCost = buyPrice * tradeQuantity;
  const estRevenue = (activeTab === 'ncr' ? sellPrice : sellPricePerUnit) * tradeQuantity;

  return (
    <div className="w-full h-full flex flex-col justify-start bg-[#090e17] text-white p-6 relative font-body select-none">
      
      {/* HUD Message Notifications */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-950/30 border border-red-500/25 rounded text-red-400 text-xs flex items-center gap-3 animate-fade-in z-20">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-950/30 border border-green-500/25 rounded text-greenGlow text-xs flex items-center gap-3 animate-fade-in z-20">
          <i className="fa-solid fa-circle-check"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Market Header */}
      <div className="mb-6 p-4 bg-white/2 border border-white/5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-b from-glassBg to-black/30">
        <div>
          <h2 className="font-display font-extrabold text-lg uppercase tracking-wider text-white">
            Global Trade Terminal
          </h2>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[9px] font-mono text-greenGlow uppercase tracking-widest bg-green-950/20 px-2 py-0.5 rounded border border-greenGlow/10">
              <span className="w-1.5 h-1.5 rounded-full bg-greenGlow animate-ping"></span>
              Exchange Open
            </span>
            <span className="text-[10px] text-text-secondary">
              Open Listings: <span className="text-white font-mono font-bold">{listings.filter(l => l.status === 'Active').length}</span>
            </span>
            <span className="text-[10px] text-text-secondary">
              Activity Status: <span className="text-cyanGlow font-mono font-bold animate-pulse">HIGH</span>
            </span>
          </div>
        </div>
        
        {/* Horizontal Quick Stats */}
        <div className="flex gap-4 border-l border-white/10 pl-0 sm:pl-6 font-mono text-[10px] text-text-secondary flex-wrap">
          <div>
            Sales today: <span className="text-greenGlow font-bold">{todaySales}</span>
          </div>
          <div>
            Purchases today: <span className="text-red-400 font-bold">{todayPurchases}</span>
          </div>
          <div>
            Vol: <span className="text-white font-bold">{formatCurrency(totalRevenue + totalExpenses, startup?.country)}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-white/5 pb-3 font-display">
        <button
          onClick={() => {
            setActiveTab('exchange');
            setErrorMessage('');
            setSuccessMessage('');
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
            setErrorMessage('');
            setSuccessMessage('');
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

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        
        {/* Left Category Filters (lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-card p-4 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/30 flex flex-col gap-4">
            <div>
              <label className="text-[9px] font-display uppercase tracking-widest text-text-muted mb-2 block">
                Filter Ledger
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search exchange..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyanGlow/50 font-mono"
                />
                <i className="fa-solid fa-magnifying-glass absolute right-2.5 top-2 text-text-muted text-[10px]"></i>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-display uppercase tracking-widest text-text-muted mb-1 block">
                Categories
              </span>
              {CATEGORIES.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                    selectedCategory === cat
                      ? 'bg-cyanGlow/10 text-cyanGlow font-bold border-l-2 border-cyanGlow pl-2'
                      : 'text-text-secondary hover:bg-white/2 hover:text-white pl-2'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel - Exchange Listings Table (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-4 min-h-[350px]">
          <div className="glass-card border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/30 flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 bg-black/20 text-[9px] font-display uppercase tracking-widest text-text-muted">
                  <th 
                    className="p-3 cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    Product {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  {activeTab === 'exchange' ? (
                    <>
                      <th 
                        className="p-3 cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort('quantity')}
                      >
                        Available {sortField === 'quantity' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        className="p-3 cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort('price')}
                      >
                        Lowest Sell {sortField === 'price' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th className="p-3">Highest Buy</th>
                      <th className="p-3">Last Price</th>
                      <th className="p-3">Trend</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Govt Buy Price</th>
                      <th className="p-3 text-right">Govt Sell Price</th>
                      <th className="p-3 text-right">Availability</th>
                      <th className="p-3 text-right">Status</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="text-xs font-mono">
                {loading ? (
                  renderSkeletons()
                ) : activeTab === 'exchange' ? (
                  processedProducts.length > 0 ? (
                    processedProducts.map((p, idx) => {
                      const trend = trends[p.id] || { percent: '0.0', isUp: true };
                      const isSelected = p.id === selectedProductId;
                      return (
                        <tr 
                          key={idx} 
                          onClick={() => handleSelectProduct(p.id)}
                          className={`border-b border-white/5 hover:bg-white/2 cursor-pointer transition-colors ${
                            isSelected ? 'bg-cyanGlow/5 border-l-2 border-cyanGlow pl-2.5 font-bold' : ''
                          }`}
                        >
                          <td className="p-3 font-semibold text-white flex items-center gap-2">
                            <i className={`${p.icon} text-cyanGlow/85 text-xs w-4`}></i>
                            <span>{p.name}</span>
                          </td>
                          <td className="p-3">{p.availableQuantity} units</td>
                          <td className="p-3 text-greenGlow">
                            {formatCurrency(p.lowestSellingPrice, startup?.country)}
                          </td>
                          <td className="p-3 text-text-secondary">
                            {formatCurrency(p.highestBuyingPrice, startup?.country)}
                          </td>
                          <td className="p-3 text-white">
                            {formatCurrency(p.lastTransactionPrice, startup?.country)}
                          </td>
                          <td className={`p-3 font-bold ${trend.isUp ? 'text-greenGlow' : 'text-red-400'}`}>
                            {trend.isUp ? '▲' : '▼'} {trend.percent}%
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-xs text-text-muted bg-black/10">
                        No active listings found. <br />
                        <span className="text-[10px] text-cyanGlow">Produce products inside your facility to begin trading.</span>
                      </td>
                    </tr>
                  )
                ) : (
                  processedProducts.map((p, idx) => {
                    const ncrItem = ncrCatalog.find(i => i.productId === p.id);
                    const isSelected = p.id === selectedProductId;
                    if (!ncrItem) return null;
                    return (
                      <tr 
                        key={idx} 
                        onClick={() => handleSelectProduct(p.id)}
                        className={`border-b border-white/5 hover:bg-white/2 cursor-pointer transition-colors ${
                          isSelected ? 'bg-cyanGlow/5 border-l-2 border-cyanGlow pl-2.5 font-bold' : ''
                        }`}
                      >
                        <td className="p-3 font-semibold text-white flex items-center gap-2">
                          <i className={`${p.icon} text-cyanGlow/85 text-xs w-4`}></i>
                          <span>{p.name}</span>
                        </td>
                        <td className="p-3 text-text-secondary">{p.categoryGroup}</td>
                        <td className="p-3 text-right text-cyanGlow font-medium">
                          {formatCurrency(ncrItem.ncrBuyPrice, startup?.country)}
                        </td>
                        <td className="p-3 text-right text-greenGlow font-bold">
                          {formatCurrency(ncrItem.ncrSellPrice, startup?.country)}
                        </td>
                        <td className="p-3 text-right text-text-secondary">Unlimited</td>
                        <td className="p-3 text-right font-bold text-greenGlow">Available</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panels (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card 1: Quick Trade */}
          <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/35 relative font-mono">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyanGlow/30 to-transparent"></div>
            <div className="text-[10px] font-display uppercase tracking-widest text-text-muted mb-3.5 font-sans">
              Quick Trade Console
            </div>

            <div className="flex gap-2 mb-4 p-1 bg-black/40 rounded border border-white/5 text-xs font-display">
              <button
                onClick={() => { setTradeMode('buy'); setErrorMessage(''); setSuccessMessage(''); }}
                className={`flex-1 py-1.5 rounded uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                  tradeMode === 'buy'
                    ? 'bg-green-950/30 text-greenGlow border border-green-500/25'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                Buy Orders
              </button>
              <button
                onClick={() => { setTradeMode('sell'); setErrorMessage(''); setSuccessMessage(''); }}
                className={`flex-1 py-1.5 rounded uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                  tradeMode === 'sell'
                    ? 'bg-red-950/20 text-red-400 border border-red-500/25'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                Sell Listing
              </button>
            </div>

            {/* Target commodity card */}
            <div className="p-3 bg-black/20 border border-white/5 rounded-lg flex items-center gap-3 mb-4 font-sans">
              <div className="w-10 h-10 rounded bg-white/2 flex items-center justify-center text-sm border border-white/10 text-cyanGlow">
                <i className={`${selectedProduct?.icon || 'fa-solid fa-box'}`}></i>
              </div>
              <div>
                <h4 className="font-display font-extrabold text-xs uppercase text-white">
                  {selectedProduct?.name || 'No Product Selected'}
                </h4>
                <p className="text-[9px] text-text-secondary mt-0.5 font-mono">
                  Base value: {formatCurrency(selectedProduct?.basePrice || 0, startup?.country)}/unit
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              {/* Quantity select */}
              <div>
                <label className="text-[9px] font-display uppercase tracking-widest text-text-secondary block mb-1.5 font-sans">
                  Order Quantity
                </label>
                <div className="flex items-center bg-black/40 rounded border border-white/15 px-2 py-1.5">
                  <button
                    onClick={() => setTradeQuantity(Math.max(1, tradeQuantity - 1))}
                    className="w-5 h-5 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 text-white text-[10px] rounded cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-transparent border-none focus:outline-none text-center text-white"
                  />
                  <button
                    onClick={() => setTradeQuantity(tradeQuantity + 1)}
                    className="w-5 h-5 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 text-white text-[10px] rounded cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price select for Sell listing */}
              {tradeMode === 'sell' && activeTab === 'exchange' && (
                <div>
                  <label className="text-[9px] font-display uppercase tracking-widest text-text-secondary block mb-1.5 font-sans">
                    Price per Unit ({CURRENCY_SYMBOLS[startup?.country] || '$'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sellPricePerUnit}
                    onChange={(e) => setSellPricePerUnit(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-black/40 border border-white/15 rounded px-3 py-1.5 text-white focus:outline-none focus:border-cyanGlow/50"
                  />
                </div>
              )}

              {/* Estimation parameters */}
              <div className="p-3 bg-black/30 rounded border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span>Unit Price</span>
                  <span className="text-white font-bold">
                    {tradeMode === 'buy' ? formatCurrency(buyPrice, startup?.country) : formatCurrency(activeTab === 'ncr' ? sellPrice : sellPricePerUnit, startup?.country)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-1.5">
                  <span>{tradeMode === 'buy' ? 'Estimated Cost' : 'Estimated Revenue'}</span>
                  <span className={tradeMode === 'buy' ? 'text-red-400 font-extrabold' : 'text-greenGlow font-extrabold'}>
                    {tradeMode === 'buy' ? formatCurrency(estCost, startup?.country) : formatCurrency(estRevenue, startup?.country)}
                  </span>
                </div>
              </div>

              {tradeMode === 'buy' ? (
                <button
                  onClick={() => handleBuy(selectedProduct.id, tradeQuantity)}
                  disabled={actionInProgress || (activeTab === 'exchange' && !cheapestListing)}
                  className="w-full py-2 bg-gradient-to-r from-green-700 to-green-600 border border-green-500/30 text-white font-display font-extrabold uppercase tracking-widest rounded shadow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-xs cursor-pointer animate-pulse-subtle"
                >
                  {actionInProgress ? 'Processing...' : activeTab === 'ncr' ? 'Buy from Reserve' : 'Execute Buy Contract'}
                </button>
              ) : (
                <button
                  onClick={() => handleSell(selectedProduct.id, tradeQuantity, activeTab === 'ncr' ? sellPrice : sellPricePerUnit)}
                  disabled={actionInProgress}
                  className="w-full py-2 bg-gradient-to-r from-cyan-700 to-cyan-600 border border-cyanGlow/30 text-white font-display font-extrabold uppercase tracking-widest rounded shadow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-xs cursor-pointer"
                >
                  {actionInProgress ? 'Processing...' : activeTab === 'ncr' ? 'Sell to Reserve' : 'Publish Sell Offer'}
                </button>
              )}

              {/* Market Comparison Card */}
              {selectedProduct && (
                <div className="p-3 bg-black/40 border border-white/10 rounded font-sans text-xs mt-2">
                  <span className="text-text-muted text-[8px] font-display uppercase tracking-widest block mb-2 font-sans">Market Comparison</span>
                  <div className="grid grid-cols-2 gap-2 text-left font-mono">
                    <div className="p-2 bg-black/50 rounded border border-white/5">
                      <span className="text-[8px] text-text-secondary uppercase font-sans">Exchange</span>
                      <span className="text-cyanGlow font-bold block mt-0.5">
                        {cheapestListing ? formatCurrency(cheapestListing.pricePerUnit, startup?.country) : 'No listings'}
                      </span>
                      <span className="text-[8px] text-text-muted">
                        {cheapestListing ? `${cheapestListing.quantity} units` : '0 units'}
                      </span>
                    </div>
                    <div className="p-2 bg-black/50 rounded border border-white/5">
                      <span className="text-[8px] text-text-secondary uppercase font-sans">Reserve (NCR)</span>
                      <span className="text-amber-400 font-bold block mt-0.5">
                        {ncrProductPrice ? formatCurrency(ncrProductPrice.ncrSellPrice, startup?.country) : 'N/A'}
                      </span>
                      <span className="text-[8px] text-text-muted">Unlimited</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Company Inventory */}
          <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/35 flex flex-col gap-3 font-mono">
            <div className="text-[10px] font-display uppercase tracking-widest text-text-muted font-sans">
              Company Stock Warehouse
            </div>

            <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto pr-1">
              {inventory.length > 0 ? (
                inventory.map((item, idx) => {
                  const prod = FLAT_PRODUCTS.find(p => p.id === item.productId) || { icon: 'fa-solid fa-box', basePrice: 100 };
                  const marketVal = item.quantity * prod.basePrice;
                  
                  return (
                    <div key={idx} className="p-2.5 bg-black/20 border border-white/5 rounded flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <i className={`${prod.icon} text-cyanGlow text-[10px]`}></i>
                        <div className="min-w-0 font-sans">
                          <span className="text-white font-bold truncate block">{item.productName}</span>
                          <span className="text-[9px] text-text-secondary block font-mono">{item.quantity} units</span>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3 shrink-0">
                        <span className="text-text-secondary text-[10px]">
                          {formatCurrency(marketVal, startup?.country)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedProductId(item.productId);
                            setTradeMode('sell');
                            setTradeQuantity(1);
                            setSellPricePerUnit(Math.round(prod.basePrice * 1.25));
                          }}
                          className="px-2 py-1 bg-cyan-950/20 border border-cyanGlow/25 text-cyanGlow hover:bg-cyan-900/35 text-[9px] font-display uppercase tracking-widest rounded cursor-pointer"
                        >
                          Trade
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-black/20 border border-white/5 rounded text-center text-xs text-text-muted font-sans leading-relaxed">
                  No warehouse items in stock. <br />
                  <span className="text-[10px] text-cyanGlow/60 font-mono">Produce items inside your facility to begin stocking.</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Market News & Headlines Ticker */}
          <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/35 flex flex-col gap-3 font-mono">
            <div className="text-[10px] font-display uppercase tracking-widest text-text-muted flex justify-between items-center font-sans">
              <span>Economy Broadcast</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            </div>
            
            <div className="p-3.5 bg-black/30 border border-white/5 rounded-lg flex flex-col gap-2 font-mono text-[10.5px] text-text-secondary overflow-hidden h-[95px] relative">
              <div className="absolute top-0 left-0 w-full h-[5px] bg-gradient-to-b from-black/20 to-transparent"></div>
              <div className="flex flex-col gap-2.5 animate-marquee-vertical">
                <div className="flex gap-2">
                  <span className="text-red-400 font-bold">[ECON]</span>
                  <span>Steel demand increasing on factory grid expansion.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-greenGlow font-bold">[ECON]</span>
                  <span>Coal prices drop as regional mine throughput surges.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyanGlow font-bold">[ECON]</span>
                  <span>Food processing plants report export increases.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-amber-400 font-bold">[ECON]</span>
                  <span>Construction sector indices reach record highs.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Future expansion blocks */}
          <div className="grid grid-cols-2 gap-3 opacity-60 font-mono">
            {[
              { name: 'Import / Export', desc: 'Global trade agreements.' },
              { name: 'Commodity Exchange', desc: 'Standardized commodity contracts.' }
            ].map((action, idx) => (
              <div
                key={idx}
                className="p-3 bg-white/2 border border-white/5 rounded text-left flex flex-col gap-1 relative group cursor-not-allowed"
              >
                <span className="font-display font-bold text-xs text-white font-sans">{action.name}</span>
                <span className="text-[9px] text-text-secondary leading-tight">{action.desc}</span>
                <span className="absolute inset-0 flex items-center justify-center bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                  <span className="text-[8px] font-mono text-cyanGlow uppercase tracking-widest font-sans">
                    Future Update
                  </span>
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
