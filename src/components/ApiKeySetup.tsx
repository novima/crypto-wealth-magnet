
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Key, Shield, Rocket, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { validateApiKeys } from '@/utils/binanceApi';

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
  const [validationError, setValidationError] = useState<string | null>(null);
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

  const handleBinanceApiValidation = async (): Promise<boolean> => {
    setIsValidating(true);
    setValidationProgress(0);
    setValidationError(null);
    
    try {
      // Kontrollera att nycklar är angivna
      if (!apiKey || !apiSecret) {
        setValidationError("API-nyckel och hemlighet måste anges");
        return false;
      }
      
      // Grundläggande formatvalidering
      if (apiKey.length < 10 || apiSecret.length < 10) {
        setValidationProgress(30);
        await new Promise(resolve => setTimeout(resolve, 500));
        setValidationError("API-nycklar har fel format");
        return false;
      }
      
      setValidationProgress(30);
      
      // Verklig validering mot Binance API
      const isValid = await validateApiKeys(apiKey, apiSecret);
      
      setValidationProgress(isValid ? 100 : 60);
      
      if (!isValid) {
        setValidationError("API-nycklarna kunde inte verifieras. Kontrollera att du har angett rätt nycklar och att de har rätt behörigheter.");
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error("API-valideringsfel:", error);
      setValidationError("Ett tekniskt fel uppstod vid validering av nycklarna");
      return false;
    } finally {
      setTimeout(() => {
        setIsValidating(false);
      }, 500);
    }
  };

  const validateApiKeysForExchange = async (): Promise<boolean> => {
    // Här kan vi lägga till stöd för fler börser i framtiden
    if (exchange === 'binance') {
      return await handleBinanceApiValidation();
    }
    
    // För andra börser kan vi implementera deras specifika validering här
    setValidationError(`Validering för ${exchange} är inte implementerad ännu`);
    return false;
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
      const isValid = await validateApiKeysForExchange();
      
      if (!isValid) {
        toast({
          title: "Ogiltiga API-nycklar",
          description: validationError || "De angivna API-nycklarna kunde inte verifieras. Kontrollera att du angett rätt nycklar och försök igen.",
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
              <SelectItem value="coinbase" disabled>Coinbase Pro (Kommer snart)</SelectItem>
              <SelectItem value="kraken" disabled>Kraken (Kommer snart)</SelectItem>
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
              <span>Validerar nycklar mot Binance API...</span>
              <span>{validationProgress}%</span>
            </div>
            <Progress value={validationProgress} className="h-2" />
          </div>
        )}
        
        {validationError && !isValidating && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Valideringsfel</AlertTitle>
            <AlertDescription>
              {validationError}
            </AlertDescription>
          </Alert>
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
