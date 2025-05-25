'use client';

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialChartProps {
  data: number[];
  className?: string;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ data, className }) => {
  const chartData = {
    labels: Array.from({ length: data.length }, (_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: 'Portfolio Value',
        data: data,
        fill: true,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#4A5568', // text-gray-700
          font: {
            size: 14,
          }
        }
      },
      title: {
        display: true,
        text: 'Portfolio Performance (Last 7 Days)',
        color: '#2D3748', // text-gray-800
        font: {
            size: 18,
            weight: 'bold' as const
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
            label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                }
                return label;
            }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
            color: '#718096' // text-gray-600
        }
      },
      y: {
        grid: {
          color: '#E2E8F0', // text-gray-300
        },
        ticks: {
          callback: function(value: string | number) {
            return '$' + Number(value).toLocaleString();
          },
          color: '#718096' // text-gray-600
        },
      },
    },
  };

  return (
    <div className={`bg-white shadow-lg rounded-xl p-4 md:p-6 ${className}`} style={{ height: '400px' }}>
      <Line options={options} data={chartData} />
    </div>
  );
};

export default FinancialChart; 