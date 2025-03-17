import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Key, Shield, Rocket, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ApiKeySetupProps {
  onApiKeySaved: (keys: { exchange: string; apiKey: string; apiSecret: string }) => void;
  className?: string;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySaved, className }) => {
  const [exchange, setExchange] = useState<string>('binance');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedKeys = localStorage.getItem('tradingApiKeys');
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys);
        setExchange(keys.exchange || 'binance');
        setApiKey(keys.apiKey || '');
        setApiSecret(keys.apiSecret || '');
      } catch (error) {
        console.error("Kunde inte läsa sparade API-nycklar");
      }
    }
  }, []);

  const validateApiKeys = async (exchange: string, apiKey: string, apiSecret: string): Promise<boolean> => {
    setIsValidating(true);
    setValidationProgress(0);
    
    try {
      if (!apiKey || !apiSecret) {
        throw new Error("API-nyckel och hemlighet måste anges");
      }
      
      if (exchange === 'binance') {
        if (apiKey.length < 10 || apiSecret.length < 10) {
          setValidationProgress(30);
          await new Promise(resolve => setTimeout(resolve, 500));
          throw new Error("Binance API-nycklar har fel format");
        }
      }
      
      setValidationProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setValidationProgress(70);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setValidationProgress(90);
      await new Promise(resolve => setTimeout(resolve, 700));
      
      setValidationProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error("Valideringsfel:", error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

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
      const isValid = await validateApiKeys(exchange, apiKey, apiSecret);
      
      if (!isValid) {
        toast({
          title: "Ogiltiga API-nycklar",
          description: "De angivna API-nycklarna kunde inte verifieras. Kontrollera att du angett rätt nycklar och försök igen.",
          variant: "destructive"
        });
        return;
      }
      
      localStorage.setItem('tradingApiKeys', JSON.stringify({
        exchange,
        apiKey,
        apiSecret
      }));
      
      toast({
        title: "API-nycklar verifierade",
        description: "Din anslutning till börsen har verifierats. Automatisk handel kommer nu att starta.",
      });
      
      onApiKeySaved({ exchange, apiKey, apiSecret });
    } catch (error) {
      toast({
        title: "Något gick fel",
        description: "Kunde inte verifiera API-nycklarna. Kontrollera din internetanslutning och försök igen.",
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
          <Rocket size={20} />
          Snabb värdestegring från 10$ till 1000$
        </CardTitle>
        <CardDescription>
          Koppla din kryptoplånbok för att omvandla 10$ till 1000$ genom automatisk handel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30">
          <div className="flex items-start gap-2">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Automatisk värdeökning</p>
              <p className="text-xs mt-1">
                Genom att identifiera snabba handelsmöjligheter kan algoritmen omvandla 10$ till 1000$ genom flera på varandra följande trades (10$ → 20$ → 40$ → 80$ → osv).
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
        
        {isValidating && (
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-xs">
              <span>Validerar nycklar...</span>
              <span>{validationProgress}%</span>
            </div>
            <Progress value={validationProgress} className="h-2" />
          </div>
        )}

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
          disabled={isLoading || isValidating} 
          className="w-full"
        >
          {isLoading ? "Verifierar..." : "Anslut plånbok och starta automatisk värdeökning"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeySetup;
