
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Key, Shield } from 'lucide-react';

interface ApiKeySetupProps {
  onApiKeySaved: (keys: { exchange: string; apiKey: string; apiSecret: string }) => void;
  className?: string;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySaved, className }) => {
  const [exchange, setExchange] = useState<string>('binance');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleSaveKeys = async () => {
    if (!apiKey || !apiSecret) {
      toast({
        title: "Fyll i alla fält",
        description: "Både API-nyckel och API-hemlighet måste anges.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real app, we would validate these keys with the exchange's API
      // For now, we just simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to localStorage for demo purposes only
      // In production, these should NEVER be stored in localStorage
      // and instead should be handled securely on a backend
      localStorage.setItem('tradingApiKeys', JSON.stringify({
        exchange,
        apiKey,
        apiSecret
      }));
      
      toast({
        title: "API-nycklar sparade",
        description: "Din anslutning till börsen har konfigurerats. Du kan nu starta automatisk handel.",
      });
      
      onApiKeySaved({ exchange, apiKey, apiSecret });
    } catch (error) {
      toast({
        title: "Något gick fel",
        description: "Kunde inte verifiera API-nycklarna.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key size={20} />
          Anslut din kryptoplånbok
        </CardTitle>
        <CardDescription>
          Koppla din kryptoplånbok för att starta automatisk handel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30">
          <div className="flex items-start gap-2">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">Simpelt och automatiskt</p>
              <p className="text-xs mt-1">
                Koppla din plånbok och låt appen automatiskt handla för att nå ditt mål på $1000 per dag.
              </p>
            </div>
          </div>
        </Alert>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Välj börs</label>
          <Select value={exchange} onValueChange={setExchange}>
            <SelectTrigger>
              <SelectValue placeholder="Välj börs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="binance">Binance</SelectItem>
              <SelectItem value="coinbase">Coinbase Pro</SelectItem>
              <SelectItem value="kraken">Kraken</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">API-nyckel</label>
          <Input 
            type="text" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Ange din API-nyckel" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">API-hemlighet</label>
          <Input 
            type="password" 
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Ange din API-hemlighet" 
          />
        </div>

        <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Viktigt om säkerhet</p>
            <p className="mt-1">För att skydda dina tillgångar, skapa API-nycklar med begränsade behörigheter (endast handla, inte uttag) och aktivera IP-begränsning på börsen.</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveKeys} 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? "Verifierar..." : "Anslut plånbok och starta"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeySetup;
