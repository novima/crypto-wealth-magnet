
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { CardFooter } from '@/components/ui/card';

interface TradingCompleteProps {
  targetAmount: number;
  show: boolean;
}

const TradingComplete: React.FC<TradingCompleteProps> = ({ targetAmount, show }) => {
  if (!show) return null;

  return (
    <CardFooter>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md"
      >
        <div className="flex items-center">
          <CheckCircle2 size={16} className="mr-2" />
          <p>Grattis! Du har nått dagens mål på ${targetAmount}. 30% av vinsten (${(targetAmount * 0.3).toFixed(2)}) har överförts till ditt Binance-konto, och 70% används för fortsatt handel nästa dag.</p>
        </div>
      </motion.div>
    </CardFooter>
  );
};

export default TradingComplete;
