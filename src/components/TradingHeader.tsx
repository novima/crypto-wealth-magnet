
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Rocket } from 'lucide-react';

const TradingHeader = () => (
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Rocket size={20} />
      Live-handel: 10$ → 1000$
    </CardTitle>
    <CardDescription>
      Handel med riktiga pengar via Binance
    </CardDescription>
  </CardHeader>
);

export default TradingHeader;
