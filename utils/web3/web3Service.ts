import { createPublicClient, http, getContract } from 'viem';
import { base } from 'viem/chains';
import { 
  CONTRACT_ADDRESS, 
  USDC_ADDRESS, 
  USDT_ADDRESS, 
  GiftCardABI, 
  ERC20ABI 
} from './constants';

export interface GiftCardInfo {
  tokenId: string;
  recipient: string;
  amount: string;
  token: 'USDC' | 'USDT';
  message: string;
  redeemed: boolean;
}

export interface BlockchainGiftCardInfo {
  amount: bigint;
  token: string;
  redeemed: boolean;
  message: string;
}

export class Web3Service {
  private walletClient: any = null;
  private account: string | null = null;
  private publicClient: any = null;

  constructor() {
    this.publicClient = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org', {
        retryCount: 1,
        retryDelay: 2000,
      }),
    });
  }

  async initialize(walletClient: any, account: string) {
    this.walletClient = walletClient;
    this.account = account;
  }

  async loadGiftCards(): Promise<GiftCardInfo[]> {
    if (!this.account) return [];

    try {

      
      // Get balance using readContract
      const balance = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: GiftCardABI,
        functionName: 'balanceOf',
        args: [this.account as `0x${string}`],
      });
      

      
      if (BigInt(balance) === BigInt(0)) return [];

      const cards: GiftCardInfo[] = [];
      
      // Use tokenOfOwnerByIndex to get all tokens owned by this account
      for (let index = 0; index < Number(balance); index++) {
        try {

          
          // Get token ID at specific index for this owner
          const tokenId = await this.publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: GiftCardABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [this.account as `0x${string}`, BigInt(index)],
          });
          

          
          // Get gift card info using readContract
          const giftCardInfo = await this.publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: GiftCardABI,
            functionName: 'getGiftCardInfo',
            args: [BigInt(tokenId)],
          });
          
          const amount = this.formatAmount(giftCardInfo.amount);
          const token = giftCardInfo.token.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'USDT';
          
          cards.push({
            tokenId: tokenId.toString(),
            recipient: this.account!,
            amount,
            token,
            message: giftCardInfo.message,
            redeemed: giftCardInfo.redeemed
          });
        } catch (error) {

          continue;
        }
      }
      

      return cards;
    } catch (error) {
      console.error('Error loading gift cards:', error);
      return [];
    }
  }

  async getGiftCardInfo(tokenId: string): Promise<BlockchainGiftCardInfo | null> {
    try {
      const giftCardInfo = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: GiftCardABI,
        functionName: 'getGiftCardInfo',
        args: [BigInt(tokenId)],
      });
      return giftCardInfo;
    } catch (error) {
      console.error('Error getting gift card info:', error);
      return null;
    }
  }

  async getCardOwner(tokenId: string): Promise<string> {
    try {
      const owner = await this.publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: GiftCardABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)],
      });
      return owner;
    } catch (error) {
      console.error('Error getting card owner:', error);
      throw error;
    }
  }

  async getCardCreator(tokenId: string): Promise<string> {
    try {
      // Get Transfer events for this token from the beginning
      const logs = await this.publicClient.getLogs({
        address: CONTRACT_ADDRESS as `0x${string}`,
        event: {
          type: 'event',
          name: 'Transfer',
          inputs: [
            { name: 'from', type: 'address', indexed: true },
            { name: 'to', type: 'address', indexed: true },
            { name: 'tokenId', type: 'uint256', indexed: true }
          ]
        },
        args: {
          tokenId: BigInt(tokenId)
        },
        fromBlock: 'earliest'
      });

      // Find the minting event (Transfer from 0x0 address)
      const mintEvent = logs.find(log => 
        log.args && 
        log.args.from === '0x0000000000000000000000000000000000000000'
      );

      if (mintEvent && mintEvent.args) {
        return mintEvent.args.to as string;
      }

      throw new Error('Could not find card creator');
    } catch (error) {
      console.error('Error getting card creator:', error);
      // Fallback to current owner if we can't find creator
      return await this.getCardOwner(tokenId);
    }
  }

  async approveToken(tokenAddress: string, amount: string): Promise<boolean> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const amountWei = this.parseAmount(amount);
      
      // Check current allowance using readContract
      const allowance = await this.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [this.account as `0x${string}`, CONTRACT_ADDRESS as `0x${string}`],
      });



      if (BigInt(allowance) < BigInt(amountWei)) {

        
        // Use writeContract directly
        const hash = await this.walletClient.writeContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [CONTRACT_ADDRESS as `0x${string}`, BigInt(amountWei)],
          account: this.account as `0x${string}`,
        });


        await this.publicClient.waitForTransactionReceipt({ hash });

      } else {

      }

      return true;
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

  async createGiftCard(
    recipient: string,
    amount: string,
    tokenType: 'USDC' | 'USDT',
    metadata: string,
    message: string
  ): Promise<{ tokenId: string; txHash: string }> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {

      
      const tokenAddress = tokenType === 'USDC' ? USDC_ADDRESS : USDT_ADDRESS;
      const amountWei = this.parseAmount(amount);
      


      // Check balance - create contract instance with publicClient

      
      // Try using readContract directly instead of getContract
      const balance = await this.publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [this.account as `0x${string}`],
      });
      

      
      if (BigInt(balance) < BigInt(amountWei)) {
        throw new Error(`Insufficient ${tokenType} balance`);
      }

      // Approve tokens

      await this.approveToken(tokenAddress, amount);

      // Create gift card

      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: GiftCardABI,
        functionName: 'createGiftCard',
        args: [
          recipient as `0x${string}`,
          BigInt(amountWei),
          tokenAddress as `0x${string}`,
          metadata,
          message
        ],
        account: this.account as `0x${string}`,
      });


      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      
      // Get token ID from event
      const event = receipt.logs.find(log => 
        log.topics[0] === '0x' + 'GiftCardCreated'.padEnd(64, '0')
      );

      let tokenId = '1'; // Default fallback
      if (event) {
        // Parse token ID from event data
        tokenId = BigInt('0x' + event.topics[1].slice(26)).toString();
      }


      return { tokenId, txHash: hash };
    } catch (error) {
      console.error('Error creating gift card:', error);
      throw error;
    }
  }

  async redeemGiftCard(tokenId: string): Promise<string> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: GiftCardABI,
        functionName: 'redeemGiftCard',
        args: [BigInt(tokenId)],
        account: this.account as `0x${string}`,
      });

      await this.publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      throw error;
    }
  }

  async getTokenBalance(tokenType: 'USDC' | 'USDT'): Promise<string> {
    if (!this.account) return '0';

    try {
      const tokenAddress = tokenType === 'USDC' ? USDC_ADDRESS : USDT_ADDRESS;
      const tokenContract = getContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20ABI,
        publicClient: this.publicClient,
      });
      const balance = await tokenContract.read.balanceOf([this.account as `0x${string}`]);
      return this.formatAmount(balance);
    } catch (error) {
      console.error(`Error getting ${tokenType} balance:`, error);
      return '0';
    }
  }

  getAccount(): string | null {
    return this.account;
  }

  private parseAmount(amount: string): string {
    // Convert amount to wei (6 decimals for USDC/USDT)
    return (parseFloat(amount) * 1000000).toString();
  }

  private formatAmount(amountWei: bigint): string {
    // Convert wei to amount (6 decimals for USDC/USDT)
    return (Number(amountWei) / 1000000).toString();
  }
}

export default new Web3Service();
