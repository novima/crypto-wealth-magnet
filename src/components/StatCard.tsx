
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "p-5 rounded-xl border bg-card shadow-subtle hover:shadow-elevated transition-all",
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {Icon && (
          <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Icon size={18} />
          </div>
        )}
      </div>
      
      <div className="mb-1">
        <span className="text-2xl font-medium tracking-tight">{value}</span>
      </div>
      
      {(trend || description) && (
        <div className="flex items-center">
          {trend && (
            <span className={cn(
              "text-xs font-medium mr-2",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
          
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
