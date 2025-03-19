
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Percent } from 'lucide-react';
import StatCard from '@/components/StatCard';

interface DashboardStatsProps {
  accountBalance: number;
  dailyProfit: number;
  profitPercentage: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  accountBalance,
  dailyProfit,
  profitPercentage
}) => {
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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
    >
      <motion.div variants={itemVariants}>
        <StatCard
          title="Kontobalans"
          value={`$${accountBalance.toLocaleString(undefined, { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`}
          icon={DollarSign}
          description="Nuvarande handelskapital"
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <StatCard
          title="Daglig vinst"
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
          title="Avkastning"
          value={`${profitPercentage.toFixed(2)}%`}
          icon={Percent}
          description="Avkastning på investering"
          trend={
            profitPercentage !== 0 
              ? { value: profitPercentage, isPositive: profitPercentage > 0 } 
              : undefined
          }
        />
      </motion.div>
    </motion.div>
  );
};

export default DashboardStats;
