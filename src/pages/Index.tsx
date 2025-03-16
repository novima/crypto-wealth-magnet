
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Percent, 
  Activity 
} from 'lucide-react';
import Header from '@/components/Header';
import ValueDisplay from '@/components/ValueDisplay';
import ProgressRing from '@/components/ProgressRing';
import TransactionCard from '@/components/TransactionCard';
import TradingSimulation from '@/components/TradingSimulation';
import StatCard from '@/components/StatCard';

// Sample data
const sampleTransactions = [
  {
    id: 't1',
    type: 'buy' as const,
    amount: 0.0025,
    currency: 'BTC',
    price: 58725.42,
    timestamp: new Date(Date.now() - 25 * 60000),
    status: 'completed' as const
  },
  {
    id: 't2',
    type: 'sell' as const,
    amount: 0.0018,
    currency: 'BTC',
    price: 58932.10,
    timestamp: new Date(Date.now() - 125 * 60000),
    status: 'completed' as const
  },
  {
    id: 't3',
    type: 'buy' as const,
    amount: 0.0031,
    currency: 'BTC',
    price: 58541.23,
    timestamp: new Date(Date.now() - 240 * 60000),
    status: 'completed' as const
  }
];

const Index = () => {
  const [accountBalance, setAccountBalance] = useState(10);
  const [dailyProfit, setDailyProfit] = useState(0);
  const [profitPercentage, setProfitPercentage] = useState(0);
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [progress, setProgress] = useState(accountBalance / 1000);
  
  const targetAmount = 1000;
  
  const handleSimulationComplete = (finalAmount: number) => {
    setAccountBalance(finalAmount);
    const newProfit = finalAmount - 10; // Initial investment was $10
    setDailyProfit(newProfit);
    setProfitPercentage((newProfit / 10) * 100);
    setProgress(finalAmount / targetAmount);
  };
  
  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <motion.h1 
            variants={itemVariants}
            className="text-3xl font-medium tracking-tight mb-2"
          >
            Dashboard
          </motion.h1>
          <motion.p 
            variants={itemVariants}
            className="text-muted-foreground"
          >
            Monitor your trading performance
          </motion.p>
        </motion.div>
        
        {/* Key metrics */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <motion.div variants={itemVariants}>
            <StatCard
              title="Account Balance"
              value={`$${accountBalance.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`}
              icon={DollarSign}
              description="Current trading capital"
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <StatCard
              title="Daily Profit"
              value={`$${dailyProfit.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`}
              icon={TrendingUp}
              trend={
                dailyProfit !== 0 
                  ? { value: profitPercentage, isPositive: dailyProfit > 0 } 
                  : undefined
              }
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <StatCard
              title="ROI"
              value={`${profitPercentage.toFixed(2)}%`}
              icon={Percent}
              description="Return on investment"
              trend={
                profitPercentage !== 0 
                  ? { value: profitPercentage, isPositive: profitPercentage > 0 } 
                  : undefined
              }
            />
          </motion.div>
        </motion.div>
        
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TradingSimulation 
                initialAmount={10} 
                targetAmount={1000}
                onComplete={handleSimulationComplete}
                className="h-full"
              />
            </motion.div>
          </div>
          
          {/* Right column */}
          <div className="space-y-6">
            {/* Progress towards goal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-5 rounded-xl border bg-card"
            >
              <h2 className="text-lg font-medium mb-4">Progress to Goal</h2>
              
              <div className="flex justify-center">
                <ProgressRing progress={progress} size={160} strokeWidth={6}>
                  <div className="text-center">
                    <div className="text-3xl font-medium tracking-tight">
                      {(progress * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      of daily goal
                    </div>
                  </div>
                </ProgressRing>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <ValueDisplay 
                  label="Current" 
                  value={accountBalance} 
                  prefix="$" 
                />
                <ValueDisplay 
                  label="Target" 
                  value={1000} 
                  prefix="$" 
                  labelClassName="text-right"
                  valueClassName="text-right"
                />
              </div>
            </motion.div>
            
            {/* Recent transactions */}
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
