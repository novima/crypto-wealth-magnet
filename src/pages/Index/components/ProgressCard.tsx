
import React from 'react';
import { motion } from 'framer-motion';
import ProgressRing from '@/components/ProgressRing';
import ValueDisplay from '@/components/ValueDisplay';

interface ProgressCardProps {
  currentBalance: number;
  targetAmount: number;
  progress: number;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  currentBalance,
  targetAmount,
  progress
}) => {
  return (
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
          value={currentBalance} 
          prefix="$" 
        />
        <ValueDisplay 
          label="Target" 
          value={targetAmount} 
          prefix="$" 
          labelClassName="text-right"
          valueClassName="text-right"
        />
      </div>
    </motion.div>
  );
};

export default ProgressCard;
