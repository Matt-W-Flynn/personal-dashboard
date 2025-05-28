'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper to format currency
const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

interface ActivityItemSummary {
  id: string;
  type: 'Bought' | 'Sold';
  symbol: string;
  date: string; // Already formatted date string
  amount: number;
}

interface RecentActivityProps {
  transactions: ActivityItemSummary[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ transactions }) => {
  return (
    <Card className="bg-card text-card-foreground shadow-lg rounded-xl col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent transactions.</p>
        ) : (
          <div className="space-y-4">
            {transactions.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{item.type} {item.symbol}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <p className={`text-sm font-medium ${item.type === 'Bought' ? 'text-brand-coral' : 'text-brand-green'}`}>
                  {item.type === 'Bought' ? '-' : '+'}{formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity; 