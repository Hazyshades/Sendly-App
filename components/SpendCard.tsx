import { useState, useEffect } from 'react';
import { Camera, Gift, Lock, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import web3Service from '../utils/web3/web3Service';
import { USDC_ADDRESS } from '../utils/web3/constants';

interface RedeemableCard {
  tokenId: string;
  amount: string;
  currency: 'USDC' | 'USDT';
  design: string;
  message: string;
  secretMessage?: string;
  sender: string;
  hasPassword: boolean;
  hasTimer: boolean;
  timerEndsAt?: string;
  expiresAt?: string;
  status: 'valid' | 'expired' | 'redeemed' | 'locked';
  metadataUri?: string;
}

interface SpendCardProps {
  selectedTokenId?: string;
  onClearTokenId: () => void;
}

export function SpendCard({ selectedTokenId = '', onClearTokenId }: SpendCardProps) {
  const { address, isConnected } = useAccount();
  const [cardInput, setCardInput] = useState('');
  const [password, setPassword] = useState('');
  const [currentCard, setCurrentCard] = useState<RedeemableCard | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const [redeemStep, setRedeemStep] = useState<'input' | 'verify' | 'redeem' | 'success'>('input');
  const [error, setError] = useState('');

  // Service URLs for redirect
  const serviceUrls = {
    amazon: "https://www.amazon.com/gift-cards/",
    apple: "https://www.apple.com/uk/shop/gift-cards",
    airbnb: "https://www.airbnb.com/giftcards"
  };

  // Auto-fill Token ID if provided from MyCards
  useEffect(() => {
    if (selectedTokenId && selectedTokenId !== cardInput) {
      setCardInput(selectedTokenId);
      // Clear the selectedTokenId after using it
      onClearTokenId();
    }
  }, [selectedTokenId, cardInput, onClearTokenId]);

  // Auto-lookup when cardInput changes and is not empty
  useEffect(() => {
    if (cardInput && cardInput.trim() !== '' && isConnected) {
      handleCardLookup();
    }
  }, [cardInput, isConnected]);

  const lookupCard = async (tokenId: string): Promise<RedeemableCard | null> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected');
    }



    try {
      // Initialize web3 service
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum)
      });

      await web3Service.initialize(walletClient, address);

      // Get gift card info from blockchain

      const giftCardInfo = await web3Service.getGiftCardInfo(tokenId);
      
      if (!giftCardInfo) {
        return null;
      }

      // Check if user owns this card
      const owner = await web3Service.getCardOwner(tokenId);
      if (owner.toLowerCase() !== address.toLowerCase()) {
        throw new Error('You do not own this gift card');
      }

      // Get the original creator of the card
      const creator = await web3Service.getCardCreator(tokenId);

      // Format amount properly 
      const formattedAmount = (Number(giftCardInfo.amount) / 1000000).toString();
      const tokenSymbol = giftCardInfo.token.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'USDT';

      // Format creator address (show first 6 and last 4 characters)
      const formattedCreator = creator ? `${creator.slice(0, 6)}...${creator.slice(-4)}` : 'Unknown';

      return {
        tokenId,
        amount: formattedAmount,
        currency: tokenSymbol,
        design: 'pink', // Default design, could be extracted from metadata
        message: giftCardInfo.message,
        sender: formattedCreator,
        hasPassword: false, // Not implemented in current contract
        hasTimer: false, // Not implemented in current contract
        status: giftCardInfo.redeemed ? 'redeemed' : 'valid'
      };
    } catch (error) {
      console.error('Error looking up card:', error);
      throw error;
    }
  };

  const handleCardLookup = async () => {
    setError('');

    
    try {
      const card = await lookupCard(cardInput);
      
      if (!card) {
        setError('Gift card not found. Please check the token ID and try again.');
        return;
      }

      if (card.status === 'redeemed') {
        setError('This gift card has already been redeemed.');
        return;
      }

      if (card.status === 'expired') {
        setError('This gift card has expired.');
        return;
      }

      if (card.status === 'locked' && card.hasTimer) {
        setError('This gift card is still locked. Please wait for the timer to expire.');
        return;
      }

      setCurrentCard(card);
      setRedeemStep(card.hasPassword ? 'verify' : 'redeem');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error looking up gift card. Please try again.');
    }
  };

  const handlePasswordVerification = () => {
    if (!password) {
      setError('Please enter the password.');
      return;
    }

    // For testing, use simple password
    if (password === '1234') {
      setError('');
      setRedeemStep('redeem');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handleRedeem = async () => {
    if (!currentCard || !isConnected || !address) return;
    
    if (!selectedService) {
      setError('Please select a service to spend your gift card on.');
      return;
    }

    try {
      // Initialize web3 service
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum)
      });

      await web3Service.initialize(walletClient, address);

      // Redeem gift card on blockchain
      await web3Service.redeemGiftCard(currentCard.tokenId);
      
      setRedeemStep('success');
      toast.success(`Gift card redeemed successfully for ${selectedService.charAt(0).toUpperCase() + selectedService.slice(1)}!`);
      
      // Update card status
      setCurrentCard(prev => prev ? { ...prev, status: 'redeemed' } : null);
      
      // Redirect to service page after 2 seconds
      setTimeout(() => {
        if (selectedService && serviceUrls[selectedService as keyof typeof serviceUrls]) {
          window.open(serviceUrls[selectedService as keyof typeof serviceUrls], '_blank');
        }
      }, 2000);
      

    } catch (error) {
      console.error('Error redeeming card:', error);
      setError(error instanceof Error ? error.message : 'Failed to redeem gift card. Please try again.');
    }
  };



  const getCardColor = (design: string) => {
    switch (design) {
      case 'pink': return 'from-pink-400 to-purple-500';
      case 'blue': return 'from-blue-400 to-cyan-500';
      case 'green': return 'from-green-400 to-emerald-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const resetForm = () => {
    setCardInput('');
    setPassword('');
    setCurrentCard(null);
    setSelectedService(null);

    setRedeemStep('input');
    setError('');
  };

  if (!isConnected) {
    return (
      <div className="p-6 text-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to redeem gift cards
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Spend a gift card</h2>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Enter manually</TabsTrigger>
          <TabsTrigger value="scan">Scan QR code</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          {redeemStep === 'input' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardId">Gift card token ID</Label>
                <Input
                  id="cardId"
                  placeholder="Enter gift card token ID (e.g., 1, 2, 3...)"
                  value={cardInput}
                  onChange={(e) => setCardInput(e.target.value)}
                />
              </div>
              <Button onClick={handleCardLookup} className="w-full">
                Look up card
              </Button>
            </div>
          )}

          {redeemStep === 'verify' && currentCard && (
            <div className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  This gift card is password protected. Please enter the password to continue.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handlePasswordVerification} className="flex-1">
                  Verify password
                </Button>
                <Button variant="outline" onClick={() => setRedeemStep('input')}>
                  Back
                </Button>
              </div>
            </div>
          )}

          {redeemStep === 'redeem' && currentCard && (
            <div className="space-y-4">
              <Card className={`bg-gradient-to-br ${getCardColor(currentCard.design)} text-white border-0`}>
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <Gift className="w-6 h-6" />
                      <span className="text-lg font-medium">Gift Card</span>
                    </div>
                    
                    <div className="text-4xl font-bold">
                      ${currentCard.amount}
                    </div>
                    
                    <div className="text-sm opacity-90">
                      {currentCard.currency}
                    </div>
                    
                    <div className="text-sm bg-white/20 rounded-lg p-3">
                      "{currentCard.message}"
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center">
                      {currentCard.hasTimer && (
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          <Clock className="w-3 h-3 mr-1" />
                          Timer
                        </Badge>
                      )}
                      {currentCard.hasPassword && (
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          <Lock className="w-3 h-3 mr-1" />
                          Protected
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Selection */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 text-center">Choose where to spend your gift card:</h4>
                <div className="flex justify-center gap-4">
                  {/* Airbnb */}
                  <div 
                    className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
                      selectedService === 'airbnb' ? 'scale-110' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedService('airbnb')}
                  >
                    <div className={`w-16 h-16 rounded-lg overflow-hidden shadow-sm mb-2 border-2 transition-all duration-200 ${
                      selectedService === 'airbnb' ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'
                    }`}>
                      <img 
                        src="/airbnb.jpg" 
                        alt="Airbnb" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`text-xs font-medium transition-colors ${
                      selectedService === 'airbnb' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      Airbnb
                    </span>
                  </div>

                  {/* Amazon */}
                  <div 
                    className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
                      selectedService === 'amazon' ? 'scale-110' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedService('amazon')}
                  >
                    <div className={`w-16 h-16 rounded-lg overflow-hidden shadow-sm mb-2 border-2 transition-all duration-200 ${
                      selectedService === 'amazon' ? 'border-orange-500 shadow-lg' : 'border-gray-200 hover:border-orange-300'
                    }`}>
                      <img 
                        src="/amazon.jpg" 
                        alt="Amazon" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`text-xs font-medium transition-colors ${
                      selectedService === 'amazon' ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      Amazon
                    </span>
                  </div>

                  {/* Apple */}
                  <div 
                    className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
                      selectedService === 'apple' ? 'scale-110' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedService('apple')}
                  >
                    <div className={`w-16 h-16 rounded-lg overflow-hidden shadow-sm mb-2 border-2 transition-all duration-200 ${
                      selectedService === 'apple' ? 'border-gray-500 shadow-lg' : 'border-gray-200 hover:border-gray-400'
                    }`}>
                      <img 
                        src="/apple.jpg" 
                        alt="Apple" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={`text-xs font-medium transition-colors ${
                      selectedService === 'apple' ? 'text-gray-800' : 'text-gray-600'
                    }`}>
                      Apple
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleRedeem} 
                className="w-full" 
                size="lg"
                disabled={!selectedService}
              >
                {selectedService 
                  ? `Redeem for ${selectedService.charAt(0).toUpperCase() + selectedService.slice(1)}` 
                  : 'Select a service first'
                }
              </Button>
            </div>
          )}

          {redeemStep === 'success' && currentCard && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Gift card redeemed successfully! You have received ${currentCard.amount} {currentCard.currency}.
                </AlertDescription>
              </Alert>

              {selectedService && (
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Redirecting to {selectedService.charAt(0).toUpperCase() + selectedService.slice(1)} in a few seconds...
                  </AlertDescription>
                </Alert>
              )}

              {currentCard.secretMessage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Secret Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{currentCard.secretMessage}</p>
                  </CardContent>
                </Card>
              )}

              <Button onClick={resetForm} className="w-full">
                Redeem another card
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="scan" className="space-y-4">
          <div className="text-center space-y-4">
            <div className="w-64 h-64 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
              <Camera className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-gray-600">Point your camera at the QR code</p>

          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

    </div>
  );
}