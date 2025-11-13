import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface DeveloperWalletProps {
  blockchain?: string;
  onWalletCreated?: () => void;
}

export function DeveloperWalletComponent({ blockchain }: DeveloperWalletProps) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border border-gray-200 shadow-circle-card">
     {/* <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Internal Wallet Disabled
        </CardTitle>
        <CardDescription>
          Internal wallet functionality has been removed. Telegram agents now operate with your connected wallet directly.
        </CardDescription>*/}
     {/* </CardHeader> */}
     {/* <CardContent className="space-y-4">
        <CardDescription>
          {blockchain ? `Selected network: ${blockchain}` : 'No specific network required.'}
        </CardDescription>
      </CardContent> */}
    </Card> 
  );
}

