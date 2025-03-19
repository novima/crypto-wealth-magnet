
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TradingHeader from '@/components/TradingHeader';
import TradingStatus from '@/components/TradingStatus';
import TradingControls from '@/components/TradingControls';
import TradeHistory from '@/components/TradeHistory';
import TradingComplete from '@/components/TradingComplete';
import { useTrading } from './hooks/useTrading';

interface LiveTradingProps {
  apiConfig: {
    exchange: string;
    apiKey: string;
    apiSecret: string;
  };
  initialAmount: number;
  targetAmount: number;
  onComplete?: (finalAmount: number) => void;
  className?: string;
}

const LiveTrading: React.FC<LiveTradingProps> = ({
  apiConfig,
  initialAmount,
  targetAmount,
  onComplete,
  className
}) => {
  const {
    currentBalance,
    autoTradeEnabled,
    tradeHistory,
    dailyTargetReached,
    dayCount,
    tradeSpeed,
    totalProfitReserved,
    isInitializing,
    handleSpeedChange,
    setAutoTradeEnabled,
    progress
  } = useTrading(apiConfig, initialAmount, targetAmount, onComplete);

  return (
    <Card className={className}>
      <TradingHeader />
      
      <CardContent className="space-y-4">
        <TradingStatus
          currentBalance={currentBalance}
          targetAmount={targetAmount}
          dayCount={dayCount}
          totalProfitReserved={totalProfitReserved}
        />
        
        <TradingControls
          tradeSpeed={tradeSpeed}
          autoTradeEnabled={autoTradeEnabled}
          onSpeedChange={handleSpeedChange}
          onAutoTradeToggle={() => setAutoTradeEnabled(!autoTradeEnabled)}
          isDisabled={!apiConfig.apiKey || dailyTargetReached}
        />
        
        <TradeHistory trades={tradeHistory} />
      </CardContent>
      
      <TradingComplete 
        targetAmount={targetAmount}
        show={dailyTargetReached}
      />
    </Card>
  );
};

export default LiveTrading;
