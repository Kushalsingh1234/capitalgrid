import countryEconomy from '../config/countryEconomy.js';
import { getTradeRoute } from '../config/tradeRoutes.js';

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

/**
 * Trade Service
 * Reusable backend service for calculating cross-border transaction prices,
 * tariffs, import duties, and trade agreements.
 */
class TradeService {
  /**
   * Helper to convert currencies directly
   */
  convertCurrency(amount, fromCountry, toCountry) {
    const fromCurrency = CURRENCY_MAP[fromCountry] || 'USD';
    const toCurrency = CURRENCY_MAP[toCountry] || 'USD';
    if (fromCurrency === toCurrency) return amount;
    
    const usdVal = amount / (EXCHANGE_RATES[fromCurrency] || 1.0);
    return usdVal * (EXCHANGE_RATES[toCurrency] || 1.0);
  }

  /**
   * Calculate dynamic pricing for a listing based on buyer country
   * @param {Object} listing - The marketplace listing object
   * @param {string} buyerCountry - The country of the buyer startup
   * @returns {Object} Pricing breakdown and trade route attributes
   */
  calculateTradePrice(listing, buyerCountry) {
    const sellerCountry = listing.sellerCountry || 'United States';
    const sellerCurrency = listing.sellerCurrency || 'USD';
    const pricePerUnit = listing.pricePerUnit || listing.unitPrice;

    // Load the matching directional Trade Route
    const route = getTradeRoute(sellerCountry, buyerCountry);

    // Determine commodity base prices in both countries to preserve listing ratio
    const normProduct = (listing.productId || listing.commodity || '').toLowerCase();
    const sellerCountryData = countryEconomy.countries[sellerCountry];
    const buyerCountryData = countryEconomy.countries[buyerCountry];

    let buyerBasePriceVal = 0;

    if (sellerCountryData && buyerCountryData) {
      const sellerComm = sellerCountryData.commodities[normProduct];
      const buyerComm = buyerCountryData.commodities[normProduct];

      if (sellerComm && buyerComm) {
        // Ratio = Seller Price / Seller Base Price
        const ratio = pricePerUnit / sellerComm.price;
        // Converted local base price for buyer = Ratio * Buyer Base Price
        buyerBasePriceVal = ratio * buyerComm.price;
      } else {
        // Fallback to currency rate conversion
        buyerBasePriceVal = this.convertCurrency(pricePerUnit, sellerCountry, buyerCountry);
      }
    } else {
      buyerBasePriceVal = this.convertCurrency(pricePerUnit, sellerCountry, buyerCountry);
    }

    // Apply shipping and tariff percentages from configuration route
    const shippingCost = buyerBasePriceVal * (route.shippingPercentage / 100);
    const tariffCost = buyerBasePriceVal * (route.tariffPercentage / 100);
    const finalPrice = buyerBasePriceVal + shippingCost + tariffCost;

    const buyerCurrency = CURRENCY_MAP[buyerCountry] || 'USD';

    return {
      sellerPrice: pricePerUnit,
      buyerBasePrice: buyerBasePriceVal, // Domestic value before shipping/tariff
      buyerPrice: finalPrice, // Final unit price mapping for transactional balance verification
      shippingCost,
      tariffCost,
      finalPrice,
      shippingPercentage: route.shippingPercentage,
      tariffPercentage: route.tariffPercentage,
      distance: route.distance,
      tradeStatus: route.status,
      tradeRouteId: route.id,
      originCountry: sellerCountry,
      destinationCountry: buyerCountry,
      buyerCurrency
    };
  }
}

export default new TradeService();
