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

const formatDate = (dateString: string, timeframe: string) => {
  const date = new Date(dateString)
  switch (timeframe) {
    case '1D':
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    case '1W':
    case '1M':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    case '3M':
    case '1Y':
    case 'ALL':
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    default:
      return date.toLocaleDateString('en-US')
  }
}

// New formatter for Y-axis values
const formatAxisValue = (value: number): string => {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  } else if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`; // Using toFixed(0) for cleaner K values
  }
  return value.toString();
};

const PortfolioAnalysis: React.FC<PortfolioAnalysisProps> = ({
  portfolioData,
  timeframe = '1M'
}) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)

  const portfolioHistoryData = portfolioData.portfolio_history[timeframe]

  // Logging for debugging
  console.log('[PortfolioAnalysis] Received timeframe:', timeframe);
  if (portfolioHistoryData && portfolioHistoryData.length > 0) {
    console.log('[PortfolioAnalysis] Sample raw date from data:', portfolioHistoryData[0].date);
    console.log('[PortfolioAnalysis] Formatted sample date:', formatDate(portfolioHistoryData[0].date, timeframe));
    if (portfolioHistoryData.length > 1) {
      console.log('[PortfolioAnalysis] Sample raw date 2 from data:', portfolioHistoryData[1].date);
      console.log('[PortfolioAnalysis] Formatted sample date 2:', formatDate(portfolioHistoryData[1].date, timeframe));
    }
  } else {
    console.log('[PortfolioAnalysis] portfolioHistoryData is empty or undefined for timeframe:', timeframe);
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Value */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-brand-text rounded-2xl p-6 shadow-sm border border-brand-stone/10">
          <h3 className="text-lg font-bold text-brand-background mb-4">Portfolio Value</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistoryData} margin={{ left: 5, right: 20, top: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#45836E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#45836E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8D8D0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(tick, index) => {
                    // For 1M view (approx 30 data points), show a tick roughly every 5-7 days
                    // For other views with fewer points, show more ticks.
                    const numPoints = portfolioHistoryData?.length || 1;
                    const interval = numPoints > 20 ? Math.floor(numPoints / 5) : 1; // Show 5-6 labels for ~30 points
                    return index % interval === 0 ? formatDate(tick, timeframe) : '';
                  }}
                  tick={{ fill: '#F9F9F6', fontSize: '0.875rem' }}
                  axisLine={{ stroke: '#D8D8D0' }}
                  tickLine={false}
                  // label={{ value: 'Date', position: 'insideBottom', fill: '#F9F9F6', fontSize: '0.875rem', offset: -10 }} // Keep label if desired, or remove if X-axis is clear
                  // Remove X-axis main label if ticks make it clear enough
                />
                <YAxis 
                  tickFormatter={formatAxisValue}
                  tick={{ fill: '#F9F9F6', fontSize: '0.875rem' }}
                  axisLine={{ stroke: '#D8D8D0' }}
                  tickLine={false}
                  domain={[(dataMin: number) => (dataMin * 0.95), (dataMax: number) => (dataMax * 1.05)]}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#2A2A2A',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#F9F9F6'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  labelFormatter={(label) => formatDate(label, timeframe)}
                  itemStyle={{color: '#F9F9F6'}} // Ensure tooltip text is light
                  cursor={{fill: 'rgba(255,255,255,0.1)'}} // Subtle hover background on chart
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#45836E"
                  fill="url(#colorValue)"
                  strokeWidth={2}
                  dot={true}
                  activeDot={{ r: 4, stroke: '#F9F9F6', strokeWidth: 1, fill: '#45836E' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="bg-brand-text rounded-2xl p-6 shadow-sm border border-brand-stone/10 flex flex-col">
          <h3 className="text-lg font-bold text-brand-background mb-4">Sector Allocation</h3>
          <div className="h-48 md:h-52">
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
                  labelLine={false}
                  label={<CustomizedPieLabel />}
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
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-2 border-t border-brand-background/10 overflow-y-auto max-h-28 scrollbar-thin scrollbar-thumb-brand-primary scrollbar-track-brand-text-muted">
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
            {Array.isArray(portfolioData.holdings) && portfolioData.holdings.length > 0 ? (
              portfolioData.holdings.slice(0, 5).map((holding: any) => {
                const percentageOfPortfolio = (holding.market_value / portfolioData.portfolio_value) * 100;
                return (
                  <div key={holding.ticker} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-brand-background">
                        {holding.ticker}
                      </p>
                      <p className="text-xs text-brand-background/70">
                        {percentageOfPortfolio.toFixed(1)}% of portfolio
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-brand-background">
                        {formatCurrency(holding.market_value)}
                      </p>
                      <p className={`text-xs font-medium ${
                        holding.total_return >= 0 ? 'text-brand-green' : 'text-brand-coral'
                      }`}>
                        {holding.total_return >= 0 ? '+' : ''}{holding.total_return}%
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-brand-background/70">No top holdings data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Custom label component for Pie Chart
const CustomizedPieLabel = (props: any) => {
  const { cx, cy, midAngle, outerRadius, percent, name, fill } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 15; // Position label outside the pie
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const anchor = x > cx ? 'start' : 'end';

  return (
    <text 
      x={x} 
      y={y} 
      fill="#F9F9F6" // Using a light color for visibility on dark bg
      textAnchor={anchor} 
      dominantBaseline="central" 
      className="text-xs" // Tailwind class for font size
    >
      {`${name} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

export default PortfolioAnalysis 