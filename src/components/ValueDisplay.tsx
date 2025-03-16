
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ValueDisplayProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  trend?: 'up' | 'down' | 'neutral';
  decimals?: number;
}

const ValueDisplay = ({
  label,
  value,
  prefix = '',
  suffix = '',
  className = '',
  labelClassName = '',
  valueClassName = '',
  trend = 'neutral',
  decimals = 2
}: ValueDisplayProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  useEffect(() => {
    if (value !== prevValue) {
      setPrevValue(displayValue);
      setDisplayValue(value);
    }
  }, [value, prevValue, displayValue]);

  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(displayValue);

  const trendColor = 
    trend === 'up' ? 'text-green-500' :
    trend === 'down' ? 'text-red-500' :
    '';

  return (
    <div className={cn("flex flex-col", className)}>
      <span className={cn("text-xs text-muted-foreground font-medium mb-1", labelClassName)}>
        {label}
      </span>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={formattedValue}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn("flex items-baseline", trendColor, valueClassName)}
          >
            {prefix && <span className="text-sm mr-0.5">{prefix}</span>}
            <span className="text-2xl font-medium tracking-tight">{formattedValue}</span>
            {suffix && <span className="text-sm ml-0.5">{suffix}</span>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ValueDisplay;
