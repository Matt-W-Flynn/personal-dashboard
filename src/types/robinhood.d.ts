export interface PricePoint {
  date: string; // ISO date string
  price?: number;
  value?: number; // Used in portfolio_history
}

export type TimeframeKey = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

export type PriceHistory = {
  [key in TimeframeKey]?: PricePoint[] | number[]; // Can be array of objects or array of numbers
};

export interface StockAnalytics {
  volatility?: number;
  beta?: number;
  dividend_yield?: number;
  pe_ratio?: number;
  "52w_high"?: number;
  "52w_low"?: number;
}

export interface StockHolding {
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  total_return?: number; // Can be calculated or from data
  market_value: number;
  sector: string;
  price_history: PriceHistory;
  analytics?: StockAnalytics;
}

export interface RecentTrade {
  ticker: string;
  type: "buy" | "sell";
  shares: number;
  price: number;
  date: string; // ISO date string
  total: number;
}

export interface WatchlistItem {
  ticker: string;
  name: string;
  price: number;
  change_percent: number;
  analytics?: StockAnalytics; 
}

export interface SectorAllocationItem {
  sector: string;
  percentage: number;
  value: number;
  ytd_return?: number;
}

export interface RiskMetrics {
  portfolio_beta?: number;
  sharpe_ratio?: number;
  alpha?: number;
  r_squared?: number;
  standard_deviation?: number;
  max_drawdown?: number;
}

export interface RobinhoodData {
  portfolio_value: number;
  buying_power: number;
  total_return: number;
  today_return: number;
  holdings: StockHolding[];
  recent_trades?: RecentTrade[];
  watchlist?: WatchlistItem[];
  portfolio_history: PriceHistory;
  sector_allocation?: SectorAllocationItem[];
  risk_metrics?: RiskMetrics;
} 