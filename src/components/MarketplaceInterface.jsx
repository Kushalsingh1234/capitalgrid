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
  'Industrial Goods',
  'Utilities'
];

const NCR_ICONS = {
  water: 'fa-solid fa-droplet text-blue-400',
  cows: 'fa-solid fa-cow text-blue-400',
  hens: 'fa-solid fa-dove text-blue-400',
  energy: 'fa-solid fa-bolt text-blue-400',
  clay: 'fa-solid fa-shapes text-blue-400'
};

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

const COUNTRY_FLAGS = {
  'India': '🇮🇳',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'Brazil': '🇧🇷',
  'Japan': '🇯🇵',
  'Australia': '🇦🇺'
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
      className="w-4 h-2.5 object-cover rounded-sm border border-white/10 shrink-0 animate-fade-in" 
    />
  );
};

const CURRENCY_MAP = {
  'India': 'INR',
  'United States': 'USD',
  'United Kingdom': 'GBP',
  'Germany': 'EUR',
  'Brazil': 'BRL',
  'Japan': 'JPY',
  'Australia': 'AUD'
};

const EXCHANGE_RATES = {
  'INR': 83.0,
  'USD': 1.0,
  'GBP': 0.78,
  'EUR': 0.92,
  'BRL': 5.0,
  'JPY': 155.0,
  'AUD': 1.5
};



export default function MarketplaceInterface({
  startup,
  inventory = [],
  transactions = [],
  onMarketAction,
  token,
  onClose
}) {
  const localPrices = startup?.localPrices || {};
  const productsWithPrices = FLAT_PRODUCTS.map(p => ({
    ...p,
    basePrice: localPrices[p.id] || 10
  }));

  // UI State
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [tradeMode, setTradeMode] = useState('buy'); // 'buy' or 'sell'
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name'); // 'name', 'quantity', 'price'
  const [sortAsc, setSortAsc] = useState(true);
  const [trends, setTrends] = useState({});
  const [activeTab, setActiveTab] = useState('exchange');
  const [ncrCatalog, setNcrCatalog] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('home');
  const [selectedListing, setSelectedListing] = useState(null);

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
    const finalQty = parseInt(qty, 10) || 1;
    const activeListing = activeListingForConsole;
    if (!token || !activeListing) return;
    setErrorMessage('');
    setSuccessMessage('');
    setActionInProgress(true);

    if (activeListing.isNcr) {
      const ncrItem = ncrCatalog.find(i => i.productId === productId);
      if (!ncrItem) {
        setErrorMessage('Product not found in reserve catalog.');
        setActionInProgress(false);
        return;
      }
      const totalCost = activeListing.ncrSellPrice * finalQty;
      if (startup.currentBalance < totalCost) {
        setErrorMessage('Insufficient corporate liquidity reserves to process trade.');
        setActionInProgress(false);
        return;
      }
      try {
        const res = await marketplaceService.buyFromNcr({ productId, quantity: finalQty }, token);
        if (res.success) {
          setSuccessMessage(`Purchase complete: Bought ${finalQty} units of ${ncrItem.productName} from NCR!`);
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

    // Buy selected player listing
    const totalCost = activeListing.finalPrice * finalQty;

    if (startup.currentBalance < totalCost) {
      setErrorMessage('Insufficient corporate liquidity reserves to process trade.');
      setActionInProgress(false);
      return;
    }

    try {
      const res = await marketplaceService.buyListing(activeListing.id, finalQty, token);
      if (res.success) {
        setSuccessMessage(`Purchase complete: Bought ${finalQty} units of ${activeListing.productName}!`);
        await fetchListings();
        if (onMarketAction) onMarketAction();
        setTradeQuantity(1);
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
    const finalQty = parseInt(qty, 10) || 1;
    if (!token) return;
    setErrorMessage('');
    setSuccessMessage('');
    setActionInProgress(true);

    const stockItem = inventory.find(i => i.productId === productId);
    if (!stockItem || stockItem.quantity < finalQty) {
      setErrorMessage(`Insufficient stock. You only have ${stockItem ? stockItem.quantity : 0} units available.`);
      setActionInProgress(false);
      return;
    }

    if (selectedListing?.isNcr || activeTab === 'ncr') {
      try {
        const res = await marketplaceService.sellToNcr({ productId, quantity: finalQty }, token);
        if (res.success) {
          setSuccessMessage(`Sale complete: Sold ${finalQty} units of ${productsWithPrices.find(p => p.id === productId)?.name} to NCR!`);
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
        quantity: finalQty,
        pricePerUnit: price
      }, token);

      if (res.success) {
        setSuccessMessage(`Listing created: Registered ${finalQty} units of ${productsWithPrices.find(p => p.id === productId)?.name} for sale!`);
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
    setTradeQuantity(1);
    
    // Autofill defaults
    const prod = productsWithPrices.find(p => p.id === prodId);
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

  const playerCountry = startup?.country || 'United States';

  // Filtering & Sorting calculations
  const filteredProductsList = productsWithPrices.filter(p => {
    const matchesCategory = selectedCategory === 'All Categories' || p.categoryGroup === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate statistics
  const domesticListingsCount = listings.filter(l => l.sellerCountry === playerCountry && l.status === 'Active').length;
  const internationalListingsCount = listings.filter(l => l.sellerCountry !== playerCountry && l.status === 'Active').length;
  
  const domesticTransactions = transactions.filter(t => 
    t.sellerStartupName !== 'National Commodity Reserve' && 
    t.buyerStartupName !== 'National Commodity Reserve'
  ).length;

  const governmentTransactions = transactions.filter(t => 
    t.sellerStartupName === 'National Commodity Reserve' || 
    t.buyerStartupName === 'National Commodity Reserve'
  ).length;

  const importTransactions = transactions.filter(t => 
    t.transactionType === 'Purchase' && 
    t.sellerStartupName !== 'National Commodity Reserve'
  );
  const importsToday = importTransactions.length;
  const avgImportCost = importsToday > 0 
    ? importTransactions.reduce((sum, t) => sum + t.totalAmount, 0) / importsToday 
    : 0;

  const activeForeignCountries = new Set(
    listings.filter(l => l.sellerCountry !== playerCountry && l.status === 'Active')
      .map(l => l.sellerCountry)
  );
  const countriesTrading = activeForeignCountries.size;

  // 1. Calculations for Home Market (Products and NCR listings)
  const processedProducts = filteredProductsList.map(p => {
    const activeListings = listings.filter(l => l.productId === p.id && l.status === 'Active' && l.sellerCountry === playerCountry);
    const totalQty = activeListings.reduce((sum, l) => sum + l.quantity, 0);
    const minPrice = activeListings.length > 0 
      ? Math.min(...activeListings.map(l => l.pricePerUnit)) 
      : p.basePrice;
    const maxPrice = minPrice * 0.65; // Mock buy price
    
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

  // Selected Product for Home Market Console
  const selectedProduct = productsWithPrices.find(p => p.id === selectedProductId) || 
    (selectedProductId === 'water' ? {
      id: 'water',
      name: 'Water',
      basePrice: localPrices['water'] || 10,
      icon: 'fa-solid fa-droplet text-blue-400',
      categoryGroup: 'Agriculture'
    } : productsWithPrices[0]);

  const cheapestListing = listings
    .filter(l => l.productId === selectedProduct?.id && l.status === 'Active' && l.sellerCountry === playerCountry && l.seller !== startup?._id)
    .sort((a, b) => a.pricePerUnit - b.pricePerUnit)[0];

  const ncrProductPrice = ncrCatalog.find(i => i.productId === selectedProduct?.id);

  // 2. Calculations for Global Market (Individual Listings list)
  const displayListings = [];
  filteredProductsList.forEach(p => {
    const productPlayerListings = listings.filter(l => 
      l.productId === p.id && 
      l.status === 'Active' &&
      l.sellerCountry !== playerCountry
    );
    
    productPlayerListings.forEach(l => {
      displayListings.push({
        isNcr: false,
        id: l._id || l.id,
        productId: l.productId,
        productName: l.productName,
        icon: p.icon || 'fa-solid fa-box',
        quantity: l.quantity,
        sellerStartupName: l.sellerStartupName,
        sellerCountry: l.sellerCountry,
        sellerCurrency: l.sellerCurrency,
        pricePerUnit: l.pricePerUnit,
        buyerBasePrice: l.buyerBasePrice || l.buyerPrice || l.pricePerUnit,
        buyerPrice: l.buyerPrice || l.pricePerUnit,
        shippingCost: l.shippingCost || 0,
        tariff: l.tariff || 0,
        finalPrice: l.finalPrice || l.pricePerUnit,
        shippingPercentage: l.shippingPercentage || 0,
        tariffPercentage: l.tariffPercentage || 0,
        distance: l.distance || 'Long',
        tradeStatus: l.tradeStatus || 'Normal',
        tradeRouteId: l.tradeRouteId || '',
        buyerCurrency: l.buyerCurrency || 'USD',
        rawListing: l
      });
    });
  });

  const sortedListings = [...displayListings].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') comparison = a.productName.localeCompare(b.productName);
    else if (sortField === 'quantity') comparison = a.quantity - b.quantity;
    else if (sortField === 'price') comparison = a.finalPrice - b.finalPrice;
    
    return sortAsc ? comparison : -comparison;
  });

  // Selected Listing for Global Market Console
  useEffect(() => {
    if (selectedMarket === 'global' && selectedListing) {
      const stillExists = sortedListings.find(l => l.id === selectedListing.id);
      if (!stillExists) {
        setSelectedListing(null);
        setSelectedProductId('');
      } else {
        setSelectedListing(stillExists);
      }
    }
  }, [selectedMarket, selectedCategory, searchQuery, listings]);

  // Console active selection model
  const activeListingForConsole = selectedMarket === 'global'
    ? selectedListing
    : (activeTab === 'ncr' ? {
        isNcr: true,
        id: `ncr-${selectedProductId}`,
        productId: selectedProductId,
        productName: ncrProductPrice ? ncrProductPrice.productName : (selectedProduct?.name || 'Water'),
        quantity: 'Unlimited',
        buyerBasePrice: ncrProductPrice ? ncrProductPrice.ncrSellPrice / 1.40 : (selectedProduct ? selectedProduct.basePrice : 0),
        finalPrice: ncrProductPrice ? ncrProductPrice.ncrSellPrice : (selectedProduct ? +(selectedProduct.basePrice * 1.40).toFixed(2) : 0),
        ncrBuyPrice: ncrProductPrice ? ncrProductPrice.ncrBuyPrice : (selectedProduct ? +(selectedProduct.basePrice * 0.65).toFixed(2) : 0),
        ncrSellPrice: ncrProductPrice ? ncrProductPrice.ncrSellPrice : (selectedProduct ? +(selectedProduct.basePrice * 1.40).toFixed(2) : 0),
        shippingCost: 0,
        tariff: 0
      } : (cheapestListing ? {
        isNcr: false,
        id: cheapestListing._id,
        productId: cheapestListing.productId,
        productName: cheapestListing.productName,
        quantity: cheapestListing.quantity,
        buyerBasePrice: cheapestListing.buyerBasePrice || cheapestListing.buyerPrice || cheapestListing.pricePerUnit,
        finalPrice: cheapestListing.pricePerUnit,
        buyerPrice: cheapestListing.pricePerUnit,
        shippingCost: 0,
        tariff: 0
      } : null));

  const buyPrice = activeListingForConsole ? activeListingForConsole.finalPrice : (selectedProduct ? selectedProduct.basePrice * 1.25 : 0);
  const sellPrice = activeListingForConsole?.isNcr ? activeListingForConsole.ncrBuyPrice : (selectedProduct ? +(selectedProduct.basePrice * 0.65).toFixed(2) : 0);

  const estCost = buyPrice * (parseInt(tradeQuantity, 10) || 0);
  const estRevenue = (activeListingForConsole?.isNcr ? sellPrice : sellPricePerUnit) * (parseInt(tradeQuantity, 10) || 0);

  const renderQuickTradeConsoleInline = (product, listing = null) => {
    const isGlobal = selectedMarket === 'global';
    const activeListing = isGlobal ? listing : activeListingForConsole;
    const prod = product || productsWithPrices.find(p => p.id === listing?.productId);
    
    if (!prod) return null;

    const unitPrice = activeListing 
      ? (activeListing.finalPrice || activeListing.pricePerUnit || activeListing.ncrSellPrice || 0)
      : 0;

    const maxQty = tradeMode === 'sell'
      ? (inventory.find(i => i.productId === prod.id)?.quantity || 0)
      : (activeListing 
          ? (activeListing.isNcr 
              ? (unitPrice > 0 ? Math.floor(startup.currentBalance / unitPrice) : 0)
              : (unitPrice > 0 ? Math.min(activeListing.quantity, Math.floor(startup.currentBalance / unitPrice)) : activeListing.quantity)
            ) 
          : 0);
    const displayMaxQty = Math.max(1, maxQty);
    const showMaxButton = tradeMode === 'sell' || tradeMode === 'buy';

    return (
      <div className="p-4 bg-black/50 border border-cyanGlow/20 rounded-lg max-w-[500px] mx-auto text-left flex flex-col gap-3 font-mono text-[11px] animate-fade-in relative text-text-secondary">
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-cyanGlow/40 to-transparent"></div>
        
        {/* Close Button */}
        <button
          onClick={() => {
            setSelectedProductId('');
            setSelectedListing(null);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className="absolute top-2.5 right-3 text-text-muted hover:text-white transition-colors cursor-pointer text-xs focus:outline-none z-10"
          title="Close Trade Panel"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="flex justify-between items-center mb-1 pr-6">
          <span className="font-display font-extrabold text-[10px] uppercase text-cyanGlow tracking-wider">
            Trade Panel: {prod.name}
          </span>
          <span className="text-[9px] text-text-muted">
            Base: {formatCurrency(prod.basePrice, startup?.country)}
          </span>
        </div>



        {/* Quantity control */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-[9px] text-text-secondary">
            <span>ORDER QUANTITY</span>
            {maxQty > 0 && maxQty < 999999 && (
              <span>Limit: {maxQty}</span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-black/40 rounded border border-white/15 px-2 py-1">
            <button
              onClick={() => setTradeQuantity(prev => Math.max(1, Math.min(displayMaxQty, (parseInt(prev, 10) || 1) - 1)))}
              className="w-5 h-5 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 text-white text-[10px] rounded cursor-pointer"
            >
              -
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={tradeQuantity}
              onChange={(e) => {
                const val = e.target.value;
                const cleaned = val.replace(/\D/g, '');
                if (cleaned === '') {
                  setTradeQuantity('');
                } else {
                  const parsed = parseInt(cleaned, 10);
                  if (!isNaN(parsed)) {
                    setTradeQuantity(Math.max(1, Math.min(displayMaxQty, parsed)));
                  }
                }
              }}
              onBlur={() => {
                if (tradeQuantity === '' || tradeQuantity < 1) {
                  setTradeQuantity(1);
                }
              }}
              className="w-full bg-transparent border-none focus:outline-none text-center text-white font-mono"
            />
            <button
              onClick={() => setTradeQuantity(prev => Math.min(displayMaxQty, (parseInt(prev, 10) || 1) + 1))}
              className="w-5 h-5 flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/15 text-white text-[10px] rounded cursor-pointer"
            >
              +
            </button>
            {showMaxButton && (
              <button
                onClick={() => setTradeQuantity(displayMaxQty)}
                className="px-2 py-0.5 border border-cyanGlow/30 bg-cyan-950/20 hover:bg-cyanGlow/25 text-cyanGlow text-[9px] rounded font-display uppercase tracking-wider cursor-pointer ml-1.5 shrink-0"
              >
                Max
              </button>
            )}
          </div>
        </div>

        {/* Price control for Sell */}
        {tradeMode === 'sell' && selectedMarket === 'home' && activeTab === 'exchange' && (
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-text-secondary">PRICE PER UNIT ({CURRENCY_SYMBOLS[startup?.country] || '$'})</span>
            <input
              type="text"
              value={sellPricePerUnit}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setSellPricePerUnit('');
                } else {
                  const cleaned = val.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  const filtered = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                  setSellPricePerUnit(filtered);
                }
              }}
              onBlur={() => {
                const parsed = parseFloat(sellPricePerUnit);
                if (isNaN(parsed) || parsed < 0.01) {
                  setSellPricePerUnit(1);
                }
              }}
              className="w-full bg-black/40 border border-white/15 rounded px-2.5 py-1 text-white focus:outline-none focus:border-cyanGlow/50"
            />
          </div>
        )}

        {/* Global Import Route Breakdown Details */}
        {isGlobal && activeListing && (
          <div className="p-2.5 bg-black/35 rounded border border-white/5 flex flex-col gap-1.5 text-[9.5px]">
            <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1 font-sans text-text-secondary text-[8.5px] uppercase tracking-wider">
              <span>Import Route details</span>
              <span>🌍</span>
            </div>
            <div className="flex items-center justify-between py-1 bg-white/2 rounded px-2 border border-white/5 font-sans mb-1 text-[9px]">
              <div className="flex items-center gap-1">
                {renderFlagImage(activeListing.sellerCountry)}
                <span className="font-semibold text-white">{activeListing.sellerCountry}</span>
              </div>
              <span className="text-text-muted">→</span>
              <div className="flex items-center gap-1">
                {renderFlagImage(playerCountry)}
                <span className="font-semibold text-white">{playerCountry}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Route Status</span>
              <span className={`font-sans font-extrabold px-1 rounded text-[7.5px] ${
                activeListing.tradeStatus === 'Preferred' 
                  ? 'text-greenGlow bg-green-950/20 border border-greenGlow/10' 
                  : 'text-amberGlow bg-amber-950/20 border border-amberGlow/10'
              }`}>
                {activeListing.tradeStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Distance</span>
              <span className="text-white">{activeListing.distance}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-1.5">
              <span>Seller Price</span>
              <span className="text-white">{formatCurrency(activeListing.pricePerUnit, activeListing.sellerCountry)}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-1.5">
              <span>Buyer Base Price</span>
              <span className="text-white">
                {formatCurrency(activeListing.buyerBasePrice || activeListing.buyerPrice, playerCountry)}
                <span className="text-text-muted text-[10px] ml-1">
                  ({formatCurrency((activeListing.buyerBasePrice || activeListing.buyerPrice) * (parseInt(tradeQuantity, 10) || 0), playerCountry)} total)
                </span>
              </span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-1.5">
              <span>Shipping Cost ({activeListing.shippingPercentage}%)</span>
              <span className="text-white">
                {formatCurrency(activeListing.shippingCost, playerCountry)}
                <span className="text-text-muted text-[10px] ml-1">
                  ({formatCurrency(activeListing.shippingCost * (parseInt(tradeQuantity, 10) || 0), playerCountry)} total)
                </span>
              </span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-1.5">
              <span>Import Tariff ({activeListing.tariffPercentage}%)</span>
              <span className="text-white">
                {formatCurrency(activeListing.tariff, playerCountry)}
                <span className="text-text-muted text-[10px] ml-1">
                  ({formatCurrency(activeListing.tariff * (parseInt(tradeQuantity, 10) || 0), playerCountry)} total)
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Cost estimate & Execute Button */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
            <span>{tradeMode === 'buy' ? 'Total Cost' : 'Estimated Revenue'}</span>
            <span className={`text-sm font-black ${tradeMode === 'buy' ? 'text-red-400' : 'text-greenGlow'}`}>
              {tradeMode === 'buy' ? formatCurrency(estCost, startup?.country) : formatCurrency(estRevenue, startup?.country)}
            </span>
          </div>

          {tradeMode === 'buy' ? (
            <button
              onClick={() => handleBuy(prod.id, tradeQuantity)}
              disabled={actionInProgress || !activeListing}
              className="w-full py-2 bg-gradient-to-r from-green-700 to-green-600 border border-green-500/30 text-white font-display font-extrabold uppercase tracking-widest rounded shadow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] cursor-pointer"
            >
              {actionInProgress ? 'Processing...' : isGlobal ? 'Confirm Purchase' : activeListing?.isNcr ? 'Buy from Reserve' : 'Execute Buy Contract'}
            </button>
          ) : (
            <button
              onClick={() => handleSell(prod.id, tradeQuantity, sellPricePerUnit)}
              disabled={actionInProgress}
              className="w-full py-2 bg-gradient-to-r from-cyan-700 to-cyan-600 border border-cyanGlow/30 text-white font-display font-extrabold uppercase tracking-widest rounded shadow hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] cursor-pointer"
            >
              {actionInProgress ? 'Processing...' : (activeListing?.isNcr || activeTab === 'ncr') ? 'Sell to Reserve' : 'Publish Sell Offer'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderWarehouseCard = (isMobile = false) => {
    return (
      <div className={`flex flex-col gap-3 ${isMobile ? 'lg:hidden block' : 'hidden lg:flex'}`}>
        <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/35 flex flex-col gap-3 font-mono">
          <div className="text-[10px] font-display uppercase tracking-widest text-text-muted font-sans">
            Company Stock Warehouse
          </div>

          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {inventory.length > 0 ? (
              inventory.map((item, idx) => {
                const prod = productsWithPrices.find(p => p.id === item.productId) || {
                  id: item.productId,
                  name: item.productName || item.productId.charAt(0).toUpperCase() + item.productId.slice(1).replace('_', ' '),
                  icon: NCR_ICONS[item.productId] || 'fa-solid fa-box',
                  basePrice: localPrices[item.productId] || 100
                };
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
                      {item.productId !== 'water' ? (
                        <button
                          onClick={() => {
                            setSelectedProductId(item.productId);
                            setTradeMode('sell');
                            setTradeQuantity(1);
                            setSellPricePerUnit(Math.round(prod.basePrice * 1.25));
                          }}
                          className="px-2 py-1 bg-cyan-950/20 border border-cyanGlow/25 text-cyanGlow hover:bg-cyan-900/35 text-[9px] font-display uppercase tracking-widest rounded cursor-pointer"
                        >
                          Sell
                        </button>
                      ) : (
                        <span className="text-[8px] font-mono text-text-muted border border-white/5 bg-white/2 px-1 rounded uppercase tracking-wider">NCR Only</span>
                      )}
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
        {tradeMode === 'sell' && selectedProductId && (
          <div className="mt-3">
            {renderQuickTradeConsoleInline(productsWithPrices.find(p => p.id === selectedProductId))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col justify-start bg-[#090e17] text-white p-6 relative font-body select-none">
      
      {/* Market Header */}
      <div className="mb-6 p-4 bg-white/2 border border-white/5 rounded-lg flex justify-between items-center gap-4 bg-gradient-to-b from-glassBg to-black/30 shrink-0">
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
        
        <div className="flex items-center gap-6">
          {/* Horizontal Quick Stats */}
          {selectedMarket === 'home' ? (
            <div className="hidden md:flex gap-4 border-l border-white/10 pl-6 font-mono text-[10px] text-text-secondary">
              <div>
                Domestic Listings: <span className="text-cyanGlow font-bold">{domesticListingsCount}</span>
              </div>
              <div>
                Domestic Trades: <span className="text-greenGlow font-bold">{domesticTransactions}</span>
              </div>
              <div>
                Govt Trades: <span className="text-amber-400 font-bold">{governmentTransactions}</span>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex gap-4 border-l border-white/10 pl-6 font-mono text-[10px] text-text-secondary">
              <div>
                Int'l Listings: <span className="text-cyanGlow font-bold">{internationalListingsCount}</span>
              </div>
              <div>
                Imports: <span className="text-greenGlow font-bold">{importsToday}</span>
              </div>
              <div>
                Countries: <span className="text-amber-400 font-bold">{countriesTrading}</span>
              </div>
              <div>
                Avg Import: <span className="text-white font-bold">{formatCurrency(avgImportCost, startup?.country)}</span>
              </div>
            </div>
          )}

          {onClose && (
            <button 
              onClick={onClose}
              className="w-6 h-6 border border-white/5 hover:border-white/20 rounded flex items-center justify-center text-text-muted hover:text-white transition-colors cursor-pointer"
              title="Return to Game Map"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          )}
        </div>
      </div>

      {/* Market Selector Segmented Control */}
      <div className="flex gap-2.5 mb-5 p-1 bg-black/40 rounded border border-white/5 font-display max-w-[320px] shrink-0">
        <button
          onClick={() => {
            setSelectedMarket('home');
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`flex-1 py-1.5 px-3 rounded uppercase tracking-wider font-extrabold text-[10px] transition-colors duration-150 outline-none focus:outline-none border cursor-pointer ${
            selectedMarket === 'home'
              ? 'bg-cyan-950/30 text-cyanGlow border-cyanGlow/25'
              : 'text-text-secondary hover:text-white border-transparent'
          }`}
        >
          Home Market
        </button>
        <button
          onClick={() => {
            setSelectedMarket('global');
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`flex-1 py-1.5 px-3 rounded uppercase tracking-wider font-extrabold text-[10px] transition-colors duration-150 outline-none focus:outline-none border cursor-pointer ${
            selectedMarket === 'global'
              ? 'bg-cyan-950/30 text-cyanGlow border-cyanGlow/25'
              : 'text-text-secondary hover:text-white border-transparent'
          }`}
        >
          Global Market
        </button>
      </div>

      {/* Sub-Tabs: Player Exchange / NCR (Only in Home Market) */}
      {selectedMarket === 'home' && (
        <div className="flex gap-4 mb-6 border-b border-white/5 pb-3 font-display shrink-0">
          <button
            onClick={() => {
              setActiveTab('exchange');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-extrabold transition-colors duration-150 outline-none focus:outline-none border-b-2 cursor-pointer ${
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
            className={`px-4 py-2 text-xs uppercase tracking-widest font-extrabold transition-colors duration-150 outline-none focus:outline-none border-b-2 cursor-pointer ${
              activeTab === 'ncr'
                ? 'border-cyanGlow text-cyanGlow'
                : 'border-transparent text-text-secondary hover:text-white'
            }`}
          >
            National Commodity Reserve (NCR)
          </button>
        </div>
      )}

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

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        
        {/* Left Sidebar: Filters & Mobile Warehouse (lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Filter Ledger */}
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

            {/* Desktop Categories List */}
            <div className="hidden lg:flex flex-col gap-1">
              <span className="text-[9px] font-display uppercase tracking-widest text-text-muted mb-1 block font-sans">
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

            {/* Mobile Categories Dropdown */}
            <div className="block lg:hidden mt-1">
              <span className="text-[9px] font-display uppercase tracking-widest text-text-muted mb-1 block font-sans">
                Category Filter
              </span>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyanGlow/50 font-mono appearance-none cursor-pointer font-sans"
                >
                  {CATEGORIES.map((cat, idx) => (
                    <option key={idx} value={cat} className="bg-[#0b0c10] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-2.5 top-2.5 text-text-muted text-[10px] pointer-events-none"></i>
              </div>
            </div>
          </div>

          {/* Mobile Company Stock Warehouse (lg:hidden) */}
          {renderWarehouseCard(true)}

          {/* Desktop Economy Broadcast Ticker (hidden lg:block) */}
          <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/35 flex flex-col gap-3 font-mono hidden lg:flex">
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

          {/* Desktop Future expansion blocks (hidden lg:grid) */}
          <div className="hidden lg:grid grid-cols-2 gap-3 opacity-60 font-mono">
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

        {/* Center Panel - Exchange Listings Table (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col gap-4 min-h-[350px]">
          <div className="glass-card border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/30 flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                {selectedMarket === 'home' ? (
                  activeTab === 'exchange' ? (
                    <tr className="border-b border-white/10 bg-black/20 text-[9px] font-display uppercase tracking-widest text-text-muted">
                      <th className="p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                        Product {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th className="p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('quantity')}>
                        Available {sortField === 'quantity' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th className="p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('price')}>
                        Lowest Sell {sortField === 'price' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th className="p-3">Highest Buy</th>
                      <th className="p-3">Last Price</th>
                      <th className="p-3">Trend</th>
                    </tr>
                  ) : (
                    <tr className="border-b border-white/10 bg-black/20 text-[9px] font-display uppercase tracking-widest text-text-muted">
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Govt Buy Price</th>
                      <th className="p-3 text-right">Govt Sell Price</th>
                      <th className="p-3 text-right">Availability</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  )
                ) : (
                  <tr className="border-b border-white/10 bg-black/20 text-[9px] font-display uppercase tracking-widest text-text-muted">
                    <th className="p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                      Product {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th className="p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('quantity')}>
                      Available {sortField === 'quantity' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th className="p-3">Seller</th>
                    <th className="p-3">Original Price</th>
                    <th className="p-3">Shipping & Tariff</th>
                    <th className="p-3 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('price')}>
                      Final Price {sortField === 'price' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                )}
              </thead>
              <tbody className="text-xs font-mono">
                {loading ? (
                  renderSkeletons()
                ) : selectedMarket === 'home' ? (
                  activeTab === 'exchange' ? (
                    processedProducts.length > 0 ? (
                      processedProducts.map((p) => {
                        const trend = trends[p.id] || { percent: '0.0', isUp: true };
                        const isSelected = p.id === selectedProductId;
                        return (
                          <React.Fragment key={p.id}>
                            <tr 
                              onClick={() => {
                                handleSelectProduct(p.id);
                                setTradeMode('buy');
                              }}
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
                            {isSelected && tradeMode === 'buy' && (
                              <tr className="hidden lg:table-row bg-black/10">
                                <td colSpan="6" className="p-3 border-b border-cyanGlow/20">
                                  {renderQuickTradeConsoleInline(p)}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-xs text-text-muted bg-black/10">
                          No active domestic listings found. <br />
                          <span className="text-[10px] text-cyanGlow">Produce products inside your facility to begin trading.</span>
                        </td>
                      </tr>
                    )
                  ) : (
                    ncrCatalog.map((item) => {
                      const p = productsWithPrices.find(fp => fp.id === item.productId) || {
                        id: item.productId,
                        name: item.productName,
                        categoryGroup: item.category,
                        icon: NCR_ICONS[item.productId] || 'fa-solid fa-circle-question',
                        basePrice: localPrices[item.productId] || 10
                      };

                      // Apply category filter
                      if (selectedCategory !== 'All Categories' && p.categoryGroup !== selectedCategory) return null;
                      // Apply search filter
                      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return null;

                      const isSelected = p.id === selectedProductId;
                      return (
                        <React.Fragment key={p.id}>
                          <tr 
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setSelectedListing(null);
                              setTradeMode('buy');
                            }}
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
                              {formatCurrency(item.ncrBuyPrice, startup?.country)}
                            </td>
                            <td className="p-3 text-right text-greenGlow font-bold">
                              {formatCurrency(item.ncrSellPrice, startup?.country)}
                            </td>
                            <td className="p-3 text-right text-text-secondary">Unlimited</td>
                            <td className="p-3 text-right font-bold text-greenGlow">Available</td>
                          </tr>
                          {isSelected && tradeMode === 'buy' && (
                            <tr className="hidden lg:table-row bg-black/10">
                              <td colSpan="6" className="p-3 border-b border-cyanGlow/20">
                                {renderQuickTradeConsoleInline(p)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )
                ) : (
                  sortedListings.length > 0 ? (
                    sortedListings.map((l) => {
                      const isSelected = selectedListing?.id === l.id;
                      
                      return (
                        <React.Fragment key={l.id}>
                          <tr 
                            onClick={() => {
                              setSelectedListing(l);
                              setSelectedProductId(l.productId);
                              setTradeMode('buy');
                              setErrorMessage('');
                              setSuccessMessage('');
                            }}
                            className={`border-b border-white/5 hover:bg-white/2 cursor-pointer transition-colors ${
                              isSelected ? 'bg-cyanGlow/5 border-l-2 border-cyanGlow pl-2.5 font-bold' : ''
                            }`}
                          >
                            <td className="p-3 font-semibold text-white flex items-center gap-2">
                              <i className={`${l.icon} text-cyanGlow/85 text-xs w-4`}></i>
                              <span>{l.productName}</span>
                            </td>
                            <td className="p-3">{l.quantity} units</td>
                            <td className="p-3 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {renderFlagImage(l.sellerCountry)}
                                <span className="text-white font-medium text-[11px] truncate max-w-[100px]" title={l.sellerStartupName}>
                                  {l.sellerStartupName}
                                </span>
                                <span className="text-[7.5px] font-mono text-cyanGlow bg-cyan-950/20 px-1 py-0.2 rounded border border-cyanGlow/10">
                                  Player
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-text-secondary text-[11px]">
                              {formatCurrency(l.pricePerUnit, l.sellerCountry)}
                            </td>
                            <td className="p-3 text-[10px] text-text-muted">
                              <div className="flex flex-col gap-0.5 font-mono text-[9px]">
                                <span>Ship: <span className="text-text-secondary">{l.shippingPercentage}%</span> ({formatCurrency(l.shippingCost, playerCountry)})</span>
                                <span>Tariff: <span className="text-text-secondary">{l.tariffPercentage}%</span> ({formatCurrency(l.tariff, playerCountry)})</span>
                              </div>
                            </td>
                            <td className="p-3 text-white font-bold">
                              {formatCurrency(l.finalPrice, playerCountry)}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedListing(l);
                                  setSelectedProductId(l.productId);
                                  setTradeMode('buy');
                                }}
                                className="px-2 py-0.5 bg-green-950/30 border border-green-500/20 text-greenGlow hover:bg-green-950/50 text-[9px] font-display uppercase tracking-widest rounded cursor-pointer"
                              >
                                Trade
                              </button>
                            </td>
                          </tr>
                          {isSelected && tradeMode === 'buy' && (
                            <tr className="hidden lg:table-row bg-black/10">
                              <td colSpan="7" className="p-3 border-b border-cyanGlow/20">
                                {renderQuickTradeConsoleInline(null, l)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-xs text-text-muted bg-black/10">
                        No active international listings found. <br />
                        <span className="text-[10px] text-cyanGlow">Adjust category filters or search queries.</span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile-only Buy console (rendered below listings card to prevent table-width overflow scroll) */}
          {tradeMode === 'buy' && selectedProductId && (
            <div className="block lg:hidden mt-3">
              {renderQuickTradeConsoleInline(
                productsWithPrices.find(p => p.id === selectedProductId),
                selectedMarket === 'global' ? selectedListing : null
              )}
            </div>
          )}

          {/* Mobile Economy Broadcast Ticker (block lg:hidden) */}
          <div className="glass-card p-5 border border-white/5 rounded-lg bg-gradient-to-b from-glassBg to-black/35 flex flex-col gap-3 font-mono block lg:hidden mt-4">
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

          {/* Mobile Future expansion blocks (block lg:hidden) */}
          <div className="grid grid-cols-2 gap-3 opacity-60 font-mono block lg:hidden mt-4">
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

        {/* Right Sidebar: Desktop Stock Warehouse (lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {renderWarehouseCard(false)}
        </div>



      </div>

    </div>
  );
}
