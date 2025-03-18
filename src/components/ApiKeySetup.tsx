
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Shield, Key } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { validateApiKeys } from '@/utils/binanceApi';

interface ApiKeySetupProps {
  onApiKeySaved: (keys: { exchange: string; apiKey: string; apiSecret: string }) => void;
  className?: string;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onApiKeySaved, className }) => {
  const [apiKey, setApiKey] = useState<string>('jZg4QAd8uVrQmPkBdk9Jb0x7Ea1VR9HqyZCj4SK08Y7LAj6ZhnFnCngo6h2pVI9X');
  const [apiSecret, setApiSecret] = useState<string>('Tm3Oi8VI7DohWt4rreHENy10OWY4q9HToMd7lOV8JJOMCma5UM5A2INlW9rJH0vP');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const { toast } = useToast();

  // Validate API keys whenever they change
  useEffect(() => {
    const validateKeys = async () => {
      if (apiKey.length >= 10 && apiSecret.length >= 10) {
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
            // Save to localStorage
            localStorage.setItem('tradingApiKeys', JSON.stringify({
              exchange: 'binance',
              apiKey,
              apiSecret
            }));
          } else {
            setIsValid(false);
            setValidationError("API-nycklarna kunde inte verifieras. Kontrollera att du har angett rätt nycklar.");
          }
        } catch (error) {
          console.error("API-valideringsfel:", error);
          setIsValid(false);
          setValidationError("Ett tekniskt fel uppstod vid validering av nycklarna");
        } finally {
          setIsValidating(false);
        }
      }
    };
    
    validateKeys();
  }, [apiKey, apiSecret]);

  const handleSaveKeys = () => {
    if (!isValid) {
      toast({
        title: "Ogiltiga API-nycklar",
        description: "Var god validera dina API-nycklar först.",
        variant: "destructive"
      });
      return;
    }

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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key size={20} />
          Anslut till Binance
        </CardTitle>
        <CardDescription>
          Ange dina API-nycklar för att börja handla
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30">
          <Shield className="h-4 w-4" />
          <AlertTitle>Säker anslutning</AlertTitle>
          <AlertDescription>
            Dina API-nycklar sparas säkert i din webbläsare och används endast för att ansluta till Binance.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-medium">API-nyckel</label>
          <Input 
            type="text" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Ange din API-nyckel"
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">API-hemlighet</label>
          <Input 
            type="password" 
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Ange din API-hemlighet"
            className="font-mono text-sm"
          />
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
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Valideringsfel</AlertTitle>
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        
        {isValid && !isValidating && (
          <Alert className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/30">
            <Shield className="h-4 w-4" />
            <AlertTitle>API-nycklar validerade</AlertTitle>
            <AlertDescription>
              Dina API-nycklar har verifierats och är redo att användas.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSaveKeys} 
          disabled={!isValid || isValidating}
          className="w-full mt-4"
        >
          {isValidating ? "Validerar..." : "Spara API-nycklar"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ApiKeySetup;
