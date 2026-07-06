/**
 * Centralized International Trade Route Configuration
 * Defines shipping rates, import tariffs, distances, and statuses between all supported countries.
 */

const tradeRoutes = [
  // India Exports
  { id: "IND_USA", origin: "India", destination: "United States", shippingPercentage: 8, tariffPercentage: 12, distance: "Long", status: "Normal", description: "Indian exports to the United States" },
  { id: "IND_GBR", origin: "India", destination: "United Kingdom", shippingPercentage: 6, tariffPercentage: 8, distance: "Medium", status: "Normal", description: "Indian exports to the United Kingdom" },
  { id: "IND_DEU", origin: "India", destination: "Germany", shippingPercentage: 7, tariffPercentage: 10, distance: "Medium", status: "Normal", description: "Indian exports to Germany" },
  { id: "IND_BRA", origin: "India", destination: "Brazil", shippingPercentage: 9, tariffPercentage: 14, distance: "Long", status: "Normal", description: "Indian exports to Brazil" },
  { id: "IND_JPN", origin: "India", destination: "Japan", shippingPercentage: 5, tariffPercentage: 6, distance: "Medium", status: "Preferred", description: "Indian exports to Japan" },
  { id: "IND_AUS", origin: "India", destination: "Australia", shippingPercentage: 6, tariffPercentage: 7, distance: "Medium", status: "Preferred", description: "Indian exports to Australia" },

  // USA Exports
  { id: "USA_IND", origin: "United States", destination: "India", shippingPercentage: 10, tariffPercentage: 18, distance: "Long", status: "Normal", description: "US exports to India" },
  { id: "USA_GBR", origin: "United States", destination: "United Kingdom", shippingPercentage: 4, tariffPercentage: 3, distance: "Short", status: "Preferred", description: "US exports to the United Kingdom" },
  { id: "USA_DEU", origin: "United States", destination: "Germany", shippingPercentage: 5, tariffPercentage: 5, distance: "Medium", status: "Preferred", description: "US exports to Germany" },
  { id: "USA_BRA", origin: "United States", destination: "Brazil", shippingPercentage: 7, tariffPercentage: 8, distance: "Medium", status: "Normal", description: "US exports to Brazil" },
  { id: "USA_JPN", origin: "United States", destination: "Japan", shippingPercentage: 8, tariffPercentage: 9, distance: "Long", status: "Normal", description: "US exports to Japan" },
  { id: "USA_AUS", origin: "United States", destination: "Australia", shippingPercentage: 9, tariffPercentage: 7, distance: "Long", status: "Preferred", description: "US exports to Australia" },

  // UK Exports
  { id: "GBR_IND", origin: "United Kingdom", destination: "India", shippingPercentage: 6, tariffPercentage: 10, distance: "Medium", status: "Normal", description: "UK exports to India" },
  { id: "GBR_USA", origin: "United Kingdom", destination: "United States", shippingPercentage: 4, tariffPercentage: 4, distance: "Short", status: "Preferred", description: "UK exports to the United States" },
  { id: "GBR_DEU", origin: "United Kingdom", destination: "Germany", shippingPercentage: 3, tariffPercentage: 2, distance: "Short", status: "Preferred", description: "UK exports to Germany" },
  { id: "GBR_BRA", origin: "United Kingdom", destination: "Brazil", shippingPercentage: 8, tariffPercentage: 10, distance: "Long", status: "Normal", description: "UK exports to Brazil" },
  { id: "GBR_JPN", origin: "United Kingdom", destination: "Japan", shippingPercentage: 8, tariffPercentage: 7, distance: "Long", status: "Normal", description: "UK exports to Japan" },
  { id: "GBR_AUS", origin: "United Kingdom", destination: "Australia", shippingPercentage: 9, tariffPercentage: 8, distance: "Long", status: "Normal", description: "UK exports to Australia" },

  // Germany Exports
  { id: "DEU_IND", origin: "Germany", destination: "India", shippingPercentage: 7, tariffPercentage: 9, distance: "Medium", status: "Normal", description: "German exports to India" },
  { id: "DEU_USA", origin: "Germany", destination: "United States", shippingPercentage: 5, tariffPercentage: 6, distance: "Medium", status: "Preferred", description: "German exports to the United States" },
  { id: "DEU_GBR", origin: "Germany", destination: "United Kingdom", shippingPercentage: 3, tariffPercentage: 3, distance: "Short", status: "Preferred", description: "German exports to the United Kingdom" },
  { id: "DEU_BRA", origin: "Germany", destination: "Brazil", shippingPercentage: 8, tariffPercentage: 9, distance: "Long", status: "Normal", description: "German exports to Brazil" },
  { id: "DEU_JPN", origin: "Germany", destination: "Japan", shippingPercentage: 7, tariffPercentage: 6, distance: "Long", status: "Preferred", description: "German exports to Japan" },
  { id: "DEU_AUS", origin: "Germany", destination: "Australia", shippingPercentage: 9, tariffPercentage: 7, distance: "Long", status: "Normal", description: "German exports to Australia" },

  // Brazil Exports
  { id: "BRA_IND", origin: "Brazil", destination: "India", shippingPercentage: 9, tariffPercentage: 12, distance: "Long", status: "Normal", description: "Brazilian exports to India" },
  { id: "BRA_USA", origin: "Brazil", destination: "United States", shippingPercentage: 7, tariffPercentage: 10, distance: "Medium", status: "Normal", description: "Brazilian exports to the United States" },
  { id: "BRA_GBR", origin: "Brazil", destination: "United Kingdom", shippingPercentage: 8, tariffPercentage: 9, distance: "Long", status: "Normal", description: "Brazilian exports to the United Kingdom" },
  { id: "BRA_DEU", origin: "Brazil", destination: "Germany", shippingPercentage: 8, tariffPercentage: 8, distance: "Long", status: "Normal", description: "Brazilian exports to Germany" },
  { id: "BRA_JPN", origin: "Brazil", destination: "Japan", shippingPercentage: 10, tariffPercentage: 12, distance: "Long", status: "Normal", description: "Brazilian exports to Japan" },
  { id: "BRA_AUS", origin: "Brazil", destination: "Australia", shippingPercentage: 11, tariffPercentage: 10, distance: "Long", status: "Normal", description: "Brazilian exports to Australia" },

  // Japan Exports
  { id: "JPN_IND", origin: "Japan", destination: "India", shippingPercentage: 5, tariffPercentage: 8, distance: "Medium", status: "Preferred", description: "Japanese exports to India" },
  { id: "JPN_USA", origin: "Japan", destination: "United States", shippingPercentage: 8, tariffPercentage: 10, distance: "Long", status: "Normal", description: "Japanese exports to the United States" },
  { id: "JPN_GBR", origin: "Japan", destination: "United Kingdom", shippingPercentage: 8, tariffPercentage: 8, distance: "Long", status: "Normal", description: "Japanese exports to the United Kingdom" },
  { id: "JPN_DEU", origin: "Japan", destination: "Germany", shippingPercentage: 7, tariffPercentage: 7, distance: "Long", status: "Preferred", description: "Japanese exports to Germany" },
  { id: "JPN_BRA", origin: "Japan", destination: "Brazil", shippingPercentage: 10, tariffPercentage: 11, distance: "Long", status: "Normal", description: "Japanese exports to Brazil" },
  { id: "JPN_AUS", origin: "Japan", destination: "Australia", shippingPercentage: 5, tariffPercentage: 3, distance: "Medium", status: "Preferred", description: "Japanese exports to Australia" },

  // Australia Exports
  { id: "AUS_IND", origin: "Australia", destination: "India", shippingPercentage: 6, tariffPercentage: 9, distance: "Medium", status: "Preferred", description: "Australian exports to India" },
  { id: "AUS_USA", origin: "Australia", destination: "United States", shippingPercentage: 9, tariffPercentage: 8, distance: "Long", status: "Preferred", description: "Australian exports to the United States" },
  { id: "AUS_GBR", origin: "Australia", destination: "United Kingdom", shippingPercentage: 9, tariffPercentage: 9, distance: "Long", status: "Normal", description: "Australian exports to the United Kingdom" },
  { id: "AUS_DEU", origin: "Australia", destination: "Germany", shippingPercentage: 9, tariffPercentage: 8, distance: "Long", status: "Normal", description: "Australian exports to Germany" },
  { id: "AUS_BRA", origin: "Australia", destination: "Brazil", shippingPercentage: 11, tariffPercentage: 11, distance: "Long", status: "Normal", description: "Australian exports to Brazil" },
  { id: "AUS_JPN", origin: "Australia", destination: "Japan", shippingPercentage: 5, tariffPercentage: 4, distance: "Medium", status: "Preferred", description: "Australian exports to Japan" }
];

/**
 * Normalizes country names/codes to standard match values
 */
const normalizeCountryName = (countryName) => {
  if (!countryName) return '';
  const normalized = countryName.toLowerCase().trim();
  const map = {
    'india': 'India', 'ind': 'India',
    'united states': 'United States', 'usa': 'United States', 'us': 'United States',
    'united kingdom': 'United Kingdom', 'gbr': 'United Kingdom', 'gb': 'United Kingdom', 'uk': 'United Kingdom',
    'germany': 'Germany', 'deu': 'Germany', 'de': 'Germany',
    'brazil': 'Brazil', 'bra': 'Brazil', 'br': 'Brazil',
    'japan': 'Japan', 'jpn': 'Japan', 'jp': 'Japan',
    'australia': 'Australia', 'aus': 'Australia', 'au': 'Australia'
  };
  return map[normalized] || countryName;
};

/**
 * Resolves the trade route parameters between two countries
 * @param {string} originCountry - Exporting country
 * @param {string} destinationCountry - Importing country
 */
export const getTradeRoute = (originCountry, destinationCountry) => {
  const origin = normalizeCountryName(originCountry);
  const destination = normalizeCountryName(destinationCountry);

  if (origin === destination) {
    return {
      id: `DOM_${origin.substring(0, 3).toUpperCase()}`,
      origin,
      destination,
      shippingPercentage: 0,
      tariffPercentage: 0,
      distance: "Domestic",
      status: "Domestic",
      description: `Domestic trade route inside ${origin}`
    };
  }

  const route = tradeRoutes.find(r => r.origin === origin && r.destination === destination);

  if (!route) {
    // Default fallback route
    return {
      id: "GLOBAL_FALLBACK",
      origin,
      destination,
      shippingPercentage: 10,
      tariffPercentage: 15,
      distance: "Long",
      status: "Normal",
      description: "Default fallback trade route parameters"
    };
  }

  return route;
};

export default {
  tradeRoutes,
  getTradeRoute
};
