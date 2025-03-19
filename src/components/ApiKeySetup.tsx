
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Key, CheckCircle, XCircle, ExternalLink, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { validateApiKeys, needsCorsActivation } from '@/utils/binanceApi';

interface ApiKeySetupProps {
  onApiKeySaved: (keys: { exchange: string; apiKey: string; apiSecret: string }) => void;
  className?: string;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySaved, className }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [apiSecret, setApiSecret] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [needsCorsActivationState, setNeedsCorsActivationState] = useState<boolean>(false);
  const { toast } = useToast();

  // Kontrollera om CORS-proxy behöver aktiveras
  useEffect(() => {
    const checkCorsProxy = async () => {
      try {
        const needsActivation = await needsCorsActivation();
        setNeedsCorsActivationState(needsActivation);
        
        if (needsActivation) {
          setValidationError("CORS-proxy behöver aktiveras. Klicka på länken nedan och följ instruktionerna.");
          toast({
            title: "CORS-proxy behöver aktiveras",
            description: "API-anrop till Binance kräver en aktiverad CORS-proxy. Klicka på knappen i formuläret.",
            variant: "destructive"
          });
        }
      } catch (e) {
        console.error('Error checking CORS proxy:', e);
        setNeedsCorsActivationState(true);
      }
    };
    
    checkCorsProxy();
  }, [toast]);

  // Ladda sparade nycklar från localStorage om de finns
  useEffect(() => {
    const savedKeys = localStorage.getItem('tradingApiKeys');
    if (savedKeys) {
      try {
        const { apiKey: savedApiKey, apiSecret: savedApiSecret } = JSON.parse(savedKeys);
        setApiKey(savedApiKey || '');
        setApiSecret(savedApiSecret || '');
      } catch (e) {
        console.error('Kunde inte läsa sparade API-nycklar:', e);
      }
    }
  }, []);

  // Validera API-nycklar när de ändras
  useEffect(() => {
    const validateKeys = async () => {
      if (apiKey.length >= 10 && apiSecret.length >= 10 && !needsCorsActivationState) {
        setIsValidating(true);
        setValidationProgress(0);
        setValidationError(null);
        
        try {
          setValidationProgress(30);
          const isValid = await validateApiKeys(apiKey, apiSecret);
          setValidationProgress(100);
          
          if (isValid) {
            setIsValid(true);
            setValidationError(null);
            toast({
              title: "API-nycklar validerade",
              description: "Dina nycklar är giltiga och redo att användas.",
            });
          } else {
            setIsValid(false);
            setValidationError("API-nycklarna kunde inte verifieras. Kontrollera att du har angett rätt nycklar och att IP-begränsningar tillåter din nuvarande IP.");
          }
        } catch (error) {
          console.error("API-valideringsfel:", error);
          
          if (error instanceof Error && error.message === 'CORS_PROXY_NEEDS_ACTIVATION') {
            setNeedsCorsActivationState(true);
            setValidationError("CORS-proxy behöver aktiveras. Klicka på länken nedan och följ instruktionerna.");
          } else {
            setIsValid(false);
            setValidationError("Ett tekniskt fel uppstod vid validering av nycklarna");
          }
        } finally {
          setIsValidating(false);
        }
      } else {
        setIsValid(false);
        if (needsCorsActivationState) {
          setValidationError("CORS-proxy behöver aktiveras. Klicka på länken nedan och följ instruktionerna.");
        } else if (apiKey.length > 0 || apiSecret.length > 0) {
          setValidationError("API-nycklar är för korta. Varje nyckel måste vara minst 10 tecken.");
        } else {
          setValidationError(null);
        }
      }
    };
    
    // Använd en timeout för att inte validera vid varje knapptryck
    const timeoutId = setTimeout(validateKeys, 1000);
    return () => clearTimeout(timeoutId);
  }, [apiKey, apiSecret, toast, needsCorsActivationState]);

  const handleSaveKeys = () => {
    if (!isValid) {
      toast({
        title: "Ogiltiga API-nycklar",
        description: "Var god validera dina API-nycklar först.",
        variant: "destructive"
      });
      return;
    }

    // Spara i localStorage
    localStorage.setItem('tradingApiKeys', JSON.stringify({
      exchange: 'binance',
      apiKey,
      apiSecret
    }));

    onApiKeySaved({ 
      exchange: 'binance', 
      apiKey, 
      apiSecret 
    });
    
    toast({
      title: "API-nycklar sparade",
      description: "Din anslutning till börsen har sparats.",
    });
  };

  const handleActivateCorsProxy = () => {
    window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
    toast({
      title: "CORS-proxy aktivering",
      description: "En ny flik har öppnats. Klicka på 'Request temporary access to the demo server' och återvänd sedan hit.",
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Anslut till Binance
        </CardTitle>
        <CardDescription>
          Ange dina API-nycklar för att börja handla
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {needsCorsActivationState && (
          <Alert className="bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30">
            <Info className="h-4 w-4" />
            <AlertTitle>CORS-proxy måste aktiveras</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>För att kunna använda Binance API behöver du aktivera CORS-proxyn:</p>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 mt-2"
                onClick={handleActivateCorsProxy}
              >
                <ExternalLink className="h-4 w-4" />
                Aktivera CORS-proxy
              </Button>
              <p className="text-xs">Efter aktivering, återvänd hit och fortsätt med API-nycklarna.</p>
              <p className="text-xs">När du skapar API-nycklar på Binance, lägg till din nuvarande IP-adress: <strong>{window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname}</strong></p>
            </AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30">
          <Shield className="h-4 w-4" />
          <AlertTitle>Säker anslutning</AlertTitle>
          <AlertDescription>
            Dina API-nycklar sparas säkert i din webbläsare och används endast för att ansluta till Binance.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-medium">API-nyckel</label>
          <div className="relative">
            <Input 
              type="text" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ange din API-nyckel"
              className="font-mono text-sm pr-8"
              disabled={needsCorsActivationState}
            />
            {apiKey.length >= 10 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">API-hemlighet</label>
          <div className="relative">
            <Input 
              type="password" 
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Ange din API-hemlighet"
              className="font-mono text-sm pr-8"
              disabled={needsCorsActivationState}
            />
            {apiSecret.length >= 10 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>
        
        {isValidating && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Validerar nycklar...</span>
              <span>{validationProgress}%</span>
            </div>
            <Progress value={validationProgress} className="h-2" />
          </div>
        )}
        
        {validationError && !isValidating && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Valideringsfel</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        
        {isValid && !isValidating && (
          <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/30">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>API-nycklar validerade</AlertTitle>
            <AlertDescription>
              Dina API-nycklar har verifierats och är redo att användas.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleSaveKeys} 
          disabled={!isValid || isValidating || needsCorsActivationState}
          className="w-full"
        >
          {isValidating ? "Validerar..." : "Spara API-nycklar"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeySetup;
