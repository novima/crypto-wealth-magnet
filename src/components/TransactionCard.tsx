
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  currency: string;
  price: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface TransactionCardProps {
  transaction: Transaction;
  className?: string;
}

const TransactionCard = ({ transaction, className }: TransactionCardProps) => {
  const { type, amount, currency, price, timestamp, status } = transaction;
  
  const isPositive = type === 'buy';
  
  const statusStyles = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "p-4 rounded-lg border bg-card hover:shadow-subtle transition-all",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center mr-3",
            isPositive ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" : 
                         "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          </div>
          
          <div>
            <h3 className="text-sm font-medium">
              {isPositive ? 'Buy' : 'Sell'} {currency}
            </h3>
            <p className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleString(undefined, { 
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className={cn(
            "text-sm font-medium",
            isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {isPositive ? '+' : '-'}{amount.toFixed(6)} {currency}
          </p>
          <p className="text-xs text-muted-foreground">
            ${price.toFixed(2)}
          </p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          statusStyles[status]
        )}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        
        <button className="text-xs text-primary hover:text-primary/80 font-medium">
          View Details
        </button>
      </div>
    </motion.div>
  );
};

export default TransactionCard;
