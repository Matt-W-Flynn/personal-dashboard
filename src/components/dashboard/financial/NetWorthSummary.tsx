'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed ArrowUp, ArrowDown as we are simplifying and removing overallChangePercent

// Helper to format currency
const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

// Helper to format percentage
const formatPercentage = (value: number | undefined | null, addPlusSign = false) => {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    const sign = addPlusSign && value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${Math.abs(value).toFixed(1)}%`;
};

interface TopHoldingSummary {
  name: string;
  portfolioPercentage: string;
  individualPerformancePercent: number | undefined;
}

interface NetWorthSummaryProps {
  netWorth: number | null;
  investmentValue: number | null;
  totalLiquidAssets: number | null;
  totalCreditCardDebt: number | null;
  holdingsCount: number;
  topHoldings: TopHoldingSummary[];
}

const NetWorthSummary: React.FC<NetWorthSummaryProps> = ({
  netWorth,
  investmentValue,
  totalLiquidAssets,
  totalCreditCardDebt,
  holdingsCount,
  topHoldings
}) => {
  return (
    <Card className="bg-card text-card-foreground shadow-lg rounded-xl col-span-1 lg:col-span-3">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl font-semibold">Net Worth Overview</CardTitle>
                <p className="text-xs text-muted-foreground">{holdingsCount} Investment Holdings</p> 
            </div>
            <div className="text-right">
                <p className="text-3xl font-bold">{formatCurrency(netWorth)}</p>
                {/* Placeholder for alignment if we re-add a change % later */}
                <p className="text-xs text-muted-foreground h-[20px]"> </p> 
            </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column: Breakdown of Net Worth Components */}
          <div className="md:col-span-1 space-y-3 pr-4 border-r border-border/50">
            <div>
              <p className="text-xs text-muted-foreground">Total Investments</p>
              <p className="text-xl font-semibold">{formatCurrency(investmentValue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Cash Assets</p>
              <p className="text-xl font-semibold">{formatCurrency(totalLiquidAssets)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Credit Card Debt</p>
              {/* Display debt as a positive number, it represents an amount owed */}
              <p className="text-xl font-semibold text-brand-coral">{formatCurrency(totalCreditCardDebt)}</p>
            </div>
          </div>

          {/* Right Column: Top Investment Holdings */}
          <div className="md:col-span-2 pl-4">
            <p className="text-xs text-muted-foreground mb-1">Top Investment Holdings</p>
            {topHoldings.length > 0 ? topHoldings.map(holding => (
                <div key={holding.name} className="flex justify-between items-center text-sm mb-1">
                    <span className="font-medium">{holding.name} <span className="text-muted-foreground text-xs">({holding.portfolioPercentage})</span></span>
                    <span className={`${(holding.individualPerformancePercent || 0) >= 0 ? 'text-brand-green' : 'text-brand-coral'}`}>{formatPercentage(holding.individualPerformancePercent, true)}</span>
                </div>
            )) : <p className="text-xs text-muted-foreground">(No investment holdings data)</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetWorthSummary; 