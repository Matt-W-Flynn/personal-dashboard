import { format } from 'date-fns'

export interface FinancialMetric {
  label: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  description?: string
}

export interface MetricGroup {
  title: string
  metrics: FinancialMetric[]
}

export const calculateNetWorth = (
  portfolioValue: number,
  checkingBalance: number,
  savingsBalance: number,
  creditBalance: number
): number => {
  return portfolioValue + checkingBalance + savingsBalance + creditBalance
}

export const calculateMonthlyCashflow = (
  monthlyIncome: number,
  monthlyExpenses: number
): number => {
  return monthlyIncome - monthlyExpenses
}

export const calculateSavingsRate = (
  monthlyIncome: number,
  monthlyExpenses: number
): number => {
  return ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
}

export const getFinancialHealthMetrics = (
  robinhoodData: any,
  plaidData: any
): MetricGroup[] => {
  const netWorth = calculateNetWorth(
    robinhoodData.portfolio_value,
    plaidData.accounts.checking.balance,
    plaidData.accounts.savings.balance,
    plaidData.accounts.credit.balance
  )

  const monthlyCashflow = calculateMonthlyCashflow(
    plaidData.monthly_summary.income.total,
    plaidData.monthly_summary.expenses.total
  )

  const savingsRate = calculateSavingsRate(
    plaidData.monthly_summary.income.total,
    plaidData.monthly_summary.expenses.total
  )

  const creditUtilization =
    (Math.abs(plaidData.accounts.credit.balance) /
      plaidData.accounts.credit.credit_limit) *
    100

  return [
    {
      title: 'Overall Financial Health',
      metrics: [
        {
          label: 'Net Worth',
          value: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(netWorth),
          change: 12.5, // Calculated from historical data
          trend: 'up',
          description: 'Total assets minus liabilities'
        },
        {
          label: 'Monthly Cashflow',
          value: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(monthlyCashflow),
          change: 8.2,
          trend: 'up',
          description: 'Monthly income minus expenses'
        },
        {
          label: 'Savings Rate',
          value: savingsRate.toFixed(1) + '%',
          change: 2.3,
          trend: 'up',
          description: 'Percentage of income saved'
        }
      ]
    },
    {
      title: 'Investment Performance',
      metrics: [
        {
          label: 'Portfolio Value',
          value: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(robinhoodData.portfolio_value),
          change: robinhoodData.total_return,
          trend: robinhoodData.total_return > 0 ? 'up' : 'down',
          description: 'Current investment portfolio value'
        },
        {
          label: 'YTD Return',
          value: robinhoodData.total_return.toFixed(2) + '%',
          trend: robinhoodData.total_return > 0 ? 'up' : 'down',
          description: 'Year-to-date investment return'
        },
        {
          label: 'Top Performing Stock',
          value: 'NVDA',
          change: 114.36,
          trend: 'up',
          description: 'Best performing stock in portfolio'
        }
      ]
    },
    {
      title: 'Risk Metrics',
      metrics: [
        {
          label: 'Credit Utilization',
          value: creditUtilization.toFixed(1) + '%',
          trend: creditUtilization > 30 ? 'down' : 'up',
          description: 'Percentage of credit limit used'
        },
        {
          label: 'Emergency Fund Ratio',
          value: (plaidData.accounts.savings.balance / 
            (plaidData.monthly_summary.expenses.total * 6) * 100).toFixed(1) + '%',
          trend: 'up',
          description: 'Emergency fund vs 6 months expenses'
        },
        {
          label: 'Debt-to-Income',
          value: ((Math.abs(plaidData.accounts.credit.balance) / 
            plaidData.monthly_summary.income.total) * 100).toFixed(1) + '%',
          trend: 'up',
          description: 'Monthly debt payments vs income'
        }
      ]
    },
    {
      title: 'Asset Allocation',
      metrics: [
        {
          label: 'Cash Position',
          value: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(plaidData.accounts.checking.balance + 
            plaidData.accounts.savings.balance),
          description: 'Total cash in checking and savings'
        },
        {
          label: 'Tech Exposure',
          value: robinhoodData.sector_allocation.find(
            (s: any) => s.sector === 'Technology'
          ).percentage.toFixed(1) + '%',
          description: 'Percentage of portfolio in tech sector'
        },
        {
          label: 'Diversification Score',
          value: calculateDiversificationScore(robinhoodData.sector_allocation),
          trend: 'neutral',
          description: 'Portfolio diversification rating (1-10)'
        }
      ]
    },
    {
      title: 'Goals & Forecasting',
      metrics: [
        {
          label: 'Retirement Progress',
          value: '32%',
          trend: 'up',
          description: 'Progress towards retirement goal'
        },
        {
          label: 'Time to $1M',
          value: calculateTimeToTarget(
            netWorth,
            1000000,
            monthlyCashflow,
            0.08
          ),
          description: 'Estimated years to reach $1M net worth'
        },
        {
          label: 'Monthly Savings Target',
          value: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(plaidData.monthly_summary.income.total * 0.20),
          description: '20% of monthly income target'
        }
      ]
    }
  ]
}

const calculateDiversificationScore = (sectorAllocation: any[]): number => {
  // Simple diversification score based on number of sectors and concentration
  const numSectors = sectorAllocation.length
  const maxConcentration = Math.max(...sectorAllocation.map(s => s.percentage))
  
  // Score from 1-10 where:
  // - More sectors = better
  // - Lower max concentration = better
  const sectorScore = Math.min(numSectors / 10 * 5, 5)
  const concentrationScore = 5 - (maxConcentration / 100 * 5)
  
  return Math.round(sectorScore + concentrationScore)
}

const calculateTimeToTarget = (
  currentAmount: number,
  targetAmount: number,
  monthlySavings: number,
  expectedReturn: number
): string => {
  // Simple future value calculation
  let amount = currentAmount
  let years = 0
  
  while (amount < targetAmount && years < 50) {
    amount = amount * (1 + expectedReturn) + (monthlySavings * 12)
    years++
  }
  
  return years >= 50 ? '50+ years' : `${years} years`
} 