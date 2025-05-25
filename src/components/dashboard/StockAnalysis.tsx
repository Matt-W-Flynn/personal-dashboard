import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface StockAnalysisProps {
  stock: any // Using any for now, will type properly later
  timeframe?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'
}

const getXAxisTicks = (timeframe: string, data: any[]) => {
  if (timeframe === '1D') return data.map((_, i) => i)
  if (timeframe === '1W') return data.filter((_, i) => i % 1 === 0).map((_, i) => i)
  if (timeframe === '1M') return data.filter((_, i) => i % 5 === 0).map((_, i) => i)
  if (timeframe === '3M') return data.filter((_, i) => i % 10 === 0).map((_, i) => i)
  if (timeframe === '1Y') return data.filter((_, i) => i % 20 === 0).map((_, i) => i)
  return data.filter((_, i) => i % 30 === 0).map((_, i) => i)
}

const StockAnalysis: React.FC<StockAnalysisProps> = ({ 
  stock,
  timeframe = '1M'
}) => {
  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)

  const priceData = stock.price_history[timeframe].map((price: number, index: number) => ({
    time: index,
    price
  }))

  const xTicks = getXAxisTicks(timeframe, priceData)

  const priceChange = stock.current_price - stock.avg_cost
  const priceChangePercent = (priceChange / stock.avg_cost) * 100

  return (
    <div className="space-y-6">
      {/* Stock Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-brand-text">{stock.name}</h3>
          <p className="text-sm text-brand-stone">{stock.ticker}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand-text">
            {formatPrice(stock.current_price)}
          </p>
          <div className={`flex items-center justify-end space-x-1 ${
            priceChange >= 0 ? 'text-brand-green' : 'text-brand-coral'
          }`}>
            {priceChange >= 0 ? (
              <ArrowUpIcon className="h-4 w-4" />
            ) : (
              <ArrowDownIcon className="h-4 w-4" />
            )}
            <span className="font-medium">
              {priceChange >= 0 ? '+' : ''}
              {priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="h-64 bg-brand-text rounded-2xl p-4 shadow-sm border border-brand-stone/10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceData} margin={{ left: 30, right: 20, top: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={priceChange >= 0 ? '#45836E' : '#FF6B5E'} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor={priceChange >= 0 ? '#45836E' : '#FF6B5E'} 
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#D8D8D0" />
            <XAxis 
              dataKey="time" 
              ticks={xTicks}
              tick={{ fill: '#F9F9F6', fontSize: 12 }}
              axisLine={{ stroke: '#D8D8D0' }}
              tickLine={false}
              label={{ value: 'Time', position: 'insideBottom', fill: '#F9F9F6', fontSize: 12, offset: -10 }}
            />
            <YAxis 
              domain={['dataMin', 'dataMax']}
              tick={{ fill: '#F9F9F6', fontSize: 12 }}
              axisLine={{ stroke: '#D8D8D0' }}
              tickLine={false}
              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', fill: '#F9F9F6', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#2A2A2A',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#F9F9F6'
              }}
              formatter={(value: number) => [formatPrice(value), 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={priceChange >= 0 ? '#45836E' : '#FF6B5E'}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Position Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-brand-text rounded-2xl p-4 shadow-sm border border-brand-stone/10">
          <h4 className="text-sm font-medium text-brand-background mb-2">Position</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-brand-background/70">Shares</span>
              <span className="text-brand-background font-medium">{stock.shares}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-background/70">Avg Cost</span>
              <span className="text-brand-background font-medium">
                {formatPrice(stock.avg_cost)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-background/70">Market Value</span>
              <span className="text-brand-background font-medium">
                {formatPrice(stock.market_value)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-background/70">Total Return</span>
              <span className={`font-medium ${
                stock.total_return >= 0 ? 'text-brand-green' : 'text-brand-coral'
              }`}>
                {stock.total_return >= 0 ? '+' : ''}
                {stock.total_return}%
              </span>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-brand-text rounded-2xl p-4 shadow-sm border border-brand-stone/10">
          <h4 className="text-sm font-medium text-brand-background mb-2">Analytics</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-brand-background/70">Beta</span>
              <span className="text-brand-background font-medium">
                {stock.analytics.beta.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-background/70">Volatility</span>
              <span className="text-brand-background font-medium">
                {(stock.analytics.volatility * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-background/70">P/E Ratio</span>
              <span className="text-brand-background font-medium">
                {stock.analytics.pe_ratio.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brand-background/70">Dividend Yield</span>
              <span className="text-brand-background font-medium">
                {stock.analytics.dividend_yield.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Price Range */}
      <div className="bg-brand-text rounded-2xl p-4 shadow-sm border border-brand-stone/10">
        <h4 className="text-sm font-medium text-brand-background mb-4">52-Week Range</h4>
        <div className="relative h-2 bg-brand-background/20 rounded-full">
          <div
            className="absolute h-4 w-4 -mt-1 rounded-full bg-brand-background"
            style={{
              left: `${((stock.current_price - stock.analytics['52w_low']) /
                (stock.analytics['52w_high'] - stock.analytics['52w_low'])) *
                100}%`,
              transform: 'translateX(-50%)'
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm text-brand-background/70">
            {formatPrice(stock.analytics['52w_low'])}
          </span>
          <span className="text-sm text-brand-background/70">
            {formatPrice(stock.analytics['52w_high'])}
          </span>
        </div>
      </div>
    </div>
  )
}

export default StockAnalysis 