'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const financialNavItems = [
  { name: 'Summary', href: '/dashboard/financial' },
  { name: 'Investments', href: '/dashboard/financial/investments' },
  { name: 'Banking', href: '/dashboard/financial/banking' },
  { name: 'Research', href: '/dashboard/financial/research' },
];

export default function FinancialLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="p-8 space-y-8 bg-brand-background min-h-screen text-brand-text">
      <div className="flex items-center justify-between border-b border-brand-stone/20 pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Financial Details</h1>
        <div className="text-sm font-medium text-brand-stone bg-brand-text/5 px-3 py-1 rounded-full">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex space-x-4 border-b border-brand-stone/20">
        {financialNavItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-[2px] ${
              pathname === item.href
                ? 'border-brand-green text-brand-text'
                : 'border-transparent text-brand-stone hover:text-brand-text'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      {/* Page Content */}
      <div className="space-y-8">
        {children}
      </div>
    </main>
  );
} 