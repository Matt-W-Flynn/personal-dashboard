'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FinnhubCompanyProfile, fetchBasicFinancials, FinnhubBasicFinancials } from '@/lib/finnhub';
import { fetchPolygonAggregates, PolygonAggregateBar } from '@/lib/polygon';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// Helper to format market cap (already in research/page.tsx, ideally move to a shared utils file)
const formatMarketCap = (marketCapInMillions: number): string => {
  if (marketCapInMillions >= 1_000_000) return `${(marketCapInMillions / 1_000_000).toFixed(1)}T`;
  if (marketCapInMillions >= 1_000) return `${(marketCapInMillions / 1_000).toFixed(1)}B`;
  return `${marketCapInMillions.toFixed(1)}M`;
};

interface WatchlistStockCardProps {
  stock: FinnhubCompanyProfile;
  onRemove: (ticker: string) => void;
}

const WatchlistStockCard: React.FC<WatchlistStockCardProps> = ({ stock, onRemove }) => {
  const [chartData, setChartData] = useState<PolygonAggregateBar[] | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [basicFinancials, setBasicFinancials] = useState<FinnhubBasicFinancials | null>(null);
  const [isLoadingFinancials, setIsLoadingFinancials] = useState(true);

  useEffect(() => {
    if (!stock.ticker) return;

    const fetchData = async () => {
      setIsLoadingChart(true);
      setChartError(null);
      try {
        const to = new Date();
        const from = new Date();
        from.setMonth(from.getMonth() - 1); // 1 Month of data

        const aggregates = await fetchPolygonAggregates(
          stock.ticker!,
          1, // multiplier
          'day', // timespan
          from.toISOString().split('T')[0], // from
          to.toISOString().split('T')[0], // to
          {
            adjusted: true, // boolean, will be converted to string "true"/"false" by fetchPolygonAggregates
            sort: 'asc',
            limit: 30
          }
        );

        if (aggregates && aggregates.length > 0) {
          setChartData(aggregates);
        } else {
          setChartData([]); // Ensure chartData is not null if no results or empty
        }
      } catch (error: any) {
        console.error(`Error loading chart data for ${stock.ticker}:`, error);
        setChartError(error.message || 'Failed to load chart data.');
        setChartData([]); // Ensure chartData is not null on error
      } finally {
        setIsLoadingChart(false);
      }
    };

    const loadFinancials = async () => {
      setIsLoadingFinancials(true);
      try {
        const financials = await fetchBasicFinancials(stock.ticker!);
        setBasicFinancials(financials);
      } catch (error) {
        console.error(`Error loading basic financials for ${stock.ticker}:`, error);
        setBasicFinancials(null);
      } finally {
        setIsLoadingFinancials(false);
      }
    };

    fetchData();
    loadFinancials();
  }, [stock.ticker]);

  const getTodaysChange = () => {
    if (!chartData || chartData.length < 2) return { value: null, percentage: null };
    const lastPoint = chartData[chartData.length - 1];
    const previousPoint = chartData[chartData.length - 2]; // Make sure there is a previous point
    if (!lastPoint || !previousPoint) return { value: null, percentage: null };
    const change = lastPoint.c - previousPoint.c;
    const percentageChange = previousPoint.c !== 0 ? (change / previousPoint.c) * 100 : 0;
    return {
        value: change.toFixed(2),
        percentage: percentageChange.toFixed(2)
    }
  };

  const todaysChange = getTodaysChange();

  return (
    <Card className="shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 overflow-hidden">
            {stock.logo && (
              <Link href={`/company/${stock.ticker}`} passHref>
                <img src={stock.logo} alt={`${stock.name} logo`} className="h-10 w-10 rounded-full border bg-white cursor-pointer flex-shrink-0" />
              </Link>
            )}
            <div className="flex-grow overflow-hidden">
              <Link href={`/company/${stock.ticker}`} passHref>
                <CardTitle className="text-md font-semibold text-gray-800 dark:text-white hover:underline cursor-pointer leading-tight truncate" title={stock.name}>{stock.name} ({stock.ticker})</CardTitle>
              </Link>
              <CardDescription className="text-xs text-gray-500 dark:text-gray-400 truncate" title={stock.finnhubIndustry}>{stock.finnhubIndustry}</CardDescription>
            </div>
          </div>
          <button
            onClick={() => stock.ticker && onRemove(stock.ticker)}
            className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 hover:bg-red-100 dark:hover:bg-gray-700 rounded flex-shrink-0 ml-2"
            aria-label={`Remove ${stock.ticker} from watchlist`}
          >
            ✕
          </button>
        </div>
      </CardHeader>
      <CardContent className="text-xs space-y-1 flex-grow flex flex-col justify-between">
        <div> 
          <div className="h-20 mb-2">
            {isLoadingChart && <div className="h-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse flex items-center justify-center"><span className="text-xs text-gray-400">Loading Chart...</span></div>}
            {chartError && <div className="h-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded flex items-center justify-center p-2"><span className="text-xxs text-red-500 dark:text-red-400 text-center">Error: {chartError}</span></div>}
            {!isLoadingChart && !chartError && chartData && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                   <defs>
                    <linearGradient id={`chartColor-${stock.ticker}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={todaysChange.value && parseFloat(todaysChange.value) >= 0 ? "#45836E" : "#FF6B5E"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={todaysChange.value && parseFloat(todaysChange.value) >= 0 ? "#45836E" : "#FF6B5E"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#2A2A2A', border: 'none', borderRadius: '0.375rem', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    itemStyle={{ color: '#F9F9F6' }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                    formatter={(value: number, name: string) => [value.toFixed(2), 'Close']}
                    cursor={{fill: 'rgba(200,200,200,0.1)'}}
                  />
                  <Area type="monotone" dataKey="c" stroke={todaysChange.value && parseFloat(todaysChange.value) >= 0 ? "#45836E" : "#FF6B5E"} fill={`url(#chartColor-${stock.ticker})`} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
             {!isLoadingChart && !chartError && (!chartData || chartData.length === 0) && (
                <div className="h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center"><span className="text-xs text-gray-400">No chart data</span></div>
             )}
          </div>

          {/* Key Details */}
          <div className="space-y-0.5 text-gray-700 dark:text-gray-300">
            <p><span className="font-medium">Mkt Cap:</span> {stock.marketCapitalization ? formatMarketCap(stock.marketCapitalization) : 'N/A'}</p>
            <p><span className="font-medium">P/E:</span> {isLoadingFinancials ? '...' : basicFinancials?.metric?.peExclExtraAnnual?.toFixed(2) || 'N/A'}</p>
            <p><span className="font-medium">Exchange:</span> {stock.exchange?.split(' ')[0] || 'N/A'}</p> {/* Show only first word of exchange */} 
            {todaysChange.value !== null && todaysChange.percentage !== null && (
                <p className={parseFloat(todaysChange.value) >= 0 ? 'text-brand-green' : 'text-brand-coral'}>
                    <span className="font-medium">Change: </span> 
                    {parseFloat(todaysChange.value) >= 0 ? '+' : ''}{todaysChange.value} ({parseFloat(todaysChange.percentage) >=0 ? '+': ''}{todaysChange.percentage}%)
                </p>
            )}
            {!isLoadingFinancials && basicFinancials?.metric && basicFinancials.metric['52WeekHigh'] && basicFinancials.metric['52WeekLow'] && (
                 <p><span className="font-medium">52W H/L:</span> {basicFinancials.metric['52WeekHigh']?.toFixed(1)} / {basicFinancials.metric['52WeekLow']?.toFixed(1)}</p>
            )}
          </div>
        </div>

        <Link href={`/company/${stock.ticker}`} className="text-primary dark:text-primary-light hover:underline text-xs mt-3 inline-block self-start">
          View Details →
        </Link>
      </CardContent>
    </Card>
  );
};

export default WatchlistStockCard; 