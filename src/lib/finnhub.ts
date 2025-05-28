export const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
export const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnhubCompanyProfile {
  country?: string;
  currency?: string;
  exchange?: string;
  name?: string;
  ticker?: string;
  ipo?: string;
  marketCapitalization?: number;
  shareOutstanding?: number;
  logo?: string;
  phone?: string;
  weburl?: string;
  finnhubIndustry?: string;
}

export interface FinnhubBasicFinancials {
  metric: {
    '10DayAverageTradingVolume'?: number;
    '52WeekHigh'?: number;
    '52WeekLow'?: number;
    '52WeekLowDate'?: string;
    '52WeekPriceReturnDaily'?: number;
    beta?: number;
    marketCapitalization?: number;
    dividendYieldIndicatedAnnual?: number; // Using this for dividend yield
    peExclExtraAnnual?: number; // Using this for P/E
    // Add other metrics as needed
  };
  metricType: string;
  series: {
    annual: {
      // further breakdown if needed
    };
  };
  symbol: string;
}

export interface FinnhubCompanyNews {
  category: string;
  datetime: number; // UNIX timestamp
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}


export const fetchQuote = async (symbol: string): Promise<FinnhubQuote | null> => {
  if (!symbol) return null;
  try {
    const response = await fetch(`${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) {
      console.error(`Error fetching quote for ${symbol}: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
};

export const fetchCompanyProfile = async (symbol: string): Promise<FinnhubCompanyProfile | null> => {
  if (!symbol) return null;
  try {
    const response = await fetch(`${FINNHUB_BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) {
      console.error(`Error fetching company profile for ${symbol}: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching company profile for ${symbol}:`, error);
    return null;
  }
};

export const fetchBasicFinancials = async (symbol: string): Promise<FinnhubBasicFinancials | null> => {
  if (!symbol) return null;
  try {
    const response = await fetch(`${FINNHUB_BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`);
    if (!response.ok) {
      console.error(`Error fetching basic financials for ${symbol}: ${response.statusText}`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching basic financials for ${symbol}:`, error);
    return null;
  }
};

// Helper to format date to YYYY-MM-DD for Finnhub API
const formatDateForFinnhub = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fetchCompanyNews = async (
  symbol: string, 
  daysAgo: number = 7 // Default to fetching news for the last 7 days
): Promise<FinnhubCompanyNews[] | null> => {
  if (!symbol) return null;

  const today = new Date();
  const fromDate = new Date();
  fromDate.setDate(today.getDate() - daysAgo);

  const toDateStr = formatDateForFinnhub(today);
  const fromDateStr = formatDateForFinnhub(fromDate);

  try {
    console.log(`[finnhub.ts] Fetching company news for ${symbol} from ${fromDateStr} to ${toDateStr}`);
    const response = await fetch(
      `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${fromDateStr}&to=${toDateStr}&token=${FINNHUB_API_KEY}`
    );
    if (!response.ok) {
      console.error(`Error fetching company news for ${symbol}: ${response.statusText} (${response.status})`);
      // Log the response body if possible, as it might contain more details
      try {
        const errorBody = await response.json();
        console.error("Error body:", errorBody);
      } catch (e) {
        // ignore if error body is not json or empty
      }
      return null;
    }
    const newsData = await response.json();
    if (!Array.isArray(newsData)) {
      console.error(`Company news data for ${symbol} is not an array:`, newsData);
      return []; // Return empty array if data is not in expected format
    }
    // Limit to a reasonable number, e.g., 10 most recent articles
    return newsData.slice(0, 10); 
  } catch (error) {
    console.error(`Error fetching company news for ${symbol}:`, error);
    return null;
  }
};

export const fetchCompanyPeers = async (symbol: string): Promise<string[] | null> => {
  if (!symbol) return null;
  try {
    console.log(`[finnhub.ts] Fetching company peers for ${symbol}`);
    const response = await fetch(`${FINNHUB_BASE_URL}/stock/peers?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!response.ok) {
      console.error(`Error fetching company peers for ${symbol}: ${response.statusText} (${response.status})`);
      // Log error body if possible
      try {
        const errorBody = await response.json();
        console.error("Error body:", errorBody);
      } catch (e) { /* ignore */ }
      return null;
    }
    const peersData = await response.json();
    // The first element is usually the queried symbol itself, so we might want to exclude it if present.
    // The API returns an array of symbols.
    if (Array.isArray(peersData)) {
      // Filter out the original symbol if it's included by the API, and limit number of peers
      return peersData.filter(peer => peer !== symbol).slice(0, 10); // Max 10 peers
    }
    console.error(`Company peers data for ${symbol} is not an array:`, peersData);
    return []; // Return empty array if data is not in expected format
  } catch (error) {
    console.error(`Error fetching company peers for ${symbol}:`, error);
    return null;
  }
}; 