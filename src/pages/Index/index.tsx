
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import ApiKeySetup from '@/components/ApiKeySetup';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import DashboardStats from './components/DashboardStats';
import ProgressCard from './components/ProgressCard';
import RecentTransactions from './components/RecentTransactions';
import TradingTabs from './components/TradingTabs';

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
  const [apiConfig, setApiConfig] = useState<{
    exchange: string;
    apiKey: string;
    apiSecret: string;
  } | null>(null);
  const { toast } = useToast();
  
  const targetAmount = 1000;
  
  useEffect(() => {
    const savedKeys = localStorage.getItem('tradingApiKeys');
    if (savedKeys) {
      try {
        const parsedKeys = JSON.parse(savedKeys);
        setApiConfig(parsedKeys);
        toast({
          title: "API-nycklar laddade",
          description: "Dina sparade API-nycklar har hämtats.",
        });
      } catch (e) {
        console.error('Failed to parse saved API keys');
        toast({
          variant: "destructive",
          title: "Fel vid laddning av API-nycklar",
          description: "Kunde inte läsa in dina sparade API-nycklar.",
        });
      }
    }
  }, []);
  
  const handleSimulationComplete = (finalAmount: number) => {
    setAccountBalance(finalAmount);
    const newProfit = finalAmount - 10; // Initial investment was $10
    setDailyProfit(newProfit);
    setProfitPercentage((newProfit / 10) * 100);
    setProgress(finalAmount / targetAmount);
  };
  
  const handleApiKeySaved = (keys: { exchange: string; apiKey: string; apiSecret: string }) => {
    setApiConfig(keys);
    toast({
      title: "API-nycklar sparade",
      description: "Din anslutning till börsen har konfigurerats.",
    });
  };
  
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
      <Toaster />
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
            Övervaka din handelsprestation
          </motion.p>
        </motion.div>
        
        <AnimatePresence mode="wait">
          {!apiConfig && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mb-8"
            >
              <ApiKeySetup onApiKeySaved={handleApiKeySaved} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {apiConfig && (
          <>
            <DashboardStats 
              accountBalance={accountBalance}
              dailyProfit={dailyProfit}
              profitPercentage={profitPercentage}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <TradingTabs 
                  apiConfig={apiConfig}
                  onApiKeySaved={handleApiKeySaved}
                  onSimulationComplete={handleSimulationComplete}
                />
              </div>
              
              <div className="space-y-6">
                <ProgressCard 
                  currentBalance={accountBalance}
                  targetAmount={targetAmount}
                  progress={progress}
                />
                
                <RecentTransactions transactions={transactions} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
