
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Filter, ArrowUpDown } from 'lucide-react';
import Header from '@/components/Header';
import TransactionCard, { Transaction } from '@/components/TransactionCard';

// Sample data - more comprehensive for history page
const sampleTransactions: Transaction[] = [
  {
    id: 't1',
    type: 'buy',
    amount: 0.0025,
    currency: 'BTC',
    price: 58725.42,
    timestamp: new Date(Date.now() - 25 * 60000),
    status: 'completed'
  },
  {
    id: 't2',
    type: 'sell',
    amount: 0.0018,
    currency: 'BTC',
    price: 58932.10,
    timestamp: new Date(Date.now() - 125 * 60000),
    status: 'completed'
  },
  {
    id: 't3',
    type: 'buy',
    amount: 0.0031,
    currency: 'BTC',
    price: 58541.23,
    timestamp: new Date(Date.now() - 240 * 60000),
    status: 'completed'
  },
  {
    id: 't4',
    type: 'buy',
    amount: 0.0015,
    currency: 'ETH',
    price: 3245.18,
    timestamp: new Date(Date.now() - 300 * 60000),
    status: 'completed'
  },
  {
    id: 't5',
    type: 'sell',
    amount: 0.0022,
    currency: 'ETH',
    price: 3289.75,
    timestamp: new Date(Date.now() - 420 * 60000),
    status: 'completed'
  },
  {
    id: 't6',
    type: 'buy',
    amount: 0.0018,
    currency: 'BTC',
    price: 58125.30,
    timestamp: new Date(Date.now() - 540 * 60000),
    status: 'pending'
  },
  {
    id: 't7',
    type: 'sell',
    amount: 0.0012,
    currency: 'BTC',
    price: 57980.45,
    timestamp: new Date(Date.now() - 660 * 60000),
    status: 'failed'
  },
  {
    id: 't8',
    type: 'buy',
    amount: 0.0027,
    currency: 'ETH',
    price: 3210.22,
    timestamp: new Date(Date.now() - 720 * 60000),
    status: 'completed'
  }
];

const History = () => {
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  
  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (searchTerm && !transaction.currency.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filterType !== 'all' && transaction.type !== filterType) {
      return false;
    }
    
    // Status filter
    if (filterStatus !== 'all' && transaction.status !== filterStatus) {
      return false;
    }
    
    return true;
  });
  
  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
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
          <h1 className="text-3xl font-medium tracking-tight mb-2">Transaction History</h1>
          <p className="text-muted-foreground">View and filter your past transactions</p>
        </motion.div>
        
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={16} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search by currency..."
              className="w-full pl-10 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Type filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Filter size={16} className="text-muted-foreground" />
            </div>
            <select
              className="w-full pl-10 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'buy' | 'sell')}
            >
              <option value="all">All Types</option>
              <option value="buy">Buy Orders</option>
              <option value="sell">Sell Orders</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ArrowUpDown size={16} className="text-muted-foreground" />
            </div>
          </div>
          
          {/* Status filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Calendar size={16} className="text-muted-foreground" />
            </div>
            <select
              className="w-full pl-10 pr-4 py-2 rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'pending' | 'failed')}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ArrowUpDown size={16} className="text-muted-foreground" />
            </div>
          </div>
        </motion.div>
        
        {/* Transactions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredTransactions.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No transactions match your filters</p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <motion.div 
                key={transaction.id} 
                variants={itemVariants}
              >
                <TransactionCard transaction={transaction} />
              </motion.div>
            ))
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default History;
