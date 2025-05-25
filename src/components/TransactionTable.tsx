import React from 'react';

interface Transaction {
  date: string;
  name: string;
  amount: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
  className?: string;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, className }) => {
  return (
    <div className={`bg-white shadow-lg rounded-xl p-4 md:p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Recent Transactions</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{transaction.date}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">{transaction.name}</td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </td>
              </tr>
            ))}
             {transactions.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">No transactions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable; 