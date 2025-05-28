import { websocketClient, restClient } from '@polygon.io/client-js';

const POLYGON_API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY;

// Custom interface for Polygon stock trade messages based on WebSocket documentation
interface PolygonStockTrade {
  ev?: string;      // Event type (e.g., "T")
  sym: string;     // Symbol
  x: number;       // Exchange ID
  i: string;       // Trade ID
  z: number;       // Tape (1=NYSE, 2=AMEX, 3=NASDAQ)
  p: number;       // Price
  s: number;       // Trade size (volume)
  c: number[];     // Trade conditions
  t: number;       // SIP timestamp (Unix ms)
  q?: number;      // Sequence number
  trfi?: number;   // TRF ID
  trft?: number;   // TRF Timestamp (Unix ms)
}

// Custom interface for Polygon stock aggregate messages based on documentation
interface PolygonStockAggregate {
  ev?: string;      // Event type (e.g., "A", "AM")
  sym: string;     // Symbol
  v: number;       // Volume of the aggregate
  av?: number;      // Accumulated volume for the day (often in AM)
  op?: number;      // Official open price for the day (often in AM)
  vw?: number;      // Volume weighted average price for the aggregate
  o: number;       // Open price for the aggregate window
  c: number;       // Close price for the aggregate window
  h: number;       // High price for the aggregate window
  l: number;       // Low price for the aggregate window
  s: number;       // Start timestamp (Unix ms) for the aggregate window
  e: number;       // End timestamp (Unix ms) for the aggregate window
  otc?: boolean;    // If the aggregate is for an OTC ticker
  // Add other fields as per Polygon documentation if needed, e.g., 'a' for daily VWAP, 'z' for avg trade size
}

export interface RealTimeStockData {
  symbol: string;
  price?: number;
  timestamp?: number;   //来源毫秒级时间戳
  volume?: number;      //交易量或聚合交易量
  vwap?: number;        // VWAP (通常在聚合中)
  last_trade?: PolygonStockTrade; // Using custom interface
  aggregate?: PolygonStockAggregate; // Using custom interface
}

type StockUpdateCallback = (data: RealTimeStockData) => void;

let polygonStockWS: any | null = null;
let currentSubscriptions: string[] = []; // Stores subscribed tickers like ["AAPL", "MSFT"]
let activeRawSubscriptions: string[] = []; // Stores actual subscription strings like ["T.AAPL", "AM.AAPL"]
let updateCallback: StockUpdateCallback | null = null;

let isAttemptingConnection = false;
let connectionRetryTimeout: NodeJS.Timeout | null = null;
const MAX_CONNECTION_RETRIES = 5;
let currentConnectionRetries = 0;
let isConnected = false; // Manual tracking of connection state

const initializeWebSocket = () => {
  if (!POLYGON_API_KEY) {
    throw new Error('Polygon API key is not defined. Set NEXT_PUBLIC_POLYGON_API_KEY in .env.local');
  }
  console.log('[PolygonService] Initializing WebSocket client.');
  return websocketClient(POLYGON_API_KEY).stocks();
};

export const connectPolygonWebSocket = (onUpdate: StockUpdateCallback): void => {
  if (isConnected && polygonStockWS) {
    console.log('[PolygonService] WebSocket already connected.');
    updateCallback = onUpdate;
    if (currentSubscriptions.length > 0) {
      sendSubscriptionRequests(currentSubscriptions, true);
    }
    return;
  }

  if (isAttemptingConnection) {
    console.log('[PolygonService] Connection attempt already in progress.');
    updateCallback = onUpdate;
    return;
  }

  isAttemptingConnection = true;
  currentConnectionRetries = 0;
  if (connectionRetryTimeout) clearTimeout(connectionRetryTimeout);
  
  console.log('[PolygonService] Attempting to connect WebSocket...');
  updateCallback = onUpdate;
  
  polygonStockWS = initializeWebSocket();

  polygonStockWS.onopen = () => {
    isConnected = true;
    isAttemptingConnection = false;
    currentConnectionRetries = 0;
    console.log('[PolygonService] WebSocket connected.');
    console.log('[PolygonService] Authenticated (implicitly by client library).');

    if (currentSubscriptions.length > 0) {
      console.log('[PolygonService] Re-applying subscriptions after (re)connect.');
      sendSubscriptionRequests(currentSubscriptions, true);
    }
  };

  polygonStockWS.onmessage = (event: MessageEvent) => {
    try {
      const messages = JSON.parse(event.data as string);
      (messages as Array<any>).forEach(msg => {
        let stockData: RealTimeStockData | null = null;
        if (msg.ev === 'status') {
          console.log(`[PolygonService] Status message: ${msg.status} - ${msg.message}`);
          if (msg.status === 'auth_success') {
            console.log('[PolygonService] Explicit authentication successful.');
          }
          return;
        }
        
        if (msg.ev === 'T') { 
          const trade = msg as PolygonStockTrade;
          stockData = {
            symbol: trade.sym,
            price: trade.p,
            timestamp: trade.t,
            volume: trade.s,
            last_trade: trade
          };
        } else if (msg.ev === 'AM' || msg.ev === 'A') { 
          const agg = msg as PolygonStockAggregate;
          stockData = {
            symbol: agg.sym,
            price: agg.c, 
            timestamp: agg.e, 
            volume: agg.v,
            vwap: agg.vw,
            aggregate: agg
          };
        }

        if (stockData && updateCallback) {
          updateCallback(stockData);
        }
      });
    } catch (error) {
      console.error('[PolygonService] Error processing WebSocket message:', error, "Raw data:", event.data);
    }
  };

  polygonStockWS.onclose = (event: CloseEvent) => {
    isConnected = false;
    isAttemptingConnection = false;
    const reasonStr = event.reason || 'N/A';
    console.log(`[PolygonService] WebSocket disconnected. Code: ${event.code}, Reason: ${reasonStr}`);
    
    if (event.code !== 1000 && currentConnectionRetries < MAX_CONNECTION_RETRIES) {
      currentConnectionRetries++;
      const delay = Math.pow(2, currentConnectionRetries) * 1000;
      console.log(`[PolygonService] Attempting to reconnect in ${delay / 1000}s (attempt ${currentConnectionRetries}/${MAX_CONNECTION_RETRIES})`);
      if (connectionRetryTimeout) clearTimeout(connectionRetryTimeout);
      connectionRetryTimeout = setTimeout(() => {
        if (updateCallback) { 
          console.log('[PolygonService] Retrying connection...');
          connectPolygonWebSocket(updateCallback);
        }
      }, delay);
    } else if (event.code !== 1000) {
      console.error('[PolygonService] Max reconnection attempts reached or normal closure not handled for retry.');
    }
  };

  polygonStockWS.onerror = (error: Event) => {
    console.error('[PolygonService] WebSocket error:', error);
  };

  console.log('[PolygonService] WebSocket event handlers set up. Connection managed by client library.');
};

const sendSubscriptionRequests = (tickersToSubscribe: string[], forceResubscribe: boolean = false) => {
  if (!polygonStockWS || !isConnected) {
    console.warn('[PolygonService] WebSocket not connected. Cannot send subscription requests.');
    currentSubscriptions = Array.from(new Set([...currentSubscriptions, ...tickersToSubscribe]));
    return;
  }

  const newTickerSymbols = forceResubscribe ? tickersToSubscribe : tickersToSubscribe.filter(t => !currentSubscriptions.includes(t));
  if (newTickerSymbols.length === 0 && !forceResubscribe) {
    console.log('[PolygonService] All requested tickers already in desired subscription list or actively subscribed.');
    return;
  }

  const subscriptionsToSend: string[] = [];
  newTickerSymbols.forEach(ticker => {
    subscriptionsToSend.push(`T.${ticker}`);
    subscriptionsToSend.push(`AM.${ticker}`);
  });
  
  const finalRawSubscriptions = forceResubscribe
    ? subscriptionsToSend
    : subscriptionsToSend.filter(sub => !activeRawSubscriptions.includes(sub));

  if (finalRawSubscriptions.length === 0) {
    console.log('[PolygonService] No new raw subscriptions needed for tickers:', newTickerSymbols);
    currentSubscriptions = Array.from(new Set([...currentSubscriptions, ...newTickerSymbols]));
    return;
  }

  const subscribeMsg = JSON.stringify({
    action: 'subscribe',
    params: finalRawSubscriptions.join(','),
  });

  console.log('[PolygonService] Sending subscribe message:', subscribeMsg);
  polygonStockWS.send(subscribeMsg);
  currentSubscriptions = Array.from(new Set([...currentSubscriptions, ...newTickerSymbols]));
  activeRawSubscriptions = Array.from(new Set([...activeRawSubscriptions, ...finalRawSubscriptions]));
  console.log('[PolygonService] Desired subscriptions (tickers):', currentSubscriptions);
  console.log('[PolygonService] Active raw subscriptions:', activeRawSubscriptions);
};

export const subscribeToTickers = (tickers: string[], forceResubscribe: boolean = false): void => {
  const uniqueNewTickers = tickers.filter(t => !currentSubscriptions.includes(t));
  currentSubscriptions = Array.from(new Set([...currentSubscriptions, ...tickers]));
  
  if (!polygonStockWS || !isConnected) {
    console.warn('[PolygonService] WebSocket not connected. Queuing subscriptions for:', tickers);
    if (!isAttemptingConnection && updateCallback) {
        console.log('[PolygonService] Attempting to connect to fulfill queued subscriptions.');
        connectPolygonWebSocket(updateCallback);
    } else if (!updateCallback) {
        console.warn('[PolygonService] Cannot connect for queued subscriptions: updateCallback is not set.');
    }
    return;
  }
  sendSubscriptionRequests(tickers, forceResubscribe);
};

const sendUnsubscribeRequests = (tickersToUnsubscribe: string[]) => {
  if (!polygonStockWS || !isConnected) {
    console.warn('[PolygonService] WebSocket not connected. Cannot send unsubscribe requests.');
    currentSubscriptions = currentSubscriptions.filter(sub => !tickersToUnsubscribe.includes(sub));
    activeRawSubscriptions = activeRawSubscriptions.filter(sub => !tickersToUnsubscribe.some(ticker => sub.endsWith(`.${ticker}`)));
    return;
  }

  const rawSubscriptionsToCancel: string[] = [];
  tickersToUnsubscribe.forEach(ticker => {
    rawSubscriptionsToCancel.push(`T.${ticker}`);
    rawSubscriptionsToCancel.push(`AM.${ticker}`);
  });

  const finalRawUnsubscriptions = rawSubscriptionsToCancel.filter(sub => activeRawSubscriptions.includes(sub));

  if (finalRawUnsubscriptions.length === 0) {
    console.log('[PolygonService] No active subscriptions to remove for tickers:', tickersToUnsubscribe);
    currentSubscriptions = currentSubscriptions.filter(sub => !tickersToUnsubscribe.includes(sub));
    return;
  }

  const unsubscribeMsg = JSON.stringify({
    action: 'unsubscribe',
    params: finalRawUnsubscriptions.join(','),
  });

  console.log('[PolygonService] Sending unsubscribe message:', unsubscribeMsg);
  polygonStockWS.send(unsubscribeMsg);
  currentSubscriptions = currentSubscriptions.filter(sub => !tickersToUnsubscribe.includes(sub));
  activeRawSubscriptions = activeRawSubscriptions.filter(sub => !finalRawUnsubscriptions.includes(sub));
  console.log('[PolygonService] Desired subscriptions (tickers) after unsubscribe:', currentSubscriptions);
  console.log('[PolygonService] Active raw subscriptions after unsubscribe:', activeRawSubscriptions);
};

export const unsubscribeFromTickers = (tickers: string[]): void => {
  currentSubscriptions = currentSubscriptions.filter(sub => !tickers.includes(sub));
  
  if (!polygonStockWS || !isConnected) {
    console.warn('[PolygonService] WebSocket not connected. Removing from desired subscriptions:', tickers);
    activeRawSubscriptions = activeRawSubscriptions.filter(sub => !tickers.some(ticker => sub.endsWith(`.${ticker}`)));
    return;
  }
  sendUnsubscribeRequests(tickers);
};

export const disconnectPolygonWebSocket = (): void => {
  if (connectionRetryTimeout) clearTimeout(connectionRetryTimeout);
  currentConnectionRetries = MAX_CONNECTION_RETRIES; 
  isAttemptingConnection = false;

  if (polygonStockWS) {
    console.log('[PolygonService] Disconnecting WebSocket manually.');
    if (isConnected && activeRawSubscriptions.length > 0) {
        console.log('[PolygonService] Unsubscribing from all active feeds before disconnect:', activeRawSubscriptions);
        const unsubscribeAllMsg = JSON.stringify({
          action: 'unsubscribe',
          params: activeRawSubscriptions.join(','),
        });
        try {
          polygonStockWS.send(unsubscribeAllMsg);
        } catch (e) {
          console.error("[PolygonService] Error sending unsubscribe message during disconnect:", e);
        }
    }
    if (typeof polygonStockWS.close === 'function') {
      polygonStockWS.close(1000, 'Manual disconnect');
    }
    polygonStockWS = null;
  }
  isConnected = false;
  currentSubscriptions = [];
  activeRawSubscriptions = [];
  console.log('[PolygonService] WebSocket disconnect requested and cleaned up.');
};

// Interface for historical aggregate bars from Polygon REST API
export interface PolygonAggregateBar {
  o: number;       // Open price
  h: number;       // High price
  l: number;       // Low price
  c: number;       // Close price
  v: number;       // Volume
  vw?: number;      // Volume weighted average price
  t: number;       // Timestamp (Unix ms)
  n?: number;      // Number of transactions
}

// Interface for options for fetching aggregates
export interface PolygonAggregatesOptions {
  adjusted?: boolean;
  sort?: 'asc' | 'desc';
  limit?: number;
}

// Internal type for Polygon client options, which expects string booleans
interface PolygonClientAggsQuery {
    adjusted?: "true" | "false";
    sort?: 'asc' | 'desc';
    limit?: number;
    // Add any other options from IAggsQuery if needed, ensuring types match client expectations
}

// REST API client instance (can be initialized once)
let polygonRESTClient: ReturnType<typeof restClient> | null = null;
const getRESTClient = () => {
  if (!POLYGON_API_KEY) {
    console.error('[PolygonService] REST Client: Polygon API key is not defined.');
    throw new Error('Polygon API key is not defined. Set NEXT_PUBLIC_POLYGON_API_KEY in .env.local');
  }
  if (!polygonRESTClient) {
    console.log('[PolygonService] Initializing REST client.');
    polygonRESTClient = restClient(POLYGON_API_KEY);
  }
  return polygonRESTClient;
};

export const fetchPolygonAggregates = async (
  ticker: string,
  multiplier: number,
  timespan: string, // e.g., 'day', 'hour', 'minute'
  from: string,     // YYYY-MM-DD
  to: string,       // YYYY-MM-DD
  options?: PolygonAggregatesOptions 
): Promise<PolygonAggregateBar[]> => {
  const client = getRESTClient();
  const { adjusted = true, sort = 'asc', limit = 5000 } = options || {}; // Default limit, Polygon max is 50000, but 5000 is plenty for charts.

  const query: PolygonClientAggsQuery = {
    adjusted: adjusted ? "true" : "false",
    sort,
    limit,
  };

  try {
    console.log(`[PolygonService] Fetching aggregates for ${ticker} from ${from} to ${to} with options:`, query);
    // The Polygon client's `aggregates` method expects the options as the last argument.
    // The type casting to `any` was a workaround for IAggsOptions issues.
    // Let's ensure the response structure is what we expect and handle status explicitly.
    const response: any = await client.stocks.aggregates(
      ticker,
      multiplier,
      timespan,
      from,
      to,
      query as any // Keep 'as any' for now if type issues persist with IAggsOptions
    );

    console.log(`[PolygonService] Aggregates response for ${ticker}:`, response);

    if (response.status === 'OK' || response.status === 'DELAYED') {
      if (response.resultsCount === 0 || !response.results) {
        console.warn(`[PolygonService] No aggregate data found for ${ticker} in the given range, even though status was ${response.status}.`);
        return []; // No data or empty results
      }
      // If status is DELAYED, log it but proceed as data is still valid
      if (response.status === 'DELAYED') {
        console.warn(`[PolygonService] Data for ${ticker} is DELAYED. Chart will use delayed data.`);
      }
      return response.results as PolygonAggregateBar[];
    } else {
      // Handle other non-OK statuses as errors
      const errorMessage = response.message || `Polygon API Error: ${response.status || 'Unknown Error'}`;
      console.error(`[PolygonService] Error fetching aggregates for ${ticker}: ${errorMessage}`, response);
      throw new Error(errorMessage);
    }

  } catch (error: any) {
    console.error(`[PolygonService] Exception during fetchPolygonAggregates for ${ticker}:`, error);
    // Rethrow a consistent error message
    throw new Error(error.message || `Failed to fetch historical data for ${ticker}.`);
  }
};

// Add a function to fetch Ticker Details as well, might be useful
export interface PolygonTickerDetails {
    active: boolean;
    address?: {
        address1?: string;
        city?: string;
        postal_code?: string;
        state?: string;
    };
    branding?: {
        icon_url?: string;
        logo_url?: string;
    };
    cik?: string;
    composite_figi?: string;
    currency_name?: string;
    description?: string;
    homepage_url?: string;
    list_date?: string;
    locale: string;
    market: string;
    market_cap?: number;
    name: string;
    phone_number?: string;
    primary_exchange?: string;
    share_class_figi?: string;
    share_class_shares_outstanding?: number;
    sic_code?: string;
    sic_description?: string;
    ticker: string;
    total_employees?: number;
    type?: string;
    weighted_shares_outstanding?: number;
    // Add other fields as needed based on Polygon.io documentation for v3/reference/tickers/{ticker}
}

export const fetchPolygonTickerDetails = async (ticker: string): Promise<PolygonTickerDetails | null> => {
    const client = getRESTClient();
    try {
        console.log(`[PolygonService] Fetching ticker details for ${ticker}`);
        const result = await client.reference.tickerDetails(ticker);

        if (result && result.results) {
            return result.results as PolygonTickerDetails;
        }
        
        if (result && result.status && result.status !== 'OK') {
            console.error(`[PolygonService] Error fetching ticker details for ${ticker}: Status ${result.status}`, result);
            const apiError = (result as any).error || (result as any).message || `Polygon API Error for details: ${result.status}`;
            throw new Error(apiError);
        }
        
        console.warn(`[PolygonService] No ticker details found for ${ticker} or unexpected response structure.`, result);
        return null;
    } catch (error: any) {
        console.error(`[PolygonService] Exception fetching ticker details for ${ticker}:`, error);
        throw new Error(error.message || `An unknown error occurred while fetching ticker details for ${ticker}.`);
    }
}; 