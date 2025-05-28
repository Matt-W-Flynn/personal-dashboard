'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';

// Helper to format currency
const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

// Helper to format percentage
const formatPercentage = (value: number | undefined | null, addPlusSign = false) => {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) return 'N/A';
    const sign = addPlusSign && value > 0 ? '+' : value < 0 ? '-' : '';
    return `${sign}${Math.abs(value).toFixed(2)}%`; // Using toFixed(2) for more precision in performance
};

interface TopPerformingStockSummary {
    name: string;
    performancePercent: number | undefined;
}

interface InvestmentPerformanceProps {
  portfolioValue: number | null;
  ytdReturnPercent: number | null;
  topPerformingStock: TopPerformingStockSummary | null;
}

const InvestmentPerformance: React.FC<InvestmentPerformanceProps> = ({
  portfolioValue,
  ytdReturnPercent,
  topPerformingStock
}) => {

  // Define metrics based on props
  const performanceMetrics = [
    {
      id: 'portfolioValue',
      label: 'Portfolio Value',
      valueDisplay: formatCurrency(portfolioValue),
      changePercentage: ytdReturnPercent, // Using YTD as the change for portfolio value, as per image context
      changeDirection: ytdReturnPercent === null ? 'neutral' : ytdReturnPercent > 0 ? 'up' : ytdReturnPercent < 0 ? 'down' : 'neutral',
    },
    {
      id: 'ytdReturn',
      label: 'YTD Return',
      valueDisplay: formatPercentage(ytdReturnPercent),
      // No separate change % for YTD itself in this card's design, it *is* the change metric.
      // Displaying 0% with neutral icon if data is not available or truly zero.
      changePercentage: ytdReturnPercent === null ? 0 : (isFinite(ytdReturnPercent) ? ytdReturnPercent : 0), // Use 0 for icon if NaN/Infinity
      changeDirection: ytdReturnPercent === null || !isFinite(ytdReturnPercent) ? 'neutral' : ytdReturnPercent > 0 ? 'up' : ytdReturnPercent < 0 ? 'down' : 'neutral',
    },
    {
      id: 'topPerformingStock',
      label: 'Top Performing Stock',
      valueDisplay: topPerformingStock ? topPerformingStock.name : 'N/A',
      changePercentage: topPerformingStock?.performancePercent,
      changeDirection: topPerformingStock?.performancePercent === undefined || topPerformingStock?.performancePercent === null ? 'neutral' :
                       (topPerformingStock.performancePercent > 0 ? 'up' : topPerformingStock.performancePercent < 0 ? 'down' : 'neutral'),
    },
  ];

  return (
    <Card className="bg-card text-card-foreground shadow-lg rounded-xl col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Investment Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {performanceMetrics.map((metric) => {
            let ChangeIcon = MinusIcon;
            let changeColor = 'text-muted-foreground';

            if (metric.changeDirection === 'up') {
              ChangeIcon = ArrowUpIcon;
              changeColor = 'text-brand-green';
            } else if (metric.changeDirection === 'down') {
              ChangeIcon = ArrowDownIcon;
              changeColor = 'text-brand-coral';
            }

            return (
              <div key={metric.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-semibold">{metric.valueDisplay}</p>
                </div>
                {(() => {
                  // Guard against undefined or null for changePercentage before using in logic
                  const changeVal = metric.changePercentage;
                  if (changeVal === undefined || changeVal === null || !isFinite(changeVal)) {
                    // For YTD Return, if value is N/A or 0, show neutral icon and 0.00%
                    if (metric.id === 'ytdReturn') {
                      return (
                        <div className={`flex items-center text-xs font-medium ${changeColor}`}>
                          <ChangeIcon size={14} className="mr-1" />
                          <span>0.00%</span>
                        </div>
                      );
                    }
                    return null; // No percentage/icon for other metrics if data is invalid/absent
                  }

                  // Special handling for YTD display when very close to zero
                  if (metric.id === 'ytdReturn' && Math.abs(changeVal) < 0.005) {
                    return (
                      <div className={`flex items-center text-xs font-medium ${changeColor}`}>
                        {/* No icon for very small YTD, just the percentage */}
                        <span>{changeVal === 0 ? '0.00%' : formatPercentage(changeVal, changeVal > 0)}</span>
                      </div>
                    );
                  }

                  // Default display for other cases
                  return (
                    <div className={`flex items-center text-xs font-medium ${changeColor}`}>
                      <ChangeIcon size={14} className="mr-1" />
                      <span>{formatPercentage(changeVal)}</span>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentPerformance; 