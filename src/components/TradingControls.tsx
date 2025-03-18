
import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface TradingControlsProps {
  tradeSpeed: number;
  autoTradeEnabled: boolean;
  onSpeedChange: (speed: number) => void;
  onAutoTradeToggle: () => void;
  isDisabled: boolean;
}

const TradingControls: React.FC<TradingControlsProps> = ({
  tradeSpeed,
  autoTradeEnabled,
  onSpeedChange,
  onAutoTradeToggle,
  isDisabled
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-secondary/30 p-3 rounded-md">
        <div className="text-sm font-medium mb-2">Handelshastighet: {tradeSpeed} trades/minut</div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSpeedChange(1)}
            className={tradeSpeed === 1 ? "bg-primary text-primary-foreground" : ""}
          >
            Låg
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSpeedChange(3)}
            className={tradeSpeed === 3 ? "bg-primary text-primary-foreground" : ""}
          >
            Medium
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSpeedChange(5)}
            className={tradeSpeed === 5 ? "bg-primary text-primary-foreground" : ""}
          >
            Hög
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onSpeedChange(10)}
            className={tradeSpeed === 10 ? "bg-primary text-primary-foreground" : ""}
          >
            Turbo
          </Button>
        </div>
      </div>
      
      <Button 
        onClick={onAutoTradeToggle}
        disabled={isDisabled}
        variant={autoTradeEnabled ? "destructive" : "default"}
        className="w-full mt-6 py-6 text-base"
        size="lg"
      >
        <Zap size={20} className="mr-2" />
        {autoTradeEnabled 
          ? "Stoppa automatisk handel" 
          : "Starta automatisk handel med mina pengar"}
      </Button>
      
      <div className="text-xs text-center text-muted-foreground mt-1">
        {autoTradeEnabled 
          ? "Algoritmen handlar automatiskt för att nå ditt mål på 1000$" 
          : "Klicka för att låta algoritmen handla automatiskt för att nå ditt mål"}
      </div>
    </div>
  );
};

export default TradingControls;
