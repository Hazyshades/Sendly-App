import { Gift } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 bg-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <Gift className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Sendly</h1>
        <p className="text-white/80 text-lg">NFT Gift Cards on Base</p>
        <div className="mt-8">
          <div className="inline-flex items-center gap-2 text-white/60">
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
