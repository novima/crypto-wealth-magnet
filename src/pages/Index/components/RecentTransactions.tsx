
import React from 'react';
import { motion } from 'framer-motion';
import TransactionCard from '@/components/TransactionCard';

interface RecentTransactionsProps {
  transactions: Array<{
    id: string;
    type: 'buy' | 'sell';
    amount: number;
    currency: string;
    price: number;
    timestamp: Date;
    status: 'completed' | 'pending' | 'failed';
  }>;
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="p-5 rounded-xl border bg-card"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Recent Transactions</h2>
        <button className="text-xs text-primary hover:text-primary/80 font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No transactions yet
          </div>
        ) : (
          transactions.slice(0, 3).map((transaction) => (
            <TransactionCard 
              key={transaction.id} 
              transaction={transaction} 
            />
          ))
        )}
      </div>
    </motion.div>
  );
};

export default RecentTransactions;
