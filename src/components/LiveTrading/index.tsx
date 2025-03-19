
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TradingHeader from '../TradingHeader';
import TradingStatus from '../TradingStatus';
import TradingControls from '../TradingControls';
import TradeHistory from '../TradeHistory';
import TradingComplete from '../TradingComplete';
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
    tradeHistory,
    dayCount,
    tradeSpeed,
    totalProfitReserved,
    autoTradeEnabled,
    dailyTargetReached,
    handleSpeedChange,
    setAutoTradeEnabled,
    refreshBalance
  } = useTrading(apiConfig, initialAmount, targetAmount, onComplete);

  const progress = Math.min((currentBalance / targetAmount) * 100, 100);

  return (
    <Card className={className}>
      <TradingHeader />
      
      <CardContent className="space-y-4">
        <TradingStatus
          currentBalance={currentBalance}
          targetAmount={targetAmount}
          dayCount={dayCount}
          totalProfitReserved={totalProfitReserved}
          onRefreshBalance={refreshBalance}
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
