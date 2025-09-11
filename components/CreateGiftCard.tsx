import { useState } from 'react';
import { Gift, QrCode, Share2, Clock, Lock, Upload, Palette, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import web3Service from '../utils/web3/web3Service';
import pinataService from '../utils/pinataService';
import imageGenerator from '../utils/imageGenerator';

interface GiftCardData {
  recipientAddress: string;
  amount: string;
  currency: 'USDC' | 'USDT';
  design: 'pink' | 'blue' | 'green' | 'custom';
  message: string;
  secretMessage: string;
  hasTimer: boolean;
  timerHours: number;
  hasPassword: boolean;
  password: string;
  expiryDays: number;
  customImage: string;
  nftCover: string;
}

export function CreateGiftCard() {
  const { address, isConnected } = useAccount();
  const [formData, setFormData] = useState<GiftCardData>({
    recipientAddress: '',
    amount: '0',
    currency: 'USDC',
    design: 'pink',
    message: '',
    secretMessage: '',
    hasTimer: false,
    timerHours: 24,
    hasPassword: false,
    password: '',
    expiryDays: 7,
    customImage: '',
    nftCover: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdCard, setCreatedCard] = useState<any>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'generating' | 'uploading' | 'creating' | 'success'>('form');

  const updateFormData = (field: keyof GiftCardData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCard = async () => {
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.recipientAddress || !formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Step 1: Generate image
      setStep('generating');
      toast.info('Generating gift card image...');
      
      const imageBlob = await imageGenerator.generateGiftCardImage({
        amount: formData.amount,
        currency: formData.currency,
        message: formData.message,
        design: formData.design,
        customImage: formData.customImage || undefined
      });

      // Step 2: Upload to Pinata
      setStep('uploading');
      toast.info('Uploading to IPFS...');
      
      const metadataUri = await pinataService.createGiftCardNFT(
        formData.amount,
        formData.currency,
        formData.message,
        formData.design,
        imageBlob
      );

      // Step 3: Initialize web3 service
      const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum)
      });

      await web3Service.initialize(walletClient, address);

      // Step 4: Create gift card on blockchain
      setStep('creating');
      toast.info('Creating gift card on blockchain...');
      
      const result = await web3Service.createGiftCard(
        formData.recipientAddress,
        formData.amount,
        formData.currency,
        metadataUri,
        formData.message
      );

      setStep('success');
      
      const createdCardData = {
        id: result.tokenId,
        recipientAddress: formData.recipientAddress,
        amount: formData.amount,
        currency: formData.currency,
        design: formData.design,
        message: formData.message,
        secretMessage: formData.secretMessage,
        hasTimer: formData.hasTimer,
        timerHours: formData.timerHours,
        hasPassword: formData.hasPassword,
        expiryDays: formData.expiryDays,
        customImage: formData.customImage,
        nftCover: formData.nftCover,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + formData.expiryDays * 24 * 60 * 60 * 1000).toISOString(),
        qr_code: `sendly://redeem/${result.tokenId}`,
        tx_hash: result.txHash,
        metadata_uri: metadataUri
      };

      setCreatedCard(createdCardData);
      toast.success('Gift card created successfully!');
      
      // Reset form
      setFormData({
        recipientAddress: '',
        amount: '0',
        currency: 'USDC',
        design: 'pink',
        message: '',
        secretMessage: '',
        hasTimer: false,
        timerHours: 24,
        hasPassword: false,
        password: '',
        expiryDays: 7,
        customImage: '',
        nftCover: ''
      });
    } catch (error) {
      console.error('Error creating gift card:', error);
      setError(error instanceof Error ? error.message : 'Failed to create gift card');
      toast.error('Failed to create gift card');
    } finally {
      setIsCreating(false);
      setStep('form');
    }
  };

  const handleShare = () => {
    if (createdCard) {
      const shareUrl = `${window.location.origin}/redeem/${createdCard.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Card link copied to clipboard!');
    }
  };

  const getCardColor = () => {
    switch (formData.design) {
      case 'pink': return 'from-pink-400 to-purple-500';
      case 'blue': return 'from-blue-400 to-cyan-500';
      case 'green': return 'from-green-400 to-emerald-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getStepText = () => {
    switch (step) {
      case 'generating': return 'Generating image...';
      case 'uploading': return 'Uploading to IPFS...';
      case 'creating': return 'Creating on blockchain...';
      case 'success': return 'Success!';
      default: return 'Create a card';
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 text-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to create gift cards
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold">Create a gift card</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient address (0x)</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={formData.recipientAddress}
              onChange={(e) => updateFormData('recipientAddress', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount (in $)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="10"
              value={formData.amount}
              onChange={(e) => updateFormData('amount', e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Card design</Label>
            <div className="flex gap-2 mt-2">
              {[
                { value: 'pink', label: 'Pink', color: 'bg-pink-400' },
                { value: 'blue', label: 'Blue', color: 'bg-blue-400' },
                { value: 'green', label: 'Green', color: 'bg-green-400' },
              ].map((design) => (
                <Button
                  key={design.value}
                  variant={formData.design === design.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFormData('design', design.value)}
                  className="flex items-center gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${design.color}`}></div>
                  {design.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={(value: 'USDC' | 'USDT') => updateFormData('currency', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message (for example: Happy Birthday!)</Label>
            <Textarea
              id="message"
              placeholder="Happy Birthday!"
              value={formData.message}
              onChange={(e) => updateFormData('message', e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Advanced Features Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="advanced"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
            <Label htmlFor="advanced">Advanced features</Label>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Secret Message */}
              <div>
                <Label htmlFor="secret">Secret message (revealed after activation)</Label>
                <Textarea
                  id="secret"
                  placeholder="A special message or promo code..."
                  value={formData.secretMessage}
                  onChange={(e) => updateFormData('secretMessage', e.target.value)}
                />
              </div>

              {/* Timer Feature */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="timer"
                  checked={formData.hasTimer}
                  onCheckedChange={(checked) => updateFormData('hasTimer', checked)}
                />
                <Label htmlFor="timer">Open later (timer)</Label>
              </div>

              {formData.hasTimer && (
                <div>
                  <Label>Hours until card can be opened: {formData.timerHours}h</Label>
                  <Slider
                    value={[formData.timerHours]}
                    onValueChange={(value) => updateFormData('timerHours', value[0])}
                    max={168}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              )}

              {/* Password Protection */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="password"
                  checked={formData.hasPassword}
                  onCheckedChange={(checked) => updateFormData('hasPassword', checked)}
                />
                <Label htmlFor="password">Password protection</Label>
              </div>

              {formData.hasPassword && (
                <Input
                  placeholder="Enter password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                />
              )}

              {/* Expiry */}
              <div>
                <Label>Card expires in: {formData.expiryDays} days</Label>
                <Slider
                  value={[formData.expiryDays]}
                  onValueChange={(value) => updateFormData('expiryDays', value[0])}
                  max={365}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Custom Design Upload */}
              <div>
                <Label>Custom design</Label>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button variant="outline" size="sm">
                    <Palette className="w-4 h-4 mr-2" />
                    AI Generate
                  </Button>
                </div>
              </div>

              {/* NFT Cover */}
              <div>
                <Label htmlFor="nft">NFT Cover (optional)</Label>
                <Input
                  id="nft"
                  placeholder="NFT contract address or OpenSea URL"
                  value={formData.nftCover}
                  onChange={(e) => updateFormData('nftCover', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <Label>Preview of gift card</Label>
          
          <Card className={`bg-gradient-to-br ${getCardColor()} text-white border-0 shadow-lg`}>
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-6 h-6" />
                  <span className="text-lg font-medium">Gift Card</span>
                </div>
                
                <div className="text-4xl font-bold">
                  ${formData.amount || '0'}
                </div>
                
                <div className="text-sm opacity-90">
                  {formData.currency}
                </div>
                
                {formData.message && (
                  <div className="text-sm bg-white/20 rounded-lg p-3 mt-4">
                    "{formData.message}"
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {formData.hasTimer && (
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      {formData.timerHours}h delay
                    </Badge>
                  )}
                  {formData.hasPassword && (
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      <Lock className="w-3 h-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                  {formData.expiryDays < 365 && (
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {formData.expiryDays}d expiry
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleCreateCard}
              disabled={isCreating}
            >
              {isCreating ? getStepText() : 'Create a card'}
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                disabled={!createdCard}
              >
                <QrCode className="w-4 h-4 mr-2" />
                Generate QR
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={handleShare}
                disabled={!createdCard}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <input type="checkbox" id="paymaster" disabled className="opacity-50 cursor-not-allowed" />
                <Label htmlFor="paymaster" className="opacity-50 cursor-not-allowed">Use paymaster</Label>
              </div>
              <span className="text-gray-500 text-xs ml-5">Coming soon</span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {createdCard && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div>Gift card created successfully! Token ID: {createdCard.id}</div>
                <div className="text-sm">
                  TX: 
                  <button
                    onClick={() => window.open(`https://basescan.org/tx/${createdCard.tx_hash}`, '_blank')}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors ml-1"
                    title={`View on Basescan: ${createdCard.tx_hash}`}
                  >
                    {createdCard.tx_hash.slice(0, 10)}...{createdCard.tx_hash.slice(-8)}
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}