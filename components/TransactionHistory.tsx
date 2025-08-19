import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Gift, ArrowUpRight, ArrowDownLeft, Filter, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import web3Service from '../utils/web3/web3Service';

interface Transaction {
  id: string;
  type: 'sent' | 'received' | 'redeemed';
  amount: string;
  currency: 'USDC' | 'USDT';
  counterpart: string;
  message: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  txHash: string;
  gasUsed?: string;
}

interface Analytics {
  totalSent: string;
  totalReceived: string;
  totalRedeemed: string;
  cardsSent: number;
  cardsReceived: number;
  averageAmount: string;
  topCurrency: 'USDC' | 'USDT';
}

export function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const [dateFilter, setDateFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [analytics, setAnalytics] = useState<Analytics>({
    totalSent: '0',
    totalReceived: '0',
    totalRedeemed: '0',
    cardsSent: 0,
    cardsReceived: 0,
    averageAmount: '0',
    topCurrency: 'USDC'
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const fetchData = async () => {
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
      
      // Calculate analytics from blockchain data
      let totalReceived = 0;
      let totalRedeemed = 0;
      let cardsReceived = 0;
      let cardsRedeemed = 0;
      const currencyCounts = { USDC: 0, USDT: 0 };

      blockchainCards.forEach(card => {
        const amount = parseFloat(card.amount);
        totalReceived += amount;
        cardsReceived++;
        currencyCounts[card.token]++;

        if (card.redeemed) {
          totalRedeemed += amount;
          cardsRedeemed++;
        }
      });

      const averageAmount = cardsReceived > 0 ? (totalReceived / cardsReceived).toFixed(2) : '0';
      const topCurrency = currencyCounts.USDC >= currencyCounts.USDT ? 'USDC' : 'USDT';

      setAnalytics({
        totalSent: '0', // Would need to track sent cards separately
        totalReceived: totalReceived.toFixed(2),
        totalRedeemed: totalRedeemed.toFixed(2),
        cardsSent: 0, // Would need to track sent cards separately
        cardsReceived,
        averageAmount,
        topCurrency
      });

      // Create transactions from blockchain data
      const blockchainTransactions: Transaction[] = blockchainCards.map((card, index) => ({
        id: `tx_${card.tokenId}`,
        type: card.redeemed ? 'redeemed' : 'received',
        amount: card.amount,
        currency: card.token,
        counterpart: 'Unknown', // Would need to extract from blockchain events
        message: card.message,
        status: 'completed',
        timestamp: new Date(Date.now() - index * 86400000).toISOString(), // Mock timestamps
        txHash: `0x${Math.random().toString(16).substr(2, 64)}`, // Mock tx hash
        gasUsed: '0.002'
      }));

      setTransactions(blockchainTransactions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sent': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'received': return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'redeemed': return <Gift className="w-4 h-4 text-blue-500" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sent': return 'text-red-600';
      case 'received': return 'text-green-600';
      case 'redeemed': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.counterpart.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.txHash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesCurrency = currencyFilter === 'all' || tx.currency === currencyFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = diffDays === 0;
          break;
        case 'week':
          matchesDate = diffDays <= 7;
          break;
        case 'month':
          matchesDate = diffDays <= 30;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesCurrency && matchesDate;
  });

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Currency', 'Counterpart', 'Message', 'Status', 'Transaction Hash'],
      ...filteredTransactions.map(tx => [
        new Date(tx.timestamp).toLocaleDateString(),
        tx.type,
        tx.amount,
        tx.currency,
        tx.counterpart,
        tx.message,
        tx.status,
        tx.txHash
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Transactions exported successfully!');
  };

  if (!isConnected) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Please connect your wallet to view transaction history</p>
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
        <h2 className="text-2xl font-semibold">Transaction history</h2>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${analytics.totalSent}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.cardsSent} cards sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${analytics.totalReceived}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.cardsReceived} cards received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redeemed</CardTitle>
            <Gift className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${analytics.totalRedeemed}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.cardsReceived} cards received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${analytics.averageAmount}</div>
            <p className="text-xs text-muted-foreground">
              Per card
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="redeemed">Redeemed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="USDC">USDC</SelectItem>
            <SelectItem value="USDT">USDT</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <Card key={tx.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(tx.type)}
                      <div>
                        <div className={`font-medium ${getTypeColor(tx.type)}`}>
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} ${tx.amount} {tx.currency}
                        </div>
                        <div className="text-sm text-gray-600">
                          {tx.counterpart}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      "{tx.message}"
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(tx.status)}>
                      {tx.status}
                    </Badge>
                    <div className="text-right text-sm text-gray-500">
                      <div>{new Date(tx.timestamp).toLocaleDateString()}</div>
                      <div>{new Date(tx.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  TX: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                  {tx.gasUsed && ` • Gas: ${tx.gasUsed} ETH`}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}