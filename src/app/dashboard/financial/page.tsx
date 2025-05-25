'use client';

import React, { useState } from 'react'
import FinancialMetrics from '@/components/dashboard/FinancialMetrics'
import StockAnalysis from '@/components/dashboard/StockAnalysis'
import PortfolioAnalysis from '@/components/dashboard/PortfolioAnalysis'
import PortfolioSummary from '@/components/dashboard/PortfolioSummary'
import { getFinancialHealthMetrics } from '@/data/financialMetrics'
import mockRobinhoodData from '@/data/mockRobinhood.json'
import mockPlaidData from '@/data/mockPlaid.json'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

// Modern Icon Components
const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const GoalIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 0.875C4.49797 0.875 2.07031 3.30266 2.07031 6.30469C2.07031 9.30672 4.49797 11.7344 7.5 11.7344C10.502 11.7344 12.9297 9.30672 12.9297 6.30469C12.9297 3.30266 10.502 0.875 7.5 0.875ZM7.5 1.85938C9.9575 1.85938 11.9453 3.84719 11.9453 6.30469C11.9453 8.76219 9.9575 10.75 7.5 10.75C5.0425 10.75 3.05469 8.76219 3.05469 6.30469C3.05469 3.84719 5.0425 1.85938 7.5 1.85938ZM7.5 2.84375C5.58547 2.84375 4.03906 4.39016 4.03906 6.30469C4.03906 8.21922 5.58547 9.76562 7.5 9.76562C9.41453 9.76562 10.9609 8.21922 10.9609 6.30469C10.9609 4.39016 9.41453 2.84375 7.5 2.84375ZM7.5 3.82812C8.87281 3.82812 9.97656 4.93188 9.97656 6.30469C9.97656 7.6775 8.87281 8.78125 7.5 8.78125C6.12719 8.78125 5.02344 7.6775 5.02344 6.30469C5.02344 4.93188 6.12719 3.82812 7.5 3.82812ZM7.5 4.8125C6.67141 4.8125 6 5.48391 6 6.3125C6 7.14109 6.67141 7.8125 7.5 7.8125C8.32859 7.8125 9 7.14109 9 6.3125C9 5.48391 8.32859 4.8125 7.5 4.8125Z"
      fill="currentColor"
    />
  </svg>
)

const ArrowUpIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.14645 2.14645C7.34171 1.95118 7.65829 1.95118 7.85355 2.14645L11.8536 6.14645C12.0488 6.34171 12.0488 6.65829 11.8536 6.85355C11.6583 7.04882 11.3417 7.04882 11.1464 6.85355L8 3.70711L8 12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5L7 3.70711L3.85355 6.85355C3.65829 7.04882 3.34171 7.04882 3.14645 6.85355C2.95118 6.65829 2.95118 6.34171 3.14645 6.14645L7.14645 2.14645Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const ArrowDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.5 2C7.77614 2 8 2.22386 8 2.5L8 11.2929L11.1464 8.14645C11.3417 7.95118 11.6583 7.95118 11.8536 8.14645C12.0488 8.34171 12.0488 8.65829 11.8536 8.85355L7.85355 12.8536C7.75979 12.9473 7.63261 13 7.5 13C7.36739 13 7.24021 12.9473 7.14645 12.8536L3.14645 8.85355C2.95118 8.65829 2.95118 8.34171 3.14645 8.14645C3.34171 7.95118 3.65829 7.95118 3.85355 8.14645L7 11.2929L7 2.5C7 2.22386 7.22386 2 7.5 2Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const COLORS = ['#45836E', '#D8D8D0', '#FF6B5E', '#2A2A2A', '#F9F9F6']

interface SectorData {
  sector: string
  percentage: number
  value: number
}

interface Activity {
  id?: string
  ticker?: string
  type?: 'buy' | 'sell' | string
  shares?: number
  price?: number
  date: string
  name?: string
  amount?: number
  category?: string
  total?: number
}

// Add type for expense categories
interface ExpenseCategory {
  category: string;
  amount: number;
}

const timeframeOptions = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const
type Timeframe = typeof timeframeOptions[number]

export default function FinancialPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M')
  const [selectedStock, setSelectedStock] = useState(mockRobinhoodData.holdings[0])
  const [activeSection, setActiveSection] = useState<'overview' | 'investments' | 'banking'>('overview')
  
  const metricGroups = getFinancialHealthMetrics(mockRobinhoodData, mockPlaidData)

  return (
    <main className="p-8 space-y-8 bg-brand-background min-h-screen">
      <div className="flex items-center justify-between border-b border-brand-stone/20 pb-4">
        <h1 className="text-3xl font-bold text-brand-text tracking-tight">Financial Details</h1>
        <div className="text-sm font-medium text-brand-stone bg-brand-text/5 px-3 py-1 rounded-full">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex space-x-4 border-b border-brand-stone/20">
        {(['overview', 'investments', 'banking'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-[2px] ${
              activeSection === section
                ? 'border-brand-green text-brand-text'
                : 'border-transparent text-brand-stone hover:text-brand-text'
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="space-y-8">
        {activeSection === 'overview' && (
          <>
            {/* Financial Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Portfolio Summary */}
              <PortfolioSummary 
                portfolioData={mockRobinhoodData}
                className="bg-brand-text rounded-lg p-6"
              />

              {/* Recent Activity */}
              <div className="bg-brand-text rounded-lg p-6">
                <h3 className="text-lg font-bold text-brand-background mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {mockRobinhoodData.recent_trades.slice(0, 3).map((trade: any) => (
                    <div key={`${trade.ticker}-${trade.date}`} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-brand-background">
                          {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.ticker}
                        </p>
                        <p className="text-xs text-brand-background/70">
                          {new Date(trade.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-brand-background">
                          ${trade.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* All Financial Metrics */}
            <FinancialMetrics metricGroups={metricGroups} />
          </>
        )}

        {activeSection === 'investments' && (
          <>
            {/* Investment Analysis Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-brand-text">Investment Analysis</h2>
                <div className="flex space-x-2">
                  {timeframeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setSelectedTimeframe(option)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTimeframe === option
                          ? 'bg-brand-text text-brand-background'
                          : 'text-brand-text bg-brand-text/5 hover:bg-brand-text/10'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <PortfolioAnalysis
                portfolioData={mockRobinhoodData}
                timeframe={selectedTimeframe}
              />

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-brand-text">Stock Details</h3>
                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-2 bg-brand-text rounded-lg p-4 space-y-4 max-h-[600px] overflow-y-auto">
                    {mockRobinhoodData.holdings.map((stock: any) => (
                      <button
                        key={stock.ticker}
                        onClick={() => setSelectedStock(stock)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedStock.ticker === stock.ticker
                            ? 'bg-brand-background'
                            : 'hover:bg-brand-background/5'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className={`font-medium ${
                              selectedStock.ticker === stock.ticker
                                ? 'text-brand-text'
                                : 'text-brand-background'
                            }`}>
                              {stock.ticker}
                            </p>
                            <p className={`text-sm ${
                              selectedStock.ticker === stock.ticker
                                ? 'text-brand-stone'
                                : 'text-brand-background/70'
                            }`}>
                              {stock.shares} shares
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${
                              selectedStock.ticker === stock.ticker
                                ? 'text-brand-text'
                                : 'text-brand-background'
                            }`}>
                              ${stock.current_price.toLocaleString()}
                            </p>
                            <p className={`text-sm ${
                              stock.total_return >= 0 ? 'text-brand-green' : 'text-brand-coral'
                            }`}>
                              {stock.total_return >= 0 ? '+' : ''}{stock.total_return}%
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="col-span-4">
                    <StockAnalysis
                      stock={selectedStock}
                      timeframe={selectedTimeframe}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Trades */}
              <div className="bg-brand-text rounded-lg p-6">
                <h3 className="text-lg font-bold text-brand-background mb-4">Recent Trades</h3>
                <div className="space-y-4">
                  {mockRobinhoodData.recent_trades.slice(0, 5).map((trade: any) => (
                    <div key={`${trade.ticker}-${trade.date}`} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-brand-background">
                          {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.ticker}
                        </p>
                        <p className="text-xs text-brand-background/70">
                          {new Date(trade.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-brand-background">
                          {trade.shares} shares @ ${trade.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-brand-background/70">
                          Total: ${trade.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeSection === 'banking' && (
          <div className="space-y-8">
            {/* Account Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Checking Account */}
              <div className="bg-brand-text rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-brand-background">{mockPlaidData.accounts.checking.name}</h3>
                  <p className="text-sm text-brand-background/70">Available balance</p>
                </div>
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-brand-green">
                    ${mockPlaidData.accounts.checking.balance.toLocaleString()}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Monthly Inflow</span>
                      <span className="font-medium text-brand-green">
                        +${mockPlaidData.accounts.checking.monthly_inflow.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Monthly Outflow</span>
                      <span className="font-medium text-brand-coral">
                        -${mockPlaidData.accounts.checking.monthly_outflow.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Savings Account */}
              <div className="bg-brand-text rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-brand-background">{mockPlaidData.accounts.savings.name}</h3>
                  <p className="text-sm text-brand-background/70">Current balance</p>
                </div>
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-brand-green">
                    ${mockPlaidData.accounts.savings.balance.toLocaleString()}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">APY</span>
                      <span className="font-medium text-brand-green">{mockPlaidData.accounts.savings.apy}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Monthly Interest</span>
                      <span className="font-medium text-brand-green">
                        +${mockPlaidData.accounts.savings.monthly_interest.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Card */}
              <div className="bg-brand-text rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-brand-background">{mockPlaidData.accounts.credit.name}</h3>
                  <p className="text-sm text-brand-background/70">Current balance</p>
                </div>
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-brand-coral">
                    ${Math.abs(mockPlaidData.accounts.credit.balance).toLocaleString()}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Available Credit</span>
                      <span className="font-medium text-brand-green">
                        ${mockPlaidData.accounts.credit.available_credit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Payment Due</span>
                      <span className="font-medium text-brand-background">
                        {new Date(mockPlaidData.accounts.credit.payment_due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-background/70">Minimum Payment</span>
                      <span className="font-medium text-brand-coral">
                        ${mockPlaidData.accounts.credit.minimum_payment.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Spending Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Spending by Category */}
              <div className="bg-brand-text rounded-lg p-6">
                <h3 className="text-lg font-bold text-brand-background mb-4">Spending by Category</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(mockPlaidData.monthly_summary.expenses)
                          .filter(([key]) => key !== 'total')
                          .map(([category, amount]) => ({
                            name: category,
                            value: amount as number
                          }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {Object.entries(mockPlaidData.monthly_summary.expenses)
                          .filter(([key]) => key !== 'total')
                          .map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#F9F9F6',
                          border: '1px solid #D8D8D0',
                          borderRadius: '0.5rem',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Cash Flow */}
              <div className="bg-brand-text rounded-2xl p-6 shadow-sm border border-brand-stone/10">
                <h3 className="text-lg font-bold text-brand-background mb-4">Monthly Cash Flow</h3>
                {/* Net Flow Summary */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-brand-background/70">Net Flow</span>
                  <span className={`text-xl font-bold ${
                    mockPlaidData.monthly_summary.income.total - Math.abs(mockPlaidData.monthly_summary.expenses.total) > 0
                      ? 'text-brand-green'
                      : 'text-brand-coral'
                  }`}>
                    ${(mockPlaidData.monthly_summary.income.total - Math.abs(mockPlaidData.monthly_summary.expenses.total)).toLocaleString()}
                  </span>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: 'Income',
                          value: mockPlaidData.monthly_summary.income.total,
                          color: '#45836E'
                        },
                        {
                          name: 'Expenses',
                          value: Math.abs(mockPlaidData.monthly_summary.expenses.total),
                          color: '#FF6B5E'
                        }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      barCategoryGap={40}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#D8D8D0" />
                      <XAxis dataKey="name" stroke="#2A2A2A" tick={{ fill: '#F9F9F6', fontSize: 13 }} label={{ value: 'Type', position: 'insideBottom', fill: '#F9F9F6', fontSize: 13, offset: 10 }} />
                      <YAxis stroke="#2A2A2A" tick={{ fill: '#F9F9F6', fontSize: 13 }} label={{ value: 'Amount ($)', angle: -90, position: 'insideLeft', fill: '#F9F9F6', fontSize: 13 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#F9F9F6',
                          border: '1px solid #D8D8D0',
                          borderRadius: '0.5rem',
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                      />
                      <Bar dataKey="value" isAnimationActive radius={[8, 8, 0, 0]}>
                        {[
                          { color: '#45836E' },
                          { color: '#FF6B5E' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        {/* Value labels on bars */}
                        <LabelList dataKey="value" position="top" formatter={(value: number) => `$${value.toLocaleString()}`} fill="#2A2A2A" fontSize={14} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-brand-text rounded-lg p-6">
              <h3 className="text-lg font-bold text-brand-background mb-4">Recent Transactions</h3>
              <div className="space-y-4">
                {mockPlaidData.transactions.map((transaction: Activity) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-brand-background/5 hover:bg-brand-background/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex items-center justify-center rounded-full p-2",
                        (transaction.amount ?? 0) > 0
                          ? "bg-brand-green/10 text-brand-green"
                          : "bg-brand-coral/10 text-brand-coral"
                      )}>
                        {(transaction.amount ?? 0) > 0 ? (
                          <ArrowUpIcon className="h-4 w-4" />
                        ) : (
                          <ArrowDownIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-brand-background">{transaction.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-brand-background/70">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                          <span className="text-xs text-brand-background/70">•</span>
                          <p className="text-xs text-brand-background/70">{transaction.category}</p>
                        </div>
                      </div>
                    </div>
                    <p className={cn(
                      "font-medium",
                      (transaction.amount ?? 0) > 0 ? "text-brand-green" : "text-brand-coral"
                    )}>
                      {(transaction.amount ?? 0) > 0 ? '+' : '-'}
                      ${Math.abs(transaction.amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Bills */}
            <div className="bg-brand-text rounded-lg p-6">
              <h3 className="text-lg font-bold text-brand-background mb-4">Upcoming Bills</h3>
              <div className="space-y-4">
                {mockPlaidData.upcoming_bills.map((bill: any) => (
                  <div
                    key={bill.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-brand-background/5 hover:bg-brand-background/10 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-brand-background">{bill.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-brand-background/70">
                          Due {new Date(bill.due_date).toLocaleDateString()}
                        </p>
                        <span className="text-xs text-brand-background/70">•</span>
                        <p className="text-xs text-brand-background/70">
                          {bill.autopay ? 'AutoPay Enabled' : 'Manual Payment'}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-brand-coral">
                      ${bill.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
} 