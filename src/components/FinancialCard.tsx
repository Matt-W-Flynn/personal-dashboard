import React from 'react';

interface FinancialCardProps {
  title: string;
  value: string | number;
  className?: string;
}

const FinancialCard: React.FC<FinancialCardProps> = ({ title, value, className }) => {
  return (
    <div className={`bg-white shadow-lg rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{typeof value === 'number' ? `$${value.toLocaleString()}` : value}</p>
    </div>
  );
};

export default FinancialCard; 