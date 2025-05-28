'use client';

import React from 'react';
import NetWorthSummary from '@/components/dashboard/financial/NetWorthSummary';
import RecentActivity from '@/components/dashboard/financial/RecentActivity';
import OverallFinancialHealth from '@/components/dashboard/financial/OverallFinancialHealth';
import InvestmentPerformance from '@/components/dashboard/financial/InvestmentPerformance';
import { usePortfolioManager, Holding, Transaction } from '@/hooks/usePortfolioManager';
import { useBankingManager, BankAccountType, BankingTransactionType } from '@/hooks/useBankingManager';
import { Skeleton } from '@/components/ui/skeleton';
import { subDays, isAfter } from 'date-fns';

// Helper to format currency consistently
const formatCurrency = (value: number | undefined, compact = false) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  const options: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };
  if (compact) {
    options.notation = 'compact';
    options.minimumFractionDigits = 1;
    options.maximumFractionDigits = 1;
  }
  return new Intl.NumberFormat('en-US', options).format(value);
};

// Placeholder components - will be created in subsequent steps
// const PortfolioOverview = () => (
//   <div className="bg-card p-6 rounded-lg shadow col-span-1 lg:col-span-3">
//     <h2 className="text-xl font-semibold mb-4">Portfolio Overview</h2>
//     <p className="text-muted-foreground">Data will be populated here...</p>
//   </div>
// );

// const RecentActivity = () => (
//   <div className="bg-card p-6 rounded-lg shadow col-span-1 lg:col-span-2">
//     <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
//     <p className="text-muted-foreground">Data will be populated here...</p>
//   </div>
// );

// const OverallFinancialHealth = () => (
//   <div className="bg-card p-6 rounded-lg shadow col-span-1 lg:col-span-3">
//     <h2 className="text-xl font-semibold mb-4">Overall Financial Health</h2>
//     <p className="text-muted-foreground">Data will be populated here...</p>
//   </div>
// );

// const InvestmentPerformance = () => (
//   <div className="bg-card p-6 rounded-lg shadow col-span-1 lg:col-span-2">
//     <h2 className="text-xl font-semibold mb-4">Investment Performance</h2>
//     <p className="text-muted-foreground">Data will be populated here...</p>
//   </div>
// );

export default function FinancialSummaryPage() {
  const {
    portfolio,
    transactions,
    isLoadingPortfolio
  } = usePortfolioManager();

  const {
    bankAccounts,
    bankingTransactions,
    isLoadingBankingData
  } = useBankingManager();

  // Calculate derived data for summary cards
  const holdingsArray = Object.values(portfolio);
  const totalPortfolioValue = holdingsArray.reduce((acc, h) => acc + (h.marketValue || 0), 0);
  const totalCostBasis = holdingsArray.reduce((acc,h)=> acc + (h.totalCost || 0), 0);

  // --- NetWorthSummary Data ---
  const holdingsCount = holdingsArray.length;

  const sortedHoldingsByMarketValue = [...holdingsArray].sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0));
  const topHoldingsSummary = sortedHoldingsByMarketValue.slice(0, 3).map(h => ({
    name: h.symbol,
    portfolioPercentage: totalPortfolioValue > 0 && h.marketValue ? `${((h.marketValue / totalPortfolioValue) * 100).toFixed(1)}%` : '0.0%',
    individualPerformancePercent: h.unrealizedPLPercent
  }));

  // --- RecentActivity Data (Investment Transactions) ---
  const recentInvestmentTransactionsSummary = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)
    .map(tx => {
      const typeDisplay: 'Bought' | 'Sold' = tx.type === 'BUY' ? 'Bought' : 'Sold';
      return {
        id: tx.id,
        type: typeDisplay,
        symbol: tx.symbol,
        date: new Date(tx.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
        amount: tx.quantity * tx.price
      };
    });

  // --- Data for Net Worth Calculation and OverallFinancialHealth ---
  const totalLiquidAssets = bankAccounts
    .filter(acc => acc.type === BankAccountType.CHECKING || acc.type === BankAccountType.SAVINGS)
    .reduce((sum, acc) => sum + acc.currentBalance, 0);

  const totalCreditCardDebt = bankAccounts
    .filter(acc => acc.type === BankAccountType.CREDIT_CARD)
    .reduce((sum, acc) => sum + acc.currentBalance, 0);

  const calculatedNetWorth = totalPortfolioValue + totalLiquidAssets - totalCreditCardDebt;

  const thirtyDaysAgo = subDays(new Date(), 30);
  let inflowLast30Days = 0;
  let outflowLast30Days = 0;
  bankingTransactions.forEach(tx => {
    if (isAfter(new Date(tx.date), thirtyDaysAgo)) {
      if (tx.type === BankingTransactionType.CREDIT) {
        inflowLast30Days += tx.amount;
      } else {
        outflowLast30Days += tx.amount;
      }
    }
  });
  const calculatedMonthlyCashflow = inflowLast30Days - outflowLast30Days;
  const savingsRate = null;

  // --- InvestmentPerformance Data ---
  const portfolioValueForDisplay = totalPortfolioValue;
  const overallPortfolioPL = totalPortfolioValue - totalCostBasis;
  const ytdReturnPercent = totalCostBasis > 0 ? (overallPortfolioPL / totalCostBasis) * 100 : (totalPortfolioValue > 0 ? Infinity : 0) ;

  const topPerformingHolding = [...holdingsArray]
    .filter(h => h.unrealizedPLPercent !== undefined && isFinite(h.unrealizedPLPercent || 0))
    .sort((a, b) => (b.unrealizedPLPercent || 0) - (a.unrealizedPLPercent || 0))[0];
  
  const topPerformingStockSummary = topPerformingHolding ? {
    name: topPerformingHolding.symbol,
    performancePercent: topPerformingHolding.unrealizedPLPercent
  } : null;

  if (isLoadingPortfolio || isLoadingBankingData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[250px] w-full rounded-xl" />
          <Skeleton className="h-[250px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <NetWorthSummary
          netWorth={calculatedNetWorth}
          investmentValue={totalPortfolioValue}
          totalLiquidAssets={totalLiquidAssets}
          totalCreditCardDebt={totalCreditCardDebt}
          holdingsCount={holdingsCount}
          topHoldings={topHoldingsSummary}
        />
        <OverallFinancialHealth
          netWorth={calculatedNetWorth}
          monthlyCashflow={calculatedMonthlyCashflow}
          savingsRate={savingsRate} 
        />
      </div>

      <div className="lg:col-span-2 space-y-6">
        <RecentActivity transactions={recentInvestmentTransactionsSummary} />
        <InvestmentPerformance
          portfolioValue={portfolioValueForDisplay}
          ytdReturnPercent={ytdReturnPercent}
          topPerformingStock={topPerformingStockSummary}
        />
      </div>
    </div>
  );
} 