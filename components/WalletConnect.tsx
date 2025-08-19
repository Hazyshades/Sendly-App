import { useState } from 'react';
import { useAccount, useDisconnect, useConnect } from 'wagmi';
import { base } from 'wagmi/chains';
import { Button } from './ui/button';
import { Wallet, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors, isPending, error } = useConnect();

  const [showWallets, setShowWallets] = useState(false);

  // Проверка наличия MetaMask
  const hasMetaMask = typeof window !== 'undefined' && window.ethereum;



  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-white text-sm">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
          onClick={() => {
            disconnect();
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  const handleConnect = (connector: any) => {
    try {
      connect({ connector, chainId: base.id });
      setShowWallets(false); // Скрываем кнопки после попытки подключения
    } catch (err) {
      console.error('Connection error:', err);
    }
  };



  const toggleWallets = () => {
    setShowWallets(!showWallets);
  };

  // Если нет MetaMask, показываем сообщение об установке
  if (!hasMetaMask) {
    return (
      <div className="flex flex-col gap-2">
        <Button 
          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
          onClick={() => {
            window.open('https://metamask.io/download/', '_blank');
          }}
        >
          <Wallet className="w-4 h-4 mr-2" />
          Install MetaMask
        </Button>
      </div>
    );
  }

  // Если нет коннекторов, показываем сообщение
  if (connectors.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Button 
          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
          onClick={() => {
            alert('No wallets available. Please install MetaMask or another Web3 wallet.');
          }}
        >
          <Wallet className="w-4 h-4 mr-2" />
          No Wallet Found
        </Button>
      </div>
    );
  }

  // Показываем кнопку Connect Wallet и кнопки кошельков при нажатии
  return (
    <div className="relative">
      <Button 
        className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30"
        disabled={isPending}
        onClick={toggleWallets}
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isPending ? 'Connecting...' : 'Connect Wallet'}
        {showWallets ? (
          <ChevronUp className="w-4 h-4 ml-2" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-2" />
        )}
      </Button>

      {showWallets && (
        <div className="absolute top-full right-0 mt-2 flex flex-col gap-2 min-w-[200px] z-50">
          <div className="bg-white/95 backdrop-blur-sm border border-white/30 rounded-lg p-2 shadow-xl">
            {connectors.map((connector) => (
              <Button 
                key={connector.id}
                className="w-full justify-start bg-transparent hover:bg-white/20 text-gray-800 hover:text-gray-900 border-0"
                disabled={isPending}
                onClick={() => {
                  handleConnect(connector);
                }}
              >
                <Wallet className="w-4 h-4 mr-2" />
                {isPending ? 'Connecting...' : `Connect ${connector.name}`}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-full right-0 mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs min-w-[200px] z-50">
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
