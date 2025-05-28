'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import FinancialMetrics from '@/components/dashboard/FinancialMetrics'
import HealthMetrics from '@/components/dashboard/HealthMetrics'
import { getFinancialHealthMetrics } from '@/data/financialMetrics'
import mockRobinhoodData from '@/data/mockRobinhood.json'
import mockPlaidData from '@/data/mockPlaid.json'
import { HomeIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  {
    name: 'Financial',
    icon: CurrencyDollarIcon,
    subItems: [
      { name: 'Summary', href: '/dashboard/financial' },
      { name: 'Investments', href: '/dashboard/financial/investments' },
      { name: 'Banking', href: '/dashboard/financial/banking' },
    ],
  },
  { 
    name: 'Health', 
    href: '/dashboard/health',
    dropdownItems: [
      { name: 'Summary', href: '/dashboard/health' },
      { name: 'Fitness', href: '/dashboard/health/fitness' },
      { name: 'Sleep', href: '/dashboard/health/sleep' },
      { name: 'Body', href: '/dashboard/health/body' },
    ]
  },
]

export default function DashboardPage() {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)
  const metricGroups = getFinancialHealthMetrics(mockRobinhoodData, mockPlaidData)

  // Filter to show only the most important metric groups
  const criticalMetrics = metricGroups.filter(group => 
    ['Overall Health', 'Investment Overview', 'Cash Flow'].includes(group.title)
  )

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('.dropdown-container')) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openDropdown])

  return (
    <main className="min-h-screen bg-brand-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-stone/20 pb-6 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="text-sm font-medium text-brand-text/60 bg-brand-stone/20 px-4 py-2 rounded-full">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Navigation */}
        <nav className="mb-8">
          <div className="flex space-x-1 border-b border-brand-stone/20">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <div key={item.name} className="relative dropdown-container">
                  {item.subItems ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenDropdown(openDropdown === item.name ? null : item.name)
                      }}
                      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                        isActive
                          ? 'border-brand-green text-brand-text'
                          : 'border-transparent text-brand-text/60 hover:text-brand-text'
                      }`}
                    >
                      {item.name}
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] block ${
                        isActive
                          ? 'border-brand-green text-brand-text'
                          : 'border-transparent text-brand-text/60 hover:text-brand-text'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )}
                  {item.subItems && openDropdown === item.name && (
                    <div 
                      className="absolute left-0 mt-1 w-48 rounded-xl shadow-lg bg-white py-2 z-10 border border-brand-stone/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.subItems.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.href}
                          href={dropdownItem.href}
                          className="block px-4 py-2 text-sm text-brand-text/80 hover:bg-brand-stone/10 hover:text-brand-text transition-colors"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {dropdownItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Financial Summary</h2>
              <Link 
                href="/dashboard/financial"
                className="text-sm text-brand-green hover:text-brand-green/80 font-medium transition-colors"
              >
                View Details →
              </Link>
            </div>
            
            <div className="space-y-6">
              {/* Financial Metrics */}
              <div className="bg-white rounded-2xl shadow-sm border border-brand-stone/10 p-6">
                <FinancialMetrics metricGroups={criticalMetrics} compact={true} />
              </div>

              {/* Portfolio Performance */}
              <div className="bg-white rounded-2xl shadow-sm border border-brand-stone/10 p-6">
                <h3 className="text-lg font-semibold mb-4">Portfolio Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-text/60">Total Value</span>
                    <span className="text-xl font-bold">
                      ${mockRobinhoodData.portfolio_value.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-text/60">Today's Change</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-semibold ${mockRobinhoodData.today_return >= 0 ? 'text-brand-green' : 'text-brand-coral'}`}>
                        {mockRobinhoodData.today_return >= 0 ? '+' : ''}{mockRobinhoodData.today_return}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-brand-text/60">Total Return</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-semibold ${mockRobinhoodData.total_return >= 0 ? 'text-brand-green' : 'text-brand-coral'}`}>
                        {mockRobinhoodData.total_return >= 0 ? '+' : ''}{mockRobinhoodData.total_return}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Cash Flow */}
              <div className="bg-white rounded-2xl shadow-sm border border-brand-stone/10 p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Cash Flow</h3>
                <div className="space-y-6">
                  {/* Income */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text/60">Monthly Income</span>
                      <span className="text-xl font-bold text-brand-green">
                        ${mockPlaidData.monthly_summary.income.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-brand-stone/10 rounded-full h-2">
                      <div 
                        className="bg-brand-green h-2 rounded-full" 
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text/60">Monthly Expenses</span>
                      <span className="text-xl font-bold text-brand-coral">
                        ${Math.abs(mockPlaidData.monthly_summary.expenses.total).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-brand-stone/10 rounded-full h-2">
                      <div 
                        className="bg-brand-coral h-2 rounded-full" 
                        style={{ 
                          width: `${(Math.abs(mockPlaidData.monthly_summary.expenses.total) / mockPlaidData.monthly_summary.income.total * 100).toFixed(0)}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Net Flow */}
                  <div className="pt-4 border-t border-brand-stone/10">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-text/60">Net Flow</span>
                      <span className={`text-xl font-bold ${
                        mockPlaidData.monthly_summary.income.total - Math.abs(mockPlaidData.monthly_summary.expenses.total) > 0 
                          ? 'text-brand-green' 
                          : 'text-brand-coral'
                      }`}>
                        ${(mockPlaidData.monthly_summary.income.total - Math.abs(mockPlaidData.monthly_summary.expenses.total)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Health Section */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Health Summary</h2>
              <Link 
                href="/dashboard/health"
                className="text-sm text-brand-green hover:text-brand-green/80 font-medium transition-colors"
              >
                View Details →
              </Link>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-brand-stone/10 p-6">
              <HealthMetrics />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
} 