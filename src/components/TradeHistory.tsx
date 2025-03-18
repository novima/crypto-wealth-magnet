
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';

interface Trade {
  id: number;
  timestamp: Date;
  operation: 'buy' | 'sell';
  market: string;
  amount: number;
  success: boolean;
  balanceAfter: number;
  message: string;
  profitReserved?: number;
}

interface TradeHistoryProps {
  trades: Trade[];
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-3">Handelsaktvitet</h3>
      
      {trades.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm bg-secondary/30 rounded-md">
          Inga handlingar utförda än. Väntar på att automatisk handel ska starta.
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto subtle-scroll pr-2">
          {trades.map((trade) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between p-3 rounded-md border bg-card/50"
            >
              <div className="flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                  trade.success 
                    ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {trade.success 
                    ? trade.operation === 'buy' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} /> 
                    : <AlertCircle size={16} />}
                </div>
                <div>
                  <div className="text-sm font-medium">
                    {trade.operation === 'buy' ? 'Köp' : 'Sälj'} #{trade.id} - {trade.market}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trade.timestamp.toLocaleTimeString()}
                  </div>
                  {trade.profitReserved && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      ${trade.profitReserved.toFixed(2)} reserverad vinst
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  trade.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}>
                  {((trade.balanceAfter / (trade.balanceAfter - trade.amount) - 1) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  ${trade.balanceAfter.toFixed(2)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
