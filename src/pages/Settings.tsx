
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  CreditCard, 
  Bell, 
  RefreshCw,
  Check,
  ChevronRight
} from 'lucide-react';
import Header from '@/components/Header';

const Settings = () => {
  const [autoTrading, setAutoTrading] = useState(false);
  const [riskLevel, setRiskLevel] = useState(50); // 0-100
  const [notifications, setNotifications] = useState(true);
  
  // Container animation variants
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
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-medium tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and trading preferences</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="md:col-span-1"
          >
            <nav className="space-y-1">
              {[
                { icon: User, name: 'Account', active: true },
                { icon: CreditCard, name: 'Payment Methods' },
                { icon: Bell, name: 'Notifications' },
                { icon: Shield, name: 'Security' },
                { icon: SettingsIcon, name: 'Preferences' }
              ].map((item) => (
                <motion.button
                  key={item.name}
                  variants={itemVariants}
                  whileHover={{ x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${
                    item.active 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-secondary text-foreground'
                  }`}
                >
                  <item.icon size={16} className="mr-2 shrink-0" />
                  <span>{item.name}</span>
                </motion.button>
              ))}
            </nav>
          </motion.div>
          
          {/* Main content */}
          <div className="md:col-span-3 space-y-6">
            {/* Trading settings */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 rounded-xl border bg-card"
            >
              <h2 className="text-xl font-medium mb-4">Trading Settings</h2>
              
              <div className="space-y-5">
                {/* Auto-trading toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Automated Trading</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enable AI-powered automated trading
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setAutoTrading(!autoTrading)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoTrading ? 'bg-primary' : 'bg-secondary'
                    }`}
                  >
                    <span className="sr-only">
                      {autoTrading ? 'Disable' : 'Enable'} automated trading
                    </span>
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        autoTrading ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Risk tolerance slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Risk Tolerance</h3>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {riskLevel}%
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Conservative</span>
                    <span>Balanced</span>
                    <span>Aggressive</span>
                  </div>
                </div>
                
                {/* Trading frequency */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Trading Frequency</h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map((level) => (
                      <button
                        key={level}
                        className={`py-2 rounded-md text-xs font-medium transition ${
                          level === 'Medium'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
            
            {/* Notification preferences */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6 rounded-xl border bg-card"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium">Notifications</h2>
                
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span className="sr-only">
                    {notifications ? 'Disable' : 'Enable'} notifications
                  </span>
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'Trade Executions', desc: 'Get notified when trades are executed', enabled: true },
                  { name: 'Daily Reports', desc: 'Receive daily performance reports', enabled: true },
                  { name: 'Price Alerts', desc: 'Notifications for significant price movements', enabled: false },
                  { name: 'News Updates', desc: 'Important market news and events', enabled: false }
                ].map((item) => (
                  <div 
                    key={item.name} 
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-secondary/50"
                  >
                    <div>
                      <h3 className="text-sm font-medium">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    
                    <div className="w-5 h-5 rounded-full flex items-center justify-center">
                      {item.enabled ? (
                        <Check size={16} className="text-primary" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
            
            {/* Account verification */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="p-6 rounded-xl border bg-card"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-medium">Account Verification</h2>
                <div className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-500">
                  Pending
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                Complete verification to unlock advanced trading features and higher trading limits.
              </p>
              
              <button className="flex items-center justify-center w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                <RefreshCw size={16} className="mr-2" />
                Complete Verification
              </button>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
