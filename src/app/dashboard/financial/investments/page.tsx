'use client';

import React, { useState, useEffect } from 'react';
import LivePortfolioOverview from '@/components/dashboard/LivePortfolioOverview';
import TransactionManager from '@/components/dashboard/TransactionManager';
import { StockAnalysis } from '@/components/dashboard/StockAnalysis';
import { usePortfolioManager } from '@/hooks/usePortfolioManager';

export default function InvestmentsPage() {
  const { portfolio, isLoadingPortfolio } = usePortfolioManager();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  useEffect(() => {
    if (!isLoadingPortfolio && !selectedSymbol && portfolio && Object.keys(portfolio).length > 0) {
      const firstSymbol = Object.keys(portfolio).sort((a,b) => a.localeCompare(b))[0];
      setSelectedSymbol(firstSymbol);
    } else if (!isLoadingPortfolio && selectedSymbol && (!portfolio || !portfolio[selectedSymbol])) {
      setSelectedSymbol(null);
    }
  }, [portfolio, selectedSymbol, isLoadingPortfolio]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Financial Investments</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Portfolio Overview & Stock Analysis) */}
        <div className="lg:col-span-2 space-y-6">
          <LivePortfolioOverview 
            portfolio={portfolio} 
            onSelectStock={handleSelectStock} 
            isLoading={isLoadingPortfolio}
          />
          {selectedSymbol && (
            <StockAnalysis symbol={selectedSymbol} />
          )}
          {!selectedSymbol && !isLoadingPortfolio && portfolio && Object.keys(portfolio).length > 0 && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
              <p>Select a stock from your portfolio to see detailed analysis and news.</p>
            </div>
          )}
           {!isLoadingPortfolio && (!portfolio || Object.keys(portfolio).length === 0) && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center text-gray-500 dark:text-gray-400">
              <p>Your portfolio is currently empty or still loading. Add transactions to get started.</p>
            </div>
          )}
        </div>

        {/* Right Column (Transaction Management) */}
        <div className="lg:col-span-1">
          <TransactionManager />
        </div>
      </div>
    </div>
  );
} 