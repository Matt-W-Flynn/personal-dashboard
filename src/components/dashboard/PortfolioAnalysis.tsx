import React from 'react'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface PortfolioAnalysisProps {
  portfolioData: any // Using any for now, will type properly later
  timeframe?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'
}

const COLORS = ['#45836E', '#2A2A2A', '#D8D8D0', '#FF6B5E']

const getXAxisTicks = (timeframe: string, data: any[]) => {
  // Example: show fewer ticks for longer timeframes
  if (timeframe === '1D') return data.map((_, i) => i)
  if (timeframe === '1W') return data.filter((_, i) => i % 1 === 0).map((_, i) => i)
  if (timeframe === '1M') return data.filter((_, i) => i % 5 === 0).map((_, i) => i)
  if (timeframe === '3M') return data.filter((_, i) => i % 10 === 0).map((_, i) => i)
  if (timeframe === '1Y') return data.filter((_, i) => i % 20 === 0).map((_, i) => i)
  return data.filter((_, i) => i % 30 === 0).map((_, i) => i)
}

const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({
  portfolioData,
  timeframe = '1M'
}) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)

  const portfolioHistoryData = portfolioData.portfolio_history[timeframe].map(
    (value: number, index: number) => ({
      time: index,
      value
    })
  )

  const xTicks = getXAxisTicks(timeframe, portfolioHistoryData)

  return (
    <div className="space-y-6">
      {/* Portfolio Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-brand-text rounded-2xl p-6 shadow-sm border border-brand-stone/10">
          <h3 className="text-lg font-bold text-brand-background mb-4">Portfolio Value</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistoryData} margin={{ left: 30, right: 20, top: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#45836E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#45836E" stopOpacity={0} />
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
                  tick={{ fill: '#F9F9F6', fontSize: 12 }}
                  axisLine={{ stroke: '#D8D8D0' }}
                  tickLine={false}
                  label={{ value: 'Value ($)', angle: -90, position: 'insideLeft', fill: '#F9F9F6', fontSize: 12 }}
                />
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
        </div>

        {/* Sector Allocation */}
        <div className="bg-brand-text rounded-2xl p-6 shadow-sm border border-brand-stone/10">
          <h3 className="text-lg font-bold text-brand-background mb-4">Sector Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData.sector_allocation}
                  dataKey="value"
                  nameKey="sector"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {portfolioData.sector_allocation.map((entry: any, index: number) => (
                    <Cell
                      key={entry.sector}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2A2A2A',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#F9F9F6'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                />
                <Legend formatter={(value) => <span style={{ color: '#F9F9F6', fontSize: 13 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {portfolioData.sector_allocation.map((sector: any) => (
                <div key={sector.sector} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        COLORS[
                          portfolioData.sector_allocation.findIndex(
                            (s: any) => s.sector === sector.sector
                          ) % COLORS.length
                        ]
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-brand-background">
                      {sector.sector}
                    </p>
                    <p className="text-xs text-brand-background/70">
                      {sector.percentage.toFixed(1)}% • {formatCurrency(sector.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-text rounded-2xl p-6 shadow-sm border border-brand-stone/10">
          <h3 className="text-lg font-bold text-brand-background mb-4">Risk Profile</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-brand-background/70">Beta</span>
                <span className="text-sm font-medium text-brand-background">
                  {portfolioData.risk_metrics.portfolio_beta.toFixed(2)}
                </span>
              </div>
              <div className="h-2 bg-brand-background/20 rounded-full">
                <div
                  className="h-2 bg-brand-green rounded-full"
                  style={{
                    width: `${Math.min(
                      (portfolioData.risk_metrics.portfolio_beta / 2) * 100,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-brand-background/70">Volatility</span>
                <span className="text-sm font-medium text-brand-background">
                  {(portfolioData.risk_metrics.standard_deviation * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-brand-background/20 rounded-full">
                <div
                  className="h-2 bg-brand-green rounded-full"
                  style={{
                    width: `${Math.min(
                      portfolioData.risk_metrics.standard_deviation * 200,
                      100
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-brand-text rounded-2xl p-6 shadow-sm border border-brand-stone/10">
          <h3 className="text-lg font-bold text-brand-background mb-4">Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-brand-background/70">Sharpe Ratio</span>
              <span className="text-sm font-medium text-brand-background">
                {portfolioData.risk_metrics.sharpe_ratio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-brand-background/70">Alpha</span>
              <span className="text-sm font-medium text-brand-background">
                {(portfolioData.risk_metrics.alpha * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-brand-background/70">R-Squared</span>
              <span className="text-sm font-medium text-brand-background">
                {(portfolioData.risk_metrics.r_squared * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-brand-background/70">Max Drawdown</span>
              <span className="text-sm font-medium text-brand-background">
                {(portfolioData.risk_metrics.max_drawdown * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-brand-text rounded-2xl p-6 shadow-sm border border-brand-stone/10">
          <h3 className="text-lg font-bold text-brand-background mb-4">Top Holdings</h3>
          <div className="space-y-2">
            {Array.isArray(portfolioData.top_holdings) && portfolioData.top_holdings.length > 0 ? (
              portfolioData.top_holdings.map((holding: any) => (
                <div key={holding.ticker} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-brand-background">
                      {holding.ticker}
                    </p>
                    <p className="text-xs text-brand-background/70">
                      {holding.percentage.toFixed(1)}% of portfolio
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-brand-background">
                      {formatCurrency(holding.value)}
                    </p>
                    <p className={`text-xs font-medium ${
                      holding.total_return >= 0 ? 'text-brand-green' : 'text-brand-coral'
                    }`}>
                      {holding.total_return >= 0 ? '+' : ''}{holding.total_return}%
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-brand-background/70">No top holdings data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortfolioAnalysis 