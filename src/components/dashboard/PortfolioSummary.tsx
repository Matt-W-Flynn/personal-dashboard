import React from 'react'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip
} from 'recharts'

interface PortfolioSummaryProps {
  portfolioData: any
  className?: string
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  portfolioData,
  className = ''
}) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)

  // Get the last month's worth of data for the mini chart
  const chartData = portfolioData.portfolio_history['1M'].map(
    (value: number, index: number) => ({
      time: index,
      value
    })
  )

  // Calculate total return
  const initialValue = portfolioData.portfolio_history['1Y'][0]
  const currentValue = portfolioData.portfolio_value
  const totalReturn = ((currentValue - initialValue) / initialValue) * 100

  // Get top 3 holdings
  const topHoldings = [...portfolioData.holdings]
    .sort((a, b) => b.market_value - a.market_value)
    .slice(0, 3)

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-brand-background">Portfolio Overview</h3>
          <p className="text-sm text-brand-background/70">
            {portfolioData.holdings.length} holdings
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand-background">
            {formatCurrency(portfolioData.portfolio_value)}
          </p>
          <div className={`flex items-center justify-end space-x-1 ${
            totalReturn >= 0 ? 'text-brand-green' : 'text-brand-coral'
          }`}>
            {totalReturn >= 0 ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="h-24 -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#45836E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#45836E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                backgroundColor: '#2A2A2A',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#F9F9F6'
              }}
              formatter={(value: number) => [formatCurrency(value), 'Value']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#45836E"
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div>
          <p className="text-sm text-brand-background/70">Cash Available</p>
          <p className="text-lg font-medium text-brand-background">
            {formatCurrency(portfolioData.buying_power)}
          </p>
        </div>
        <div>
          <p className="text-sm text-brand-background/70">Today's Change</p>
          <p className={`text-lg font-medium ${
            portfolioData.today_return >= 0 ? 'text-brand-green' : 'text-brand-coral'
          }`}>
            {portfolioData.today_return >= 0 ? '+' : ''}
            {portfolioData.today_return}%
          </p>
        </div>
      </div>

      {/* Top Holdings */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-brand-background mb-3">Top Holdings</h4>
        <div className="space-y-3">
          {topHoldings.map(holding => (
            <div key={holding.ticker} className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-brand-background">
                  {holding.ticker}
                </p>
                <p className="text-xs text-brand-background/70">
                  {((holding.market_value / portfolioData.portfolio_value) * 100).toFixed(1)}%
                </p>
              </div>
              <p className={`text-sm ${
                holding.total_return >= 0 ? 'text-brand-green' : 'text-brand-coral'
              }`}>
                {holding.total_return >= 0 ? '+' : ''}
                {holding.total_return}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PortfolioSummary 