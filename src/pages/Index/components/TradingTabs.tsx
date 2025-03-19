
import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TradingSimulation from '@/components/TradingSimulation';
import LiveTrading from '@/components/LiveTrading';
import ApiKeySetup from '@/components/ApiKeySetup';

interface TradingTabsProps {
  apiConfig: {
    exchange: string;
    apiKey: string;
    apiSecret: string;
  } | null;
  onApiKeySaved: (keys: { exchange: string; apiKey: string; apiSecret: string }) => void;
  onSimulationComplete: (finalAmount: number) => void;
}

const TradingTabs: React.FC<TradingTabsProps> = ({
  apiConfig,
  onApiKeySaved,
  onSimulationComplete
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Tabs defaultValue={apiConfig ? "live" : "simulation"} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="simulation">Simulering</TabsTrigger>
          <TabsTrigger value="live">Riktiga pengar</TabsTrigger>
        </TabsList>
        
        <TabsContent value="simulation" className="mt-0">
          <TradingSimulation 
            initialAmount={10} 
            targetAmount={1000}
            onComplete={onSimulationComplete}
            className="h-full"
          />
        </TabsContent>
        
        <TabsContent value="live" className="mt-0">
          {!apiConfig ? (
            <ApiKeySetup onApiKeySaved={onApiKeySaved} />
          ) : (
            <LiveTrading 
              apiConfig={apiConfig}
              initialAmount={10}
              targetAmount={1000}
              onComplete={onSimulationComplete}
            />
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default TradingTabs;
