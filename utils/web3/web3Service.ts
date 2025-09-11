import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { 
  CONTRACT_ADDRESS, 
  USDC_ADDRESS, 
  USDT_ADDRESS, 
  GiftCardABI, 
  ERC20ABI,
  BASE_RPC_URLS
} from './constants';

export interface GiftCardInfo {
  tokenId: string;
  recipient: string;
  sender: string;
  amount: string;
  token: 'USDC' | 'USDT';
  message: string;
  redeemed: boolean;
  type: 'sent' | 'received';
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
  private currentRpcIndex = 0;
  // private _retryCount = 0; // Will be used in future retry logic
  private maxRetries = 1; // Reduced retries for faster failure
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 300000; // 5 minutes cache

  constructor() {
    this.createPublicClient();
  }

  private createPublicClient() {
    const rpcUrl = BASE_RPC_URLS[this.currentRpcIndex];
    console.log(`Creating public client with RPC: ${rpcUrl}`);
    
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(rpcUrl, {
        retryCount: 1,
        retryDelay: 1000,
        timeout: 8000, // Reduced timeout
      }),
    });
  }

  private async switchToNextRpc() {
    this.currentRpcIndex = (this.currentRpcIndex + 1) % BASE_RPC_URLS.length;
    console.log(`Switching to RPC ${this.currentRpcIndex + 1}/${BASE_RPC_URLS.length}: ${BASE_RPC_URLS[this.currentRpcIndex]}`);
    this.createPublicClient();
  }

  // Cache helper methods
  private getCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async initialize(walletClient: any, account: string) {
    this.walletClient = walletClient;
    this.account = account;
  }

  // Добавляем метод для безопасного выполнения запросов с retry и fallback RPC
  private async safeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    let lastError: any;
    const originalRpcIndex = this.currentRpcIndex;
    
    // Сначала пробуем с текущим RPC
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        lastError = error;
        console.log(`Attempt ${attempt + 1}/${this.maxRetries + 1} failed with RPC ${BASE_RPC_URLS[this.currentRpcIndex]}:`, error.message);
        
        // Если это критическая ошибка или требует аутентификации, сразу переключаемся на другой RPC
        if (error.message?.includes('503') || error.message?.includes('502') || error.message?.includes('500') || 
            error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('400') ||
            error.message?.includes('Unauthorized') || error.message?.includes('Bad Request') ||
            error.status === 503 || error.status === 502 || error.status === 500 || 
            error.status === 401 || error.status === 403 || error.status === 400) {
          console.log(`Critical error detected, switching RPC immediately`);
          break;
        }
        
        // Если это ошибка 429 (Too Many Requests), ждем дольше
        if (error.message?.includes('429') || error.status === 429) {
          const delay = Math.pow(2, attempt) * 1000; // Экспоненциальная задержка
          console.log(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}/${this.maxRetries + 1}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Для других ошибок делаем короткую паузу
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        break;
      }
    }
    
    // Если все попытки с текущим RPC не удались, пробуем другие RPC
    console.log(`All attempts failed with current RPC, trying other RPCs...`);
    for (let rpcAttempt = 0; rpcAttempt < Math.min(BASE_RPC_URLS.length - 1, 2); rpcAttempt++) {
      await this.switchToNextRpc();
      
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          return await requestFn();
        } catch (error: any) {
          lastError = error;
          console.log(`Attempt ${attempt + 1}/${this.maxRetries + 1} failed with RPC ${BASE_RPC_URLS[this.currentRpcIndex]}:`, error.message);
          
          if (attempt < this.maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500));
            continue;
          }
          
          break;
        }
      }
    }
    
    // Если все RPC не работают, возвращаемся к исходному
    if (this.currentRpcIndex !== originalRpcIndex) {
      console.log(`All RPCs failed, reverting to original RPC`);
      this.currentRpcIndex = originalRpcIndex;
      this.createPublicClient();
    }
    
    throw lastError;
  }

  async loadGiftCards(): Promise<GiftCardInfo[]> {
    if (!this.account) return [];

    const cacheKey = `giftCards_${this.account}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('Using cached gift cards data');
      return cached;
    }

    try {
      // Get balance using readContract with retry
      const balance = await this.safeRequest(async () => {
        return await this.publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: GiftCardABI,
          functionName: 'balanceOf',
          args: [this.account as `0x${string}`],
        });
      });
      
      if (BigInt(balance) === BigInt(0)) {
        const emptyResult: GiftCardInfo[] = [];
        this.setCache(cacheKey, emptyResult);
        return emptyResult;
      }

      const cards: GiftCardInfo[] = [];
      
      // Increased concurrent requests to 8 for better performance
      const maxConcurrentRequests = 8;
      const tokenIds: bigint[] = [];
      
      // Сначала собираем все tokenId
      for (let index = 0; index < Number(balance); index++) {
        try {
          const tokenId = await this.safeRequest(async () => {
            return await this.publicClient.readContract({
              address: CONTRACT_ADDRESS as `0x${string}`,
              abi: GiftCardABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [this.account as `0x${string}`, BigInt(index)],
            });
          });
          tokenIds.push(tokenId);
        } catch (error) {
          console.warn(`Failed to get tokenId at index ${index}:`, error);
          continue;
        }
      }
      
      // Затем параллельно получаем информацию по всем картам (с увеличенным ограничением)
      const giftCardPromises = tokenIds.map(tokenId => 
        this.safeRequest(async () => {
          const giftCardInfo = await this.publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: GiftCardABI,
            functionName: 'getGiftCardInfo',
            args: [tokenId],
          });
          
          let sender = 'Unknown';
          try {
            sender = await this.getCardCreator(tokenId.toString());
          } catch (error) {
            console.warn(`Could not get creator for card ${tokenId}:`, error);
          }
          
          const amount = this.formatAmount(giftCardInfo.amount);
          const token = giftCardInfo.token.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'USDT';
          
          return {
            tokenId: tokenId.toString(),
            recipient: this.account!,
            sender,
            amount,
            token,
            message: giftCardInfo.message,
            redeemed: giftCardInfo.redeemed,
            type: 'received'
          } as GiftCardInfo;
        })
      );
      
      // Выполняем запросы пакетами с увеличенным размером
      for (let i = 0; i < giftCardPromises.length; i += maxConcurrentRequests) {
        const batch = giftCardPromises.slice(i, i + maxConcurrentRequests);
        try {
          const batchResults = await Promise.all(batch);
          cards.push(...batchResults);
        } catch (error) {
          console.warn(`Failed to load batch of cards:`, error);
          // Продолжаем с другими батчами
        }
      }
      
      this.setCache(cacheKey, cards);
      return cards;
    } catch (error) {
      console.error('Error loading gift cards:', error);
      return [];
    }
  }

  async loadSentGiftCards(): Promise<GiftCardInfo[]> {
    if (!this.account) return [];

    const cacheKey = `sentGiftCards_${this.account}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('Using cached sent gift cards data');
      return cached;
    }

    try {
      // Get current block number to calculate a reasonable fromBlock
      const currentBlock = await this.safeRequest(async () => {
        return await this.publicClient.getBlockNumber();
      });
      
      // Further reduced block range for faster loading (last 5000 blocks)
      const fromBlock = Math.max(0, Number(currentBlock - 5000n));
      
      console.log(`Loading sent gift cards from block ${fromBlock} to ${currentBlock}`);
      
      // Get all Transfer events where this account is the sender
      const logs = await this.safeRequest(async () => {
        return await this.publicClient.getLogs({
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
            from: this.account as `0x${string}`
          },
          fromBlock,
          toBlock: currentBlock
        });
      });

      const sentCards: GiftCardInfo[] = [];
      
      // Increased concurrent requests to 8 for better performance
      const maxConcurrentRequests = 8;
      
      // Создаем промисы для получения информации по картам
      const cardPromises = logs.map((log: any) => {
        if (!log.args || !log.args.tokenId) return Promise.resolve(null);
        
        return this.safeRequest(async () => {
          const tokenId = log.args.tokenId.toString();
          
          const giftCardInfo = await this.publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: GiftCardABI,
            functionName: 'getGiftCardInfo',
            args: [BigInt(tokenId)],
          });
          
          const amount = this.formatAmount(giftCardInfo.amount);
          const token = giftCardInfo.token.toLowerCase() === USDC_ADDRESS.toLowerCase() ? 'USDC' : 'USDT';
          
          return {
            tokenId,
            recipient: log.args.to as string,
            sender: this.account!,
            amount,
            token,
            message: giftCardInfo.message,
            redeemed: giftCardInfo.redeemed,
            type: 'sent'
          } as GiftCardInfo;
        }).catch(error => {
          console.warn(`Failed to load sent card ${log.args?.tokenId}:`, error);
          return null;
        });
      });
      
      // Выполняем запросы пакетами с увеличенным размером
      for (let i = 0; i < cardPromises.length; i += maxConcurrentRequests) {
        const batch = cardPromises.slice(i, i + maxConcurrentRequests);
        try {
          const batchResults = await Promise.all(batch);
          const validResults = batchResults.filter(result => result !== null) as GiftCardInfo[];
          sentCards.push(...validResults);
        } catch (error) {
          console.warn(`Failed to load batch of sent cards:`, error);
          // Продолжаем с другими батчами
        }
      }
      
      this.setCache(cacheKey, sentCards);
      return sentCards;
    } catch (error) {
      console.error('Error loading sent gift cards:', error);
      return [];
    }
  }

  async getGiftCardInfo(tokenId: string): Promise<BlockchainGiftCardInfo | null> {
    const cacheKey = `giftCardInfo_${tokenId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const giftCardInfo = await this.safeRequest(async () => {
        return await this.publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: GiftCardABI,
          functionName: 'getGiftCardInfo',
          args: [BigInt(tokenId)],
        });
      });
      this.setCache(cacheKey, giftCardInfo);
      return giftCardInfo;
    } catch (error) {
      console.error('Error getting gift card info:', error);
      return null;
    }
  }

  async getCardOwner(tokenId: string): Promise<string> {
    const cacheKey = `cardOwner_${tokenId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const owner = await this.safeRequest(async () => {
        return await this.publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: GiftCardABI,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)],
        });
      });
      this.setCache(cacheKey, owner);
      return owner;
    } catch (error) {
      console.error('Error getting card owner:', error);
      throw error;
    }
  }

  async getCardCreator(tokenId: string): Promise<string> {
    const cacheKey = `cardCreator_${tokenId}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get current block number to calculate a reasonable fromBlock
      const currentBlock = await this.safeRequest(async () => {
        return await this.publicClient.getBlockNumber();
      });
      
      // Further reduced block range for faster loading (last 5000 blocks)
      const fromBlock = Math.max(0, Number(currentBlock - 5000n));
      
      // Get Transfer events for this token from a reasonable range
      const logs = await this.safeRequest(async () => {
        return await this.publicClient.getLogs({
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
          fromBlock,
          toBlock: currentBlock
        });
      });

      // Find the minting event (Transfer from 0x0 address)
      const mintEvent = logs.find((log: any) => 
        log.args && 
        log.args.from === '0x0000000000000000000000000000000000000000'
      );

      let creator;
      if (mintEvent && mintEvent.args) {
        creator = mintEvent.args.to as string;
      } else {
        // Fallback to current owner if we can't find creator
        creator = await this.getCardOwner(tokenId);
      }

      this.setCache(cacheKey, creator);
      return creator;
    } catch (error) {
      console.error('Error getting card creator:', error);
      // Fallback to current owner if we can't find creator
      const owner = await this.getCardOwner(tokenId);
      this.setCache(cacheKey, owner);
      return owner;
    }
  }

  async approveToken(tokenAddress: string, amount: string): Promise<boolean> {
    if (!this.walletClient || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const amountWei = this.parseAmount(amount);
      
      // Check current allowance using readContract
      const allowance = await this.safeRequest(async () => {
        return await this.publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'allowance',
          args: [this.account as `0x${string}`, CONTRACT_ADDRESS as `0x${string}`],
        });
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

        await this.safeRequest(async () => {
          return await this.publicClient.waitForTransactionReceipt({ hash });
        });
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
      const balance = await this.safeRequest(async () => {
        return await this.publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [this.account as `0x${string}`],
        });
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

      const receipt = await this.safeRequest(async () => {
        return await this.publicClient.waitForTransactionReceipt({ hash });
      });

      // Get token ID from event
      const event = receipt.logs.find((log: any) => 
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

      await this.safeRequest(async () => {
        return await this.publicClient.waitForTransactionReceipt({ hash });
      });
      return hash;
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      throw error;
    }
  }

  async getTokenBalance(tokenType: 'USDC' | 'USDT'): Promise<string> {
    if (!this.account) return '0';

    const cacheKey = `tokenBalance_${tokenType}_${this.account}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const tokenAddress = tokenType === 'USDC' ? USDC_ADDRESS : USDT_ADDRESS;
      const balance = await this.safeRequest(async () => {
        return await this.publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [this.account as `0x${string}`],
        });
      });
      const formattedBalance = this.formatAmount(balance);
      this.setCache(cacheKey, formattedBalance);
      return formattedBalance;
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

  // Method to clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

export default new Web3Service();