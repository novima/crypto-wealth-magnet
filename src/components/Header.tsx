
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'History', path: '/history' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <motion.header 
      className="sticky top-0 z-50 w-full"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-effect border-b px-6 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-1"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/')}
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-semibold text-sm">CW</span>
            </div>
            <span className="font-medium tracking-tight text-lg">Crypto Wealth</span>
          </motion.div>
          
          <nav className="hidden md:flex space-x-1">
            {links.map((link) => (
              <motion.button
                key={link.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  location.pathname === link.path 
                    ? "bg-secondary text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
                onClick={() => navigate(link.path)}
              >
                {link.name}
              </motion.button>
            ))}
          </nav>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-secondary text-foreground"
          >
            <span className="sr-only">User menu</span>
            <span className="text-sm font-medium">U</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
