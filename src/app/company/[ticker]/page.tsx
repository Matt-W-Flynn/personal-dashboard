'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FinnhubCompanyProfile, fetchCompanyProfile, 
  FinnhubCompanyNews, fetchCompanyNews,
  fetchCompanyPeers
} from '@/lib/finnhub';
import {
  PolygonAggregateBar, fetchPolygonAggregates, 
  PolygonTickerDetails, fetchPolygonTickerDetails
} from '@/lib/polygon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to format market cap
const formatMarketCap = (marketCapInMillions: number): string => {
  if (marketCapInMillions >= 1_000_000) return `${(marketCapInMillions / 1_000_000).toFixed(1)}T`;
  if (marketCapInMillions >= 1_000) return `${(marketCapInMillions / 1_000).toFixed(1)}B`;
  return `${marketCapInMillions.toFixed(1)}M`;
};

// Helper to format date for chart
const formatDateForChart = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g., "Jan 15"
};

interface ChartDataPoint {
  date: string; // Formatted date string for XAxis
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

interface EnrichedPeerData {
  symbol: string;
  name?: string;
  finnhubIndustry?: string;
  logo?: string; // Added logo for peers
}

const CompanyProfilePage = () => {
  const params = useParams();
  const ticker = params.ticker as string;

  const [profile, setProfile] = useState<FinnhubCompanyProfile | null>(null);
  const [news, setNews] = useState<FinnhubCompanyNews[]>([]);
  const [polygonDetails, setPolygonDetails] = useState<PolygonTickerDetails | null>(null); // For more detailed company info
  const [historicalData, setHistoricalData] = useState<ChartDataPoint[]>([]); 
  const [peers, setPeers] = useState<EnrichedPeerData[]>([]); // Updated to EnrichedPeerData
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(true);
  const [isLoadingPolygonDetails, setIsLoadingPolygonDetails] = useState(true);
  const [isLoadingPeers, setIsLoadingPeers] = useState(true); // Loading state for peers
  const [error, setError] = useState<string | null>(null);

  // Chart time range state
  const [chartTimeRange, setChartTimeRange] = useState('1Y'); // Default to 1 Year

  useEffect(() => {
    if (ticker) {
      const loadPageData = async () => {
        setIsLoadingProfile(true);
        setIsLoadingNews(true);
        setIsLoadingPolygonDetails(true);
        setIsLoadingPeers(true);
        setError(null);
        setProfile(null); 
        setNews([]); 
        setHistoricalData([]);
        setPolygonDetails(null);
        setPeers([]);

        try {
          // Finnhub Profile
          const profileData = await fetchCompanyProfile(ticker.toUpperCase());
          setProfile(profileData);

          // Parallel fetch for other data points
          const [_newsData, _polygonDetailsData, _rawPeersData] = await Promise.all([
            fetchCompanyNews(ticker.toUpperCase(), 30),
            fetchPolygonTickerDetails(ticker.toUpperCase()).catch(e => { console.warn('Polygon details failed:', e.message); return null; }),
            fetchCompanyPeers(ticker.toUpperCase()).catch(e => { console.warn('Fetching peers failed:', e.message); return null; })
          ]);

          setNews(_newsData || []);
          setPolygonDetails(_polygonDetailsData);
          setIsLoadingPolygonDetails(false);

          if (_rawPeersData && Array.isArray(_rawPeersData)) {
            const enrichedPeersPromises = _rawPeersData.map(async (peerSymbol: string) => {
              try {
                const peerProfile = await fetchCompanyProfile(peerSymbol);
                return {
                  symbol: peerSymbol,
                  name: peerProfile?.name,
                  finnhubIndustry: peerProfile?.finnhubIndustry,
                  logo: peerProfile?.logo
                };
              } catch (e) {
                console.warn(`Failed to fetch profile for peer ${peerSymbol}:`, (e as Error).message);
                return { symbol: peerSymbol }; // Return symbol only if profile fetch fails
              }
            });
            const resolvedEnrichedPeers = await Promise.all(enrichedPeersPromises);
            setPeers(resolvedEnrichedPeers.filter(p => p.name)); // Only keep peers where profile was successfully fetched
          } else {
            setPeers([]);
          }
          setIsLoadingPeers(false);

        } catch (err: any) {
          console.error(`Failed to load critical company data for ${ticker}:`, err);
          setError(err.message || 'Failed to load company data.');
          setProfile(null); 
          setNews([]); 
        } finally {
          setIsLoadingProfile(false);
          setIsLoadingNews(false);
          // Historical and PolygonDetails loading handled in their own try/finally
        }
      };
      loadPageData();
    }
  }, [ticker]);

  useEffect(() => {
    // Separate effect for chart data to re-fetch when time range changes
    if (ticker) {
      const loadChartData = async () => {
        setIsLoadingHistorical(true);
        setHistoricalData([]); // Clear previous chart data
        // Clear only chart-related part of the error
        setError(prev => prev?.replace(/\\n?Chart data unavailable(.*?)\\.?/g, '').trim() || null);

        const toDate = new Date();
        const fromDate = new Date();
        let multiplier = 1;
        let timespan = 'day';

        switch (chartTimeRange) {
          case '1M': fromDate.setMonth(toDate.getMonth() - 1); break;
          case '6M': fromDate.setMonth(toDate.getMonth() - 6); break;
          case 'YTD': fromDate.setMonth(0); fromDate.setDate(1); break;
          case '5Y': fromDate.setFullYear(toDate.getFullYear() - 5); break;
          case 'MAX': fromDate.setFullYear(toDate.getFullYear() - 20); break; // Max 20 years for Polygon free tier
          case '1Y': // Default
          default: fromDate.setFullYear(toDate.getFullYear() - 1); break;
        }
        
        // For shorter time ranges like 1M, might want hourly data if available
        // For now, sticking to daily for simplicity with Polygon free tier limits

        const toDateStr = toDate.toISOString().split('T')[0];
        const fromDateStr = fromDate.toISOString().split('T')[0];

        try {
          const aggregates = await fetchPolygonAggregates(
            ticker.toUpperCase(), multiplier, timespan, fromDateStr, toDateStr, { adjusted: true, sort: 'asc' }
          );
          const formattedChartData = aggregates.map(agg => ({
            date: formatDateForChart(agg.t),
            close: agg.c,
            open: agg.o,
            high: agg.h,
            low: agg.l,
            volume: agg.v
          }));
          setHistoricalData(formattedChartData);
        } catch (chartErr: any) {
          console.error(`Failed to load historical chart data for ${ticker} (${chartTimeRange}):`, chartErr.message);
          const chartSpecificError = `Chart data unavailable for ${ticker} (${chartTimeRange})${chartErr.message ? `: ${chartErr.message}` : '.'}`;
          setError(prev => prev ? `${prev}\\n${chartSpecificError}` : chartSpecificError);
        } finally {
          setIsLoadingHistorical(false);
        }
      };
      loadChartData();
    }
  }, [ticker, chartTimeRange]);

  // Combined loading state for initial page skeleton
  const isCriticalLoading = isLoadingProfile;

  if (isCriticalLoading) {
    return <div className="p-6 text-center"><p>Loading company profile...</p></div>;
  }

  if (error && !profile) { // Show main error only if profile also failed
    return <div className="p-6 text-center text-red-500"><p>Error: {error}</p></div>;
  }

  if (!profile) {
    return <div className="p-6 text-center"><p>No company profile data found for {ticker}.</p></div>;
  }

  const companyDescription = polygonDetails?.description || profile?.finnhubIndustry || 'No description available.';

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 bg-brand-background text-brand-text min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard/financial/research" passHref>
            <Button variant="outline" className="text-brand-secondary hover:text-brand-text border-brand-stone/30 hover:border-brand-stone/70">{'<'} Back to Research</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Section */}
          <Card className="shadow-xl bg-brand-surface text-brand-text border-brand-stone/20 rounded-lg overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-6">
              {profile.logo && (
                <img src={profile.logo} alt={`${profile.name} logo`} className="h-20 w-20 rounded-full border-2 border-brand-primary bg-white object-contain shadow-md" />
              )}
              <div className="flex-grow">
                <CardTitle className="text-3xl md:text-4xl font-bold">
                  {profile.name} ({profile.ticker})
                </CardTitle>
                <CardDescription className="text-brand-secondary text-md mt-1">
                  {profile.finnhubIndustry} | {profile.exchange}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 p-6 pt-0 text-sm">
              <div><strong>Country:</strong> {profile.country || 'N/A'}</div>
              <div><strong>Currency:</strong> {profile.currency || 'N/A'}</div>
              <div><strong>Market Cap:</strong> {profile.marketCapitalization ? formatMarketCap(profile.marketCapitalization) : 'N/A'}</div>
              <div><strong>Shares Outstanding:</strong> {profile.shareOutstanding ? (profile.shareOutstanding * 1000000).toLocaleString() : 'N/A'}</div>
              {profile.weburl && <div className="col-span-2 sm:col-span-1"><strong>Website:</strong> <a href={profile.weburl} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline break-all">{profile.weburl}</a></div>}
              {polygonDetails?.list_date && <div><strong>IPO Date:</strong> {new Date(polygonDetails.list_date).toLocaleDateString()}</div>}
              {polygonDetails?.total_employees && <div className="sm:col-span-2"><strong>Employees:</strong> {polygonDetails.total_employees.toLocaleString()}</div>}
              {polygonDetails?.market && <div><strong>Market:</strong> {polygonDetails.market}</div>}
            </CardContent>
          </Card>

          {/* About Section */}
          <Card className="shadow-lg bg-brand-surface text-brand-text border-brand-stone/20 rounded-lg">
            <CardHeader className="p-6"><CardTitle className="text-xl">About {profile.name}</CardTitle></CardHeader>
            <CardContent className="p-6 pt-0">
                {isLoadingPolygonDetails && !polygonDetails && <p className="text-brand-secondary">Loading description...</p>}
                <p className="text-sm leading-relaxed text-brand-text-muted whitespace-pre-line">{companyDescription}</p>
            </CardContent>
          </Card>

          {/* Price Chart Section */}
          <Card className="shadow-lg bg-brand-surface text-brand-text border-brand-stone/20 rounded-lg">
            <CardHeader className="p-6 flex justify-between items-center">
                <CardTitle className="text-xl">Price History</CardTitle>
                <Select value={chartTimeRange} onValueChange={setChartTimeRange}>
                    <SelectTrigger className="w-[100px] bg-brand-surface-alt border-brand-stone/30 hover:border-brand-stone/70">
                        <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-surface border-brand-stone/50 text-brand-text">
                        {['1M', '6M', 'YTD', '1Y', '5Y', 'MAX'].map(range => (
                            <SelectItem key={range} value={range} className="hover:bg-brand-surface-alt focus:bg-brand-surface-alt">
                                {range}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="h-80 md:h-96 p-6 pt-0">
              {isLoadingHistorical && <div className="flex justify-center items-center h-full"><p className="text-brand-secondary">Loading chart data ({chartTimeRange})...</p></div>}
              {!isLoadingHistorical && historicalData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-stone, #A3A3A3) Opacity(0.2)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-brand-secondary)' }} interval="preserveStartEnd" tickFormatter={(val, index) => index % Math.ceil(historicalData.length / 10) === 0 ? val : ''} />
                    <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} tick={{ fontSize: 10, fill: 'var(--color-brand-secondary)' }} domain={['dataMin - dataMin * 0.05', 'dataMax + dataMax * 0.05']} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--color-brand-surface-darker, #262626)', 
                        border: '1px solid var(--color-brand-stone)', 
                        borderRadius: '0.375rem', 
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
                      }} 
                      labelStyle={{ 
                        color: 'var(--color-brand-text, #E0E0E0)', // Ensure label is visible
                        fontWeight: '600', 
                        marginBottom: '0.25rem', 
                        display: 'block'
                      }} 
                      itemStyle={{ 
                        color: 'var(--color-brand-text-muted, #B0B0B0)', // Brighter color for item text
                        padding: '0.1rem 0' // Add a little vertical padding to items if needed
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const formattedValue = `$${value.toFixed(2)}`;
                        const displayName = name === 'close' ? 'Close Price' : name;
                        // You can add more data points here if available in props.payload
                        // For example: Open: ${props.payload.open?.toFixed(2)}, High: ${props.payload.high?.toFixed(2)}, Low: ${props.payload.low?.toFixed(2)}
                        return [formattedValue, displayName];
                      }}
                      labelFormatter={(label) => {
                        // Assuming label is the 'date' string from ChartDataPoint
                        // If you need to find the original full timestamp, you might need to adjust how dates are stored or looked up.
                        // For now, using the formatted date string which should be unique enough for the tooltip.
                        return label;
                      }}
                    />
                    <Line type="monotone" dataKey="close" stroke="var(--color-brand-primary, #4ADE80)" strokeWidth={2.5} dot={false} name="Close Price" activeDot={{ r: 6, fill: 'var(--color-brand-primary)', stroke: 'var(--color-brand-surface)', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {!isLoadingHistorical && historicalData.length === 0 && error && error.includes("Chart data unavailable") && (
                 <div className="flex justify-center items-center h-full"><p className="text-center text-red-500">Error loading chart: {error.substring(error.indexOf("Chart data unavailable"))}</p></div>
              )}
               {!isLoadingHistorical && historicalData.length === 0 && !error && (
                 <div className="flex justify-center items-center h-full"><p className="text-center text-brand-secondary">No historical price data available for {ticker} in the selected range.</p></div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column for Peers */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="shadow-lg bg-brand-surface text-brand-text border-brand-stone/20 rounded-lg">
            <CardHeader className="p-6"><CardTitle className="text-xl">Similar Stocks</CardTitle></CardHeader>
            <CardContent className="p-6 pt-0">
              {isLoadingPeers && (
                <ul className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <li key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5 flex-grow">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!isLoadingPeers && peers.length === 0 && <p className="text-brand-secondary">No similar stocks found.</p>}
              {peers.length > 0 && (
                <ul className="space-y-1">
                  {peers.map(peer => (
                    <li key={peer.symbol}>
                      <Link href={`/company/${peer.symbol}`} passHref>
                        <div className="flex items-center space-x-3 p-2 -mx-2 rounded-md hover:bg-brand-surface-alt cursor-pointer">
                          {peer.logo ? (
                            <img src={peer.logo} alt={`${peer.name} logo`} className="h-8 w-8 rounded-full border border-brand-stone/20 object-contain bg-white" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-brand-stone/10 flex items-center justify-center text-brand-secondary text-xs">
                              {peer.symbol.substring(0,1)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-brand-text group-hover:text-brand-primary truncate" title={peer.name}>{peer.name || peer.symbol}</p>
                            <p className="text-xs text-brand-secondary truncate" title={peer.finnhubIndustry}>{peer.finnhubIndustry || 'N/A'}</p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          
          {/* News Section - Moved to Sidebar */}
          <Card className="shadow-lg bg-brand-surface text-brand-text border-brand-stone/20 rounded-lg">
            <CardHeader className="p-6"><CardTitle className="text-xl">Recent News</CardTitle></CardHeader>
            <CardContent className="p-6 pt-0 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-stone/50 scrollbar-track-brand-surface-alt">
              {isLoadingNews && <p className="text-brand-secondary">Loading news...</p>}
              {!isLoadingNews && news.length === 0 && <p className="text-brand-secondary">No recent news.</p>}
              <ul className="space-y-4">
                {news.map((item) => (
                  <li key={item.id} className="border-b border-brand-stone/20 pb-3 last:border-b-0 last:pb-0">
                    <h3 className="font-semibold text-sm mb-0.5">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary hover:underline line-clamp-2">
                        {item.headline}
                      </a>
                    </h3>
                    <p className="text-xs text-brand-secondary mb-1">
                      {new Date(item.datetime * 1000).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} - {item.source}
                    </p>
                    <p className="text-xs text-brand-text-muted line-clamp-3">{item.summary}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage; 