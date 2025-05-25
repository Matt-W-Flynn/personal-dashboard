import React from 'react'
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid'
import { FinancialMetric, MetricGroup } from '@/data/financialMetrics'
import { motion } from 'framer-motion'

interface MetricCardProps {
  metric: FinancialMetric
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4 text-brand-green" />
      case 'down':
        return <ArrowDownIcon className="h-4 w-4 text-brand-coral" />
      default:
        return <MinusIcon className="h-4 w-4 text-brand-stone" />
    }
  }

  return (
    <div className="rounded-lg bg-brand-text p-4 shadow-lg border border-brand-stone/20">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-brand-background">{metric.label}</span>
        {metric.trend && getTrendIcon()}
      </div>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-bold text-brand-background">{metric.value}</p>
        {metric.change && (
          <span className={`ml-2 text-sm font-medium ${
            metric.trend === 'up' ? 'text-brand-green' : 
            metric.trend === 'down' ? 'text-brand-coral' : 
            'text-brand-stone'
          }`}>
            {metric.change > 0 ? '+' : ''}{metric.change}%
          </span>
        )}
      </div>
      {metric.description && (
        <p className="mt-1 text-xs text-brand-background/70">{metric.description}</p>
      )}
    </div>
  )
}

interface MetricGroupProps {
  group: MetricGroup
}

const MetricGroupSection: React.FC<MetricGroupProps> = ({ group }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-brand-text tracking-wide">{group.title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {group.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>
    </div>
  )
}

interface FinancialMetricsProps {
  metricGroups: MetricGroup[]
  compact?: boolean
}

// Modern Icon Components
const ChartIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.877075 7.49991C0.877075 3.84222 3.84222 0.877075 7.49991 0.877075C11.1576 0.877075 14.1227 3.84222 14.1227 7.49991C14.1227 11.1576 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1576 0.877075 7.49991ZM7.49991 1.82708C4.36689 1.82708 1.82708 4.36689 1.82708 7.49991C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49991C13.1727 4.36689 10.6329 1.82708 7.49991 1.82708Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const WalletIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 3.5C2 2.67157 2.67157 2 3.5 2H11.5C12.3284 2 13 2.67157 13 3.5V11.5C13 12.3284 12.3284 13 11.5 13H3.5C2.67157 13 2 12.3284 2 11.5V3.5ZM3.5 3C3.22386 3 3 3.22386 3 3.5V11.5C3 11.7761 3.22386 12 3.5 12H11.5C11.7761 12 12 11.7761 12 11.5V3.5C12 3.22386 11.7761 3 11.5 3H3.5Z"
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  </svg>
)

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="15"
    height="15"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.5 2.5L7 9L4.5 6.5L1.5 9.5M13.5 2.5H9.5M13.5 2.5V6.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function FinancialMetrics({ metricGroups, compact = false }: FinancialMetricsProps) {
  const getMetricIcon = (metric: FinancialMetric) => {
    const change = metric.change ?? 0
    if (change === 0) {
      return <MinusIcon className="h-4 w-4 text-brand-stone" />
    }
    if (change > 0) {
      return <ArrowUpIcon className="h-4 w-4 text-brand-green" />
    }
    return <ArrowDownIcon className="h-4 w-4 text-brand-coral" />
  }

  const getMetricChangeColor = (change: number | undefined) => {
    const value = change ?? 0
    if (value === 0) return 'text-brand-stone'
    return value > 0 ? 'text-brand-green' : 'text-brand-coral'
  }

  const icons = {
    'Overall Health': <ChartIcon />,
    'Investment Overview': <TrendingUpIcon />,
    'Cash Flow': <WalletIcon />,
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {metricGroups.map((group) => (
          <div
            key={group.title}
            className="rounded-xl bg-brand-text p-4 shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-4 h-4 text-brand-green">
                {icons[group.title as keyof typeof icons]}
              </div>
              <p className="text-sm font-medium text-brand-background/70">{group.title}</p>
            </div>
            {group.metrics.slice(0, 1).map((metric) => (
              <div key={metric.label}>
                <p className="text-2xl font-semibold text-brand-background">
                  {metric.value}
                </p>
                <p className="text-xs text-brand-background/70 mt-1">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {metricGroups.map((group) => (
        <div key={group.title} className="space-y-4">
          {!compact && (
            <h3 className="text-lg font-semibold">{group.title}</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.metrics.map((metric) => (
              <div
                key={metric.label}
                className="bg-brand-stone/5 rounded-xl p-4 hover:bg-brand-stone/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-brand-text/60">{metric.label}</p>
                  <div className="flex items-center gap-1">
                    {getMetricIcon(metric)}
                    <span className={`text-sm font-medium ${getMetricChangeColor(metric.change)}`}>
                      {metric.change && metric.change > 0 ? '+' : ''}{metric.change ?? 0}%
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xl font-semibold">
                  {typeof metric.value === 'number' 
                    ? `$${metric.value.toLocaleString()}`
                    : metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
} 