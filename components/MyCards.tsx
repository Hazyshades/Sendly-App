import { useState, useEffect } from 'react';
import { Gift, Copy, Share2, MoreVertical, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import web3Service from '../utils/web3/web3Service';

interface GiftCard {
  tokenId: string;
  amount: string;
  currency: 'USDC' | 'USDT';
  design: string;
  message: string;
  recipient: string;
  sender: string;
  status: 'active' | 'redeemed' | 'expired' | 'pending';
  createdAt: string;
  expiresAt?: string;
  hasTimer: boolean;
  hasPassword: boolean;
  qrCode: string;
  metadataUri?: string;
}

interface MyCardsProps {
  onSpendCard: (tokenId: string) => void;
}

export function MyCards({ onSpendCard }: MyCardsProps) {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [sentCards, setSentCards] = useState<GiftCard[]>([]);
  const [receivedCards, setReceivedCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'redeemed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'redeemed': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

    useEffect(() => {
    if (isConnected && address && !hasFetched) {
      setHasFetched(true);
      fetchCards();
    } else if (!isConnected || !address) {
      setLoading(false);
      setHasFetched(false);
    }
  }, [isConnected, address, hasFetched]);

  const fetchCards = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);
      
      // Initialize web3 service
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum)
      });

      await web3Service.initialize(walletClient, address);
      
      // Load gift cards from blockchain
      const blockchainCards = await web3Service.loadGiftCards();
      
      // Transform blockchain data to our format
      const transformedCards: GiftCard[] = blockchainCards.map(card => ({
        tokenId: card.tokenId,
        amount: card.amount,
        currency: card.token,
        design: 'pink', // Default design, could be extracted from metadata
        message: card.message,
        recipient: card.recipient,
        sender: address, // For received cards, sender would be different
        status: card.redeemed ? 'redeemed' : 'active',
        createdAt: new Date().toLocaleDateString(), // Could be extracted from blockchain events
        hasTimer: false,
        hasPassword: false,
        qrCode: `sendly://redeem/${card.tokenId}`
      }));

      // For now, all cards are treated as received cards
      // In a real implementation, you'd need to track sent cards separately
      // Only update if we got cards
      if (transformedCards.length > 0) {
        setReceivedCards(transformedCards);
      }
      setSentCards([]); // Would be populated from blockchain events
    } catch (error) {
      console.error('Error fetching cards:', error);
      // Don't show error toast on rate limiting - just keep existing cards
      if (!(error as Error).message?.includes('rate limit') && !(error as Error).message?.includes('429')) {
        toast.error('Failed to load gift cards');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCard = async () => {
    try {
      // Note: Revoking is not implemented in the current smart contract
      // This would require additional contract functionality
      toast.info('Revoke functionality not implemented in current contract');
    } catch (error) {
      console.error('Error revoking card:', error);
      toast.error('Failed to revoke gift card');
    }
  };

  const handleCopyLink = (cardId: string) => {
    const link = `${window.location.origin}/redeem/${cardId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  const handleShareCard = (cardId: string) => {
    const link = `${window.location.origin}/redeem/${cardId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Gift Card',
        text: 'Check out this gift card!',
        url: link
      });
    } else {
      navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard!');
    }
  };

  const filteredSentCards = sentCards.filter(card => {
    const matchesSearch = card.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || card.status === filterStatus;
    const matchesCurrency = filterCurrency === 'all' || card.currency === filterCurrency;
    return matchesSearch && matchesStatus && matchesCurrency;
  });

  const filteredReceivedCards = receivedCards.filter(card => {
    const matchesSearch = card.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.sender.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || card.status === filterStatus;
    const matchesCurrency = filterCurrency === 'all' || card.currency === filterCurrency;
    return matchesSearch && matchesStatus && matchesCurrency;
  });

  if (!isConnected) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Please connect your wallet to view your gift cards</p>
              </div>
            </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
  );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My gift cards</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="redeemed">Redeemed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sent">Sent ({sentCards.length})</TabsTrigger>
          <TabsTrigger value="received">Received ({receivedCards.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sent" className="space-y-4">
          {filteredSentCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sent gift cards found</p>
              </div>
            ) : (
            filteredSentCards.map((card) => (
              <Card key={card.tokenId} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                        card.design === 'pink' ? 'from-pink-400 to-purple-500' :
                        card.design === 'blue' ? 'from-blue-400 to-cyan-500' :
                        'from-green-400 to-emerald-500'
                      } flex items-center justify-center`}>
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">${card.amount} {card.currency}</CardTitle>
                        <p className="text-sm text-gray-600">To: {card.recipient.slice(0, 6)}...{card.recipient.slice(-4)}</p>
                        <p className="text-xs text-gray-500">Token ID: {card.tokenId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(card.status)}>
                        {getStatusIcon(card.status)}
                        {card.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleCopyLink(card.tokenId)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareCard(card.tokenId)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          {card.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleRevokeCard()}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Revoke
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">"{card.message}"</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created: {card.createdAt}</span>
                    {card.expiresAt && <span>Expires: {card.expiresAt}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {card.hasTimer && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Timer
                      </Badge>
                    )}
                    {card.hasPassword && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Protected
                      </Badge>
            )}
          </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="received" className="space-y-4">
          {filteredReceivedCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No received gift cards found</p>
              </div>
            ) : (
            filteredReceivedCards.map((card) => (
              <Card 
                key={card.tokenId} 
                className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => onSpendCard(card.tokenId)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                        card.design === 'pink' ? 'from-pink-400 to-purple-500' :
                        card.design === 'blue' ? 'from-blue-400 to-cyan-500' :
                        'from-green-400 to-emerald-500'
                      } flex items-center justify-center`}>
                        <Gift className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">${card.amount} {card.currency}</CardTitle>
                        <p className="text-sm text-gray-600">From: {card.sender.slice(0, 6)}...{card.sender.slice(-4)}</p>
                        <p className="text-xs text-gray-500">Token ID: {card.tokenId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(card.status)}>
                        {getStatusIcon(card.status)}
                        {card.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleCopyLink(card.tokenId)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareCard(card.tokenId)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">"{card.message}"</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Received: {card.createdAt}</span>
                    {card.expiresAt && <span>Expires: {card.expiresAt}</span>}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {card.hasTimer && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Timer
                      </Badge>
                    )}
                    {card.hasPassword && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Protected
                      </Badge>
            )}
          </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}