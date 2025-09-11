import { useState, useEffect } from 'react';
import { Gift, Wallet } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { CreateGiftCard } from './components/CreateGiftCard';
import { MyCards } from './components/MyCards';
import { SpendCard } from './components/SpendCard';
import { TransactionHistory } from './components/TransactionHistory';
import { AuthModal } from './components/AuthModal';
import { BaseLogo } from './components/BaseLogo';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Toaster } from './components/ui/sonner';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';
import web3Service from './utils/web3/web3Service';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

export default function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [user] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const { isConnected, address } = useAccount();
  
  // Preload history data when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      preloadHistoryData();
    }
  }, [isConnected, address]);

  const preloadHistoryData = async () => {
    if (!address) return;
    
    try {
      console.log('Preloading history data for:', address);
      // Initialize web3 service
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum)
      });

      await web3Service.initialize(walletClient, address);
      
      // Load received gift cards first (usually faster)
      console.log('Preloading received gift cards...');
      await web3Service.loadGiftCards();
      
      // Load sent gift cards (can be slower due to logs)
      console.log('Preloading sent gift cards...');
      await web3Service.loadSentGiftCards();
      
      console.log('History data preloaded successfully');
    } catch (error) {
      console.error('Error preloading history data:', error);
    }
  };

  const handleSpendCard = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    setActiveTab('spend');
  };

  const handleAuthClick = () => {
    // Временно отключено
    toast.info('Sign In functionality is coming soon!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600">
      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-400 rounded-lg flex items-center justify-center">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-2xl font-semibold">Sendly</span>
        </div>
        
        <div className="flex items-center gap-4">
          <BaseLogo className="h-6 w-auto text-white opacity-90 hover:opacity-100 transition-opacity" />
          <ConnectButton />
          <div className="relative">
            <Button 
              variant="outline" 
              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 opacity-50 cursor-not-allowed"
              onClick={handleAuthClick}
              disabled={true}
            >
              <Wallet className="w-4 h-4 mr-2" />
              {loading ? 'Loading...' : user ? 'Sign Out' : 'Sign In'}
            </Button>
            <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-white/70 text-xs whitespace-nowrap">Coming soon</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-6">
        <div className="max-w-2xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/90 backdrop-blur-sm">
              <TabsTrigger value="create" className="data-[state=active]:bg-white">
                Create a gift card
              </TabsTrigger>
              <TabsTrigger value="my-cards" className="data-[state=active]:bg-white">
                My cards
              </TabsTrigger>
              <TabsTrigger value="spend" className="data-[state=active]:bg-white">
                Spend a card
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-white">
                History
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
                {!user && !isConnected ? (
                  <div className="p-8 text-center">
                    <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Welcome to Sendly</h3>
                    <p className="text-gray-600 mb-6">
                      Connect your wallet or sign in to create and manage your NFT gift cards on the Base network
                    </p>
                    <div className="flex gap-4 justify-center">
                      <div className="[&_button]:bg-white/20 [&_button]:backdrop-blur-sm [&_button]:border [&_button]:border-white/30 [&_button]:hover:bg-white/30 [&_button]:text-gray-800 [&_button]:hover:text-gray-900">
                        <ConnectButton />
                      </div>
                      <div className="flex flex-col items-center">
                        <Button 
                          onClick={() => setShowAuthModal(true)}
                          disabled={true}
                          className="bg-transparent hover:bg-white/20 text-gray-800 hover:text-gray-900 border-0 opacity-50 cursor-not-allowed"
                        >
                          Sign In
                        </Button>
                        <span className="text-gray-500 text-xs mt-1">Coming soon</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <TabsContent value="create" className="m-0">
                      <CreateGiftCard />
                    </TabsContent>
                    
                    <TabsContent value="my-cards" className="m-0">
                      <MyCards onSpendCard={handleSpendCard} />
                    </TabsContent>
                    
                    <TabsContent value="spend" className="m-0">
                      <SpendCard selectedTokenId={selectedTokenId} onClearTokenId={() => setSelectedTokenId('')} />
                    </TabsContent>
                    
                    <TabsContent value="history" className="m-0">
                      <TransactionHistory />
                    </TabsContent>
                  </>
                )}
              </Card>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}