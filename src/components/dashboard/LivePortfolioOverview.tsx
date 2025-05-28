'use client';

import React, { useState, useEffect } from 'react';
import { Holding } from '@/hooks/usePortfolioManager'; // Import Holding type
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area"; // For scrollable table
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { fetchPolygonAggregates, PolygonAggregateBar } from '@/lib/polygon';
import { format, subDays, isValid, subMonths, subYears, startOfYear } from 'date-fns';

interface LivePortfolioOverviewProps {
  portfolio: Record<string, Holding>;
  onSelectStock: (symbol: string) => void;
  isLoading: boolean; // To show loading state while initial portfolio is being calculated
}

const formatCurrency = (value: number | undefined, addPlusSign = false, compact = false) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  const prefix = addPlusSign && value > 0 ? '+' : '';
  const options: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };
  if (compact) {
    options.notation = 'compact';
    options.minimumFractionDigits = 1;
    options.maximumFractionDigits = 1;
  }
  return prefix + new Intl.NumberFormat('en-US', options).format(value);
};

const formatPercentage = (value: number | undefined) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return `${value.toFixed(2)}%`;
};

interface PortfolioHistoryPoint {
  date: string;
  value: number;
}

const TIME_PERIOD_OPTIONS = [
  { value: '1M', label: '1 Month' },
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
  { value: 'YTD', label: 'Year to Date' },
  { value: '1Y', label: '1 Year' },
];

const LivePortfolioOverview: React.FC<LivePortfolioOverviewProps> = ({ portfolio, onSelectStock, isLoading }) => {
  const holdingsArray = Object.values(portfolio);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('1M'); // Default to 1 Month

  const totalMarketValue = holdingsArray.reduce((acc, h) => acc + (h.marketValue || 0), 0);
  const totalCostBasis = holdingsArray.reduce((acc, h) => acc + (h.totalCost || 0), 0);
  const totalUnrealizedPL = totalMarketValue - totalCostBasis;
  const totalUnrealizedPLPercent = totalCostBasis > 0 ? (totalUnrealizedPL / totalCostBasis) * 100 : (totalMarketValue > 0 ? Infinity : 0);

  useEffect(() => {
    const fetchPortfolioHistoryData = async () => {
      if (isLoading || holdingsArray.length === 0) {
        setPortfolioHistory([]); // Clear history if portfolio is loading or empty
        if (!isLoading) console.log('[LivePortfolioOverview] Portfolio empty or main data loading, clearing history.');
        return;
      }

      console.log(`[LivePortfolioOverview] Starting to fetch portfolio history data for ${selectedTimePeriod}.`);
      setIsHistoryLoading(true);
      setHistoryError(null);

      const toDate = subDays(new Date(), 1); // Yesterday, or most recent available day
      let fromDate;
      switch (selectedTimePeriod) {
        case '3M':
          fromDate = subMonths(toDate, 3);
          break;
        case '6M':
          fromDate = subMonths(toDate, 6);
          break;
        case 'YTD':
          fromDate = startOfYear(new Date()); // Use current date for YTD start of year
          break;
        case '1Y':
          fromDate = subYears(toDate, 1);
          break;
        case '1M':
        default:
          fromDate = subDays(toDate, 29); // Default to 1 month (approx 30 days)
          break;
      }

      const toDateStr = format(toDate, 'yyyy-MM-dd');
      const fromDateStr = format(fromDate, 'yyyy-MM-dd');
      console.log(`[LivePortfolioOverview] Date range for history (${selectedTimePeriod}): ${fromDateStr} to ${toDateStr}`);
      
      const dailyPortfolioValues: Record<string, number> = {};
      let anErrorOccurredFetchingStockData = false;
      let rawDataFoundForAtLeastOneStock = false;

      try {
        // Fetch data sequentially instead of Promise.all()
        for (const holding of holdingsArray) {
          if (holding.quantity <= 0) {
            console.log(`[LivePortfolioOverview] Skipping ${holding.symbol}, quantity is 0.`);
            continue; // Use continue to skip to the next iteration
          }
          console.log(`[LivePortfolioOverview] Fetching history for ${holding.symbol} (Qty: ${holding.quantity}) for period ${selectedTimePeriod}`);
          try {
            const aggregates = await fetchPolygonAggregates(
              holding.symbol,
              1,
              'day',
              fromDateStr,
              toDateStr
            );
            console.log(`[LivePortfolioOverview] Raw aggregates for ${holding.symbol}:`, aggregates);
            if (aggregates && aggregates.length > 0) {
              rawDataFoundForAtLeastOneStock = true;
              aggregates.forEach(bar => {
                const barDate = new Date(bar.t);
                if (isValid(barDate)) {
                    const dateKey = format(barDate, 'yyyy-MM-dd');
                    const dayValue = bar.c * holding.quantity;
                    dailyPortfolioValues[dateKey] = (dailyPortfolioValues[dateKey] || 0) + dayValue;
                } else {
                    console.warn(`[LivePortfolioOverview] Invalid date timestamp ${bar.t} for ${holding.symbol}`);
                }
              });
            } else {
                console.log(`[LivePortfolioOverview] No aggregates returned for ${holding.symbol} for the period ${selectedTimePeriod}.`);
            }
          } catch (stockError: any) { // Added :any to stockError for now
            console.error(`[LivePortfolioOverview] Error fetching history for ${holding.symbol}:`, stockError);
            // Set specific error message if it's a 429
            if (stockError?.response?.status === 429 || stockError?.message?.includes('429')) {
                 setHistoryError(`Rate limit hit for ${holding.symbol}. Data may be incomplete.`);
                 // Optionally, we could stop further fetches here if a 429 occurs
            }
            anErrorOccurredFetchingStockData = true;
          }
          // Optional: Add a small delay between API calls if needed, e.g., await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
        }
        // Removed Promise.all(promises);

        console.log('[LivePortfolioOverview] Aggregated daily portfolio values (before sort): ', dailyPortfolioValues);

        const historyPoints: PortfolioHistoryPoint[] = Object.entries(dailyPortfolioValues)
          .map(([date, value]) => ({ date, value }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        console.log('[LivePortfolioOverview] Processed history points: ', historyPoints);
        setPortfolioHistory(historyPoints);

        if (historyPoints.length === 0) {
            if (anErrorOccurredFetchingStockData && !historyError) { // if not already set by 429
                setHistoryError('Failed to fetch data for some holdings. Check console.');
            } else if (rawDataFoundForAtLeastOneStock) {
                setHistoryError('Processed data resulted in no chartable points. Check console.');
            } else if (!anErrorOccurredFetchingStockData) {
                setHistoryError(`No historical data found for holdings in the ${selectedTimePeriod} period.`);
            }
        }

      } catch (error) {
        console.error("[LivePortfolioOverview] Broader error calculating portfolio history:", error);
        setHistoryError('An unexpected error occurred. Check console.');
        setPortfolioHistory([]);
      }
      setIsHistoryLoading(false);
      console.log('[LivePortfolioOverview] Finished fetching portfolio history data.');
    };

    fetchPortfolioHistoryData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolio, isLoading, selectedTimePeriod]); // Added selectedTimePeriod to dependencies

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Live Portfolio</CardTitle>
                <CardDescription>Calculating your current positions and market values...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2 mb-4"></div>
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div> {/* Placeholder for chart */}
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div> {/* Placeholder for table */}
            </CardContent>
        </Card>
    );
  }
  
  if (holdingsArray.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Live Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No holdings found. Please add transactions using the "Manage Transactions" section.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentPeriodLabel = TIME_PERIOD_OPTIONS.find(opt => opt.value === selectedTimePeriod)?.label || selectedTimePeriod;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
            <CardTitle>My Live Portfolio</CardTitle>
            <div className="w-32">
                 <Select value={selectedTimePeriod} onValueChange={setSelectedTimePeriod}>
                    <SelectTrigger id="time-period-select" aria-label="Select time period for chart">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        {TIME_PERIOD_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm mt-2 mb-4">
            <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="font-semibold text-lg">{formatCurrency(totalMarketValue)}</p>
            </div>
            <div>
                <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                <p className={`font-semibold text-lg ${totalUnrealizedPL >= 0 ? 'text-brand-green' : 'text-brand-coral'}`}>
                    {formatCurrency(totalUnrealizedPL, true)} ({formatPercentage(totalUnrealizedPLPercent)})
                </p>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Historical Chart Section */}
        <div className="mb-6 h-64"> {/* Fixed height for chart area */}
          {isHistoryLoading && <div className="flex items-center justify-center h-full text-muted-foreground">Loading {currentPeriodLabel} Performance Chart...</div>}
          {!isHistoryLoading && historyError && 
            <div className="flex items-center justify-center h-full text-red-500 px-4 text-center">
              Chart Error: {historyError}
            </div>
          }
          {!isHistoryLoading && !historyError && portfolioHistory.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(tick) => format(new Date(tick + 'T00:00:00'), 'MMM dd')} // Ensure date is parsed correctly
                  fontSize={12} 
                  tickMargin={5}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value, false, true)} 
                  fontSize={12}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
                  labelFormatter={(label: string) => format(new Date(label + 'T00:00:00'), 'MMM dd, yyyy')}
                />
                <Legend verticalAlign="top" height={30} />
                <Area type="monotone" dataKey="value" name={`Portfolio Value (${currentPeriodLabel})`} stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" dot={{r:1}} activeDot={{r:4}} />
              </AreaChart>
            </ResponsiveContainer>
          )}
           {!isHistoryLoading && !historyError && portfolioHistory.length === 0 && holdingsArray.length > 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground px-4 text-center">
              No chart data available for the selected period ({currentPeriodLabel}). Ensure Polygon API key is active and data exists for your holdings.
            </div>
          )}
        </div>

        {holdingsArray.length === 0 && !isLoading && (
           <p className="text-sm text-muted-foreground py-4 text-center">
            No holdings found. Please add transactions to see your portfolio.
          </p>
        )}

        {holdingsArray.length > 0 && (
            <ScrollArea className="h-[250px]"> {/* Adjusted height for table */}
            <Table>
                <TableHeader className="sticky top-0 bg-background z-10 dark:bg-gray-850"> {/* Ensuring header sticks */}
                <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg. Cost</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Mkt Value</TableHead>
                    <TableHead className="text-right">Unrealized P&L</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {holdingsArray.sort((a,b) => (b.marketValue || 0) - (a.marketValue || 0)).map((holding) => (
                    <TableRow 
                        key={holding.symbol} 
                        onClick={() => onSelectStock(holding.symbol)} 
                        className="cursor-pointer hover:bg-muted/50"
                    >
                    <TableCell className="font-medium">{holding.symbol}</TableCell>
                    <TableCell className="text-right">{holding.quantity.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: holding.quantity % 1 === 0 ? 0 : 2})}</TableCell>
                    <TableCell className="text-right">{formatCurrency(holding.averageCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(holding.currentPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(holding.marketValue)}</TableCell>
                    <TableCell className={`text-right ${holding.unrealizedPL && holding.unrealizedPL >= 0 ? 'text-brand-green' : 'text-brand-coral'}`}>
                        {formatCurrency(holding.unrealizedPL, true)}
                        <br />
                        <span className="text-xs">({formatPercentage(holding.unrealizedPLPercent)})</span>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LivePortfolioOverview; 