'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Removed ArrowUpIcon, ArrowDownIcon, MinusIcon as we are not showing change percentages for now.

// Helper to format currency
const formatValue = (value: number | string | undefined | null, isCurrency: boolean = false) => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'number' && isNaN(value)) return 'N/A';
    if (isCurrency && typeof value === 'number') {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (typeof value === 'number') return value.toString(); 
    return value; 
};

interface MetricItemProps {
  label: string;
  value: number | string | null;
  isCurrency?: boolean;
}

interface OverallFinancialHealthProps {
  netWorth: number | null;
  monthlyCashflow: number | null;
  savingsRate: string | null; // e.g., "40.6%" or null
}

const OverallFinancialHealth: React.FC<OverallFinancialHealthProps> = ({
  netWorth,
  monthlyCashflow,
  savingsRate
}) => {
  const metrics: MetricItemProps[] = [
    { label: 'Net Worth', value: netWorth, isCurrency: true },
    { label: 'Monthly Cashflow', value: monthlyCashflow, isCurrency: true },
    { label: 'Savings Rate', value: savingsRate, isCurrency: false }, // Savings rate is typically a percentage string
  ];

  return (
    <Card className="bg-card text-card-foreground shadow-lg rounded-xl col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Overall Financial Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.map((metric) => (
              <div key={metric.label} className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold my-1">{formatValue(metric.value, metric.isCurrency)}</p>
                {/* Change percentage display removed for now */}
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OverallFinancialHealth; 