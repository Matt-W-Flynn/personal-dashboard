'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  fetchQuote, FinnhubQuote,
  fetchCompanyProfile, FinnhubCompanyProfile,
  fetchBasicFinancials, FinnhubBasicFinancials,
  fetchCompanyNews, FinnhubCompanyNews
} from '@/lib/finnhub';
import {
  fetchPolygonAggregates
} from '@/lib/polygon';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';

interface StockAnalysisProps {
  symbol: string | null;
}

const formatDateForChart = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface ChartDataPoint {
  date: string;
  close: number;
}

const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1_000_000_000_000) return `${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  if (marketCap >= 1_000_000_000) return `${(marketCap / 1_000_000_000).toFixed(2)}B`;
  if (marketCap >= 1_000_000) return `${(marketCap / 1_000_000).toFixed(2)}M`;
  return marketCap.toString();
};

const formatNewsDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const StockAnalysis: React.FC<StockAnalysisProps> = ({ symbol }) => {
  const [stockQuote, setStockQuote] = useState<FinnhubQuote | null>(null);
  const [companyProfile, setCompanyProfile] = useState<FinnhubCompanyProfile | null>(null);
  const [stockFinancials, setStockFinancials] = useState<FinnhubBasicFinancials | null>(null);
  const [companyNews, setCompanyNews] = useState<FinnhubCompanyNews[] | null>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [historicalChartData, setHistoricalChartData] = useState<ChartDataPoint[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState('1Y');

  useEffect(() => {
    if (symbol) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        setHistoricalChartData([]);
        setChartError(null);
        setStockQuote(null);
        setCompanyProfile(null);
        setStockFinancials(null);
        setCompanyNews([]);

        console.log(`[StockAnalysis] Fetching data for ${symbol}`);
        try {
          const quoteData = await fetchQuote(symbol);
          setStockQuote(quoteData);

          const profileData = await fetchCompanyProfile(symbol);
          setCompanyProfile(profileData);

          const financialsData = await fetchBasicFinancials(symbol);
          setStockFinancials(financialsData);
          
          const newsData = await fetchCompanyNews(symbol);
          setCompanyNews(newsData);

        } catch (err) {
          console.error(`[StockAnalysis] Error fetching stock data for ${symbol}:`, err);
          setError('Failed to fetch stock data.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else {
      setStockQuote(null);
      setCompanyProfile(null);
      setStockFinancials(null);
      setCompanyNews([]);
      setHistoricalChartData([]);
      setChartError(null);
      setIsLoading(false);
      setError(null);
    }
  }, [symbol]);

  useEffect(() => {
    if (!symbol) {
      setHistoricalChartData([]);
      setChartError(null);
      setIsLoadingChart(false);
      return;
    }

    console.log(`[StockAnalysis] Chart effect triggered for ${symbol} (${chartTimeRange}). Setting up debounce.`);

    const handler = setTimeout(() => {
      const loadChartData = async () => {
        setIsLoadingChart(true);
        setChartError(null);
        setHistoricalChartData([]);
        console.log(`[StockAnalysis] Debounced: Fetching chart data for ${symbol} (${chartTimeRange})`);

        const toDate = new Date();
        let fromDate = new Date();
        let multiplier = 1;
        let timespan = 'day';

        switch (chartTimeRange) {
          case '1M': fromDate.setMonth(toDate.getMonth() - 1); break;
          case '6M': fromDate.setMonth(toDate.getMonth() - 6); break;
          case 'YTD': fromDate.setMonth(0); fromDate.setDate(1); break;
          case '5Y': fromDate.setFullYear(toDate.getFullYear() - 5); break;
          case 'MAX': fromDate.setFullYear(toDate.getFullYear() - 20); break; 
          case '1Y': 
          default: fromDate.setFullYear(toDate.getFullYear() - 1); break;
        }

        const toDateStr = toDate.toISOString().split('T')[0];
        const fromDateStr = fromDate.toISOString().split('T')[0];

        try {
          const aggregates = await fetchPolygonAggregates(
            symbol.toUpperCase(), multiplier, timespan, fromDateStr, toDateStr, { adjusted: true, sort: 'asc' }
          );
          const formattedChartData = aggregates.map(agg => ({
            date: formatDateForChart(agg.t),
            close: agg.c,
          }));
          setHistoricalChartData(formattedChartData);
          if (formattedChartData.length === 0) {
            console.log(`[StockAnalysis] No chart data returned for ${symbol} (${chartTimeRange}) from ${fromDateStr} to ${toDateStr}`);
            setChartError('No historical data found for the selected range.');
          }
        } catch (err: any) {
          console.error(`[StockAnalysis] Failed to load historical chart data for ${symbol} (${chartTimeRange}):`, err.message || err);
          if (err?.response?.status === 429 || err?.message?.includes('429')) {
            setChartError('API rate limit reached. Please try again in a moment.');
          } else {
            setChartError(err.message || 'Failed to load chart data.');
          }
        } finally {
          setIsLoadingChart(false);
        }
      };
      loadChartData();
    }, 500);

    return () => {
      console.log(`[StockAnalysis] Clearing debounce timeout for ${symbol} (${chartTimeRange})`);
      clearTimeout(handler);
    };
  }, [symbol, chartTimeRange]);

  if (!symbol) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-center text-muted-foreground">No stock selected or symbol provided.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent>
          <p className="text-center text-red-500">{error}</p>
          <p className="text-center text-xs text-muted-foreground">Could not load data for {symbol}.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            {companyProfile?.logo && symbol && (
              <Link href={`/company/${symbol}`} passHref>
                <Image src={companyProfile.logo} alt={`${companyProfile.name || symbol} logo`} width={40} height={40} className="rounded-full cursor-pointer border" />
              </Link>
            )}
            <div>
              {symbol && (
                <Link href={`/company/${symbol}`} passHref>
                  <CardTitle className="text-2xl hover:underline cursor-pointer">
                    {companyProfile?.name || 'Loading name...'} ({symbol})
                  </CardTitle>
                </Link>
              )}
              {companyProfile?.weburl && (
                <a href={companyProfile.weburl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                  {companyProfile.weburl.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </CardHeader>
        {stockFinancials?.metric && (
            <CardContent>
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Key Metrics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {stockFinancials.metric.marketCapitalization && <p>Mkt Cap: <span className="font-medium text-gray-800 dark:text-gray-200">{formatMarketCap(stockFinancials.metric.marketCapitalization)}</span></p>}
                    {stockFinancials.metric.peExclExtraAnnual && <p>P/E: <span className="font-medium text-gray-800 dark:text-gray-200">{stockFinancials.metric.peExclExtraAnnual.toFixed(2)}</span></p>}
                    {stockFinancials.metric.dividendYieldIndicatedAnnual !== undefined && <p>Div Yield: <span className="font-medium text-gray-800 dark:text-gray-200">{(stockFinancials.metric.dividendYieldIndicatedAnnual * 100).toFixed(2)}%</span></p>}
                    {stockFinancials.metric['52WeekHigh'] && <p>52W High: <span className="font-medium text-gray-800 dark:text-gray-200">${stockFinancials.metric['52WeekHigh'].toFixed(2)}</span></p>}
                    {stockFinancials.metric['52WeekLow'] && <p>52W Low: <span className="font-medium text-gray-800 dark:text-gray-200">${stockFinancials.metric['52WeekLow'].toFixed(2)}</span></p>}
                    {stockFinancials.metric.beta && <p>Beta: <span className="font-medium text-gray-800 dark:text-gray-200">{stockFinancials.metric.beta.toFixed(2)}</span></p>}
                </div>
            </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Price History</CardTitle>
            <Select value={chartTimeRange} onValueChange={(value) => setChartTimeRange(value)}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                    {['1M', '6M', 'YTD', '1Y', '5Y', 'MAX'].map(range => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </CardHeader>
        <CardContent className="h-[300px] pt-4">
          {isLoadingChart && <Skeleton className="h-full w-full" />}
          {chartError && <p className="text-center text-red-500">{chartError}</p>}
          {!isLoadingChart && !chartError && historicalChartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} tick={{ fontSize: 12 }} domain={['dataMin * 0.95', 'dataMax * 1.05']} />
                <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Close']}
                    labelStyle={{ color: '#333' }}
                    itemStyle={{ color: stockQuote && stockQuote.dp >= 0 ? '#16A34A' : '#DC2626' }} 
                />
                <Line type="monotone" dataKey="close" stroke={stockQuote && stockQuote.dp >= 0 ? "#16A34A" : "#DC2626"} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {!isLoadingChart && !chartError && historicalChartData.length === 0 && (
            <p className="text-center text-muted-foreground h-full flex items-center justify-center">No chart data available for selected range.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent News</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && !companyNews?.length && (
            <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </>
          )}
          {companyNews && companyNews.length > 0 ? (
            companyNews.slice(0, 5).map((newsItem) => (
              <div key={newsItem.id} className="p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-card">
                <a href={newsItem.url} target="_blank" rel="noopener noreferrer">
                  <h3 className="text-md font-semibold hover:text-primary mb-1">{newsItem.headline}</h3>
                </a>
                <p className="text-xs text-muted-foreground mb-1">
                  {newsItem.source} - {formatNewsDate(newsItem.datetime)}
                </p>
                <p className="text-sm text-card-foreground/90 line-clamp-2">{newsItem.summary}</p>
                 {newsItem.related && <p className="text-xs text-muted-foreground mt-1">Related: {newsItem.related}</p>}
              </div>
            ))
          ) : (
            !isLoading && <p className="text-sm text-muted-foreground">No news articles found for {symbol}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
