'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// Input and Button might be used for a different "add" flow later.
// For now, we remove them to simplify, assuming watchlist is pre-populated or managed elsewhere.
// import { Input } from "@/components/ui/input"; 
// import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FinnhubCompanyProfile, fetchCompanyProfile } from '@/lib/finnhub';
// Placeholder for the new component - will create this next
// import WatchlistStockCard from '@/components/dashboard/WatchlistStockCard';

// Helper to format market cap (example) - can be moved to a utils file later if needed
const formatMarketCap = (marketCapInMillions: number): string => {
  if (marketCapInMillions >= 1_000_000) { // e.g., 1,000,000 millions = 1 Trillion
    return `${(marketCapInMillions / 1_000_000).toFixed(1)}T`;
  }
  if (marketCapInMillions >= 1_000) { // e.g., 1,000 millions = 1 Billion
    return `${(marketCapInMillions / 1_000).toFixed(1)}B`;
  }
  return `${marketCapInMillions.toFixed(1)}M`;
};

// Mock WatchlistStockCard for now - this will be moved to its own file
const WatchlistStockCard = ({ stock, onRemove }: { stock: FinnhubCompanyProfile, onRemove: (ticker: string) => void }) => (
  <Card className="shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {stock.logo && (
            <Link href={`/company/${stock.ticker}`} passHref>
                <img src={stock.logo} alt={`${stock.name} logo`} className="h-10 w-10 rounded-full border bg-white cursor-pointer" />
            </Link>
          )}
          <div>
            <Link href={`/company/${stock.ticker}`} passHref>
              <CardTitle className="text-md font-semibold text-gray-800 dark:text-white hover:underline cursor-pointer leading-tight">
                {stock.name} ({stock.ticker})
              </CardTitle>
            </Link>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">{stock.finnhubIndustry}</CardDescription>
          </div>
        </div>
        <button
          onClick={() => stock.ticker && onRemove(stock.ticker)}
          className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 hover:bg-red-100 dark:hover:bg-gray-700 rounded"
          aria-label={`Remove ${stock.ticker} from watchlist`}
        >
          ✕
        </button>
      </div>
    </CardHeader>
    <CardContent className="text-xs space-y-2">
      <p><span className="font-medium text-gray-600 dark:text-gray-300">Market Cap:</span> {stock.marketCapitalization ? formatMarketCap(stock.marketCapitalization) : 'N/A'}</p>
      <p><span className="font-medium text-gray-600 dark:text-gray-300">Exchange:</span> {stock.exchange || 'N/A'}</p>
      {/* Placeholder for chart and other details */}
      <div className="h-24 bg-gray-100 dark:bg-gray-700 rounded mt-2 flex items-center justify-center">
        <span className="text-xs text-gray-400 dark:text-gray-500">[Chart Placeholder]</span>
      </div>
      {/* Additional key points can be added here */}
      <p><span className="font-medium text-gray-600 dark:text-gray-300">Country:</span> {stock.country || 'N/A'}</p>
      <Link href={`/company/${stock.ticker}`} className="text-primary dark:text-primary-light hover:underline text-xs mt-2 inline-block">
        View Details →
      </Link>
    </CardContent>
  </Card>
);


const InvestmentResearchPage = () => {
  const [watchlist, setWatchlist] = useState<FinnhubCompanyProfile[]>([]);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState(true);
  // State for controlling an "Add Stock" input/modal (optional)
  const [showAddStockInput, setShowAddStockInput] = useState(false);
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [addStockLoading, setAddStockLoading] = useState(false);
  const [addStockError, setAddStockError] = useState<string | null>(null);


  // Fetch initial watchlist (e.g., from localStorage or pre-defined list)
  useEffect(() => {
    const loadWatchlist = async () => {
      setIsLoadingWatchlist(true);
      // Attempt to load from localStorage
      const storedWatchlistJSON = localStorage.getItem('stockWatchlist');
      let initialProfiles: FinnhubCompanyProfile[] = [];

      if (storedWatchlistJSON) {
        try {
          const storedTickers = JSON.parse(storedWatchlistJSON) as string[];
          for (const ticker of storedTickers) {
            // Avoid re-fetching if already somehow in state (e.g. HMR)
            if (!watchlist.find(p => p.ticker === ticker)) {
              try {
                const profile = await fetchCompanyProfile(ticker);
                if (profile && profile.ticker) initialProfiles.push(profile);
              } catch (error) {
                console.warn(`Could not load profile for ${ticker} from stored watchlist:`, error);
                // If a profile fails, we just skip it and load the rest
              }
            }
          }
        } catch (error) {
            console.error("Failed to parse watchlist from localStorage", error);
            localStorage.removeItem('stockWatchlist'); // Clear corrupted data
        }
      } else {
        // If nothing in localStorage, load a default set
        const defaultSymbols = ['AAPL', 'MSFT', 'GOOGL']; // Shorter default list
        for (const symbol of defaultSymbols) {
          if (!watchlist.find(p => p.ticker === symbol)) {
            try {
              const profile = await fetchCompanyProfile(symbol);
              if (profile && profile.ticker) initialProfiles.push(profile);
            } catch (error) {
              console.warn(`Could not load default profile for ${symbol}:`, error);
            }
          }
        }
      }
      setWatchlist(prev => {
        const existingTickers = new Set(prev.map(p => p.ticker));
        const newProfiles = initialProfiles.filter(p => p.ticker && !existingTickers.has(p.ticker));
        return [...prev, ...newProfiles];
      });
      setIsLoadingWatchlist(false);
    };

    loadWatchlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Update localStorage when watchlist changes
  useEffect(() => {
    if (!isLoadingWatchlist) { // Only save after initial load to avoid overwriting with empty array
        const tickersToStore = watchlist.map(stock => stock.ticker).filter(Boolean) as string[];
        localStorage.setItem('stockWatchlist', JSON.stringify(tickersToStore));
    }
  }, [watchlist, isLoadingWatchlist]);


  const removeFromWatchlist = (ticker: string) => {
    setWatchlist(currentWatchlist => currentWatchlist.filter(item => item.ticker !== ticker));
  };

  const handleAddStockToWatchlist = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const symbolToAdd = newStockSymbol.trim().toUpperCase();
    if (!symbolToAdd) return;
    if (watchlist.find(item => item.ticker === symbolToAdd)) {
      setAddStockError(`${symbolToAdd} is already in your watchlist.`);
      return;
    }

    setAddStockLoading(true);
    setAddStockError(null);
    try {
      const profile = await fetchCompanyProfile(symbolToAdd);
      if (profile && profile.ticker) {
        setWatchlist(prev => [...prev, profile]);
        setNewStockSymbol(''); // Clear input
        setShowAddStockInput(false); // Hide input field
      } else {
        setAddStockError(`Could not find profile for ${symbolToAdd}.`);
      }
    } catch (err: any) {
      console.error("Failed to add stock to watchlist:", err);
      setAddStockError(err.message || `Failed to fetch data for ${symbolToAdd}.`);
    } finally {
      setAddStockLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Investment Watchlist</h1>
        <div className="flex gap-2 items-center">
          {!showAddStockInput && (
            <button
              onClick={() => {
                setShowAddStockInput(true);
                setAddStockError(null); // Clear previous errors
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors"
            >
              Add Stock +
            </button>
          )}
          {showAddStockInput && (
            <form onSubmit={handleAddStockToWatchlist} className="flex gap-2 items-start">
              <div>
                <input
                  type="text"
                  value={newStockSymbol}
                  onChange={(e) => setNewStockSymbol(e.target.value.toUpperCase())}
                  placeholder="Enter Symbol (e.g. AAPL)"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm dark:bg-gray-700 dark:text-white w-40"
                  disabled={addStockLoading}
                />
                {addStockError && <p className="text-xs text-red-500 mt-1">{addStockError}</p>}
              </div>
              <button
                type="submit"
                disabled={addStockLoading || !newStockSymbol.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm disabled:opacity-50 transition-colors"
              >
                {addStockLoading ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                    setShowAddStockInput(false);
                    setNewStockSymbol('');
                    setAddStockError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md shadow-sm transition-colors"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {isLoadingWatchlist && watchlist.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {[...Array(3)].map((_, i) => ( // Show 3 skeleton loaders
            <Card key={i} className="shadow-lg animate-pulse bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    <div>
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-1"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-1"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mt-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoadingWatchlist && watchlist.length === 0 && (
        <Card className="shadow-lg mt-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-gray-700 dark:text-gray-200">Watchlist is Empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              Your watchlist is currently empty. Click "Add Stock +" to add symbols.
            </p>
          </CardContent>
        </Card>
      )}

      {watchlist.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {watchlist.map(stock => (
            stock.ticker ? (
              <WatchlistStockCard
                key={stock.ticker}
                stock={stock}
                onRemove={removeFromWatchlist}
              />
            ) : null
          ))}
        </div>
      )}
    </div>
  );
};

export default InvestmentResearchPage;