import { Gift } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Link, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { PrivyAuthModal } from '../components/PrivyAuthModal';
import { PrivyConnectedAccounts } from '../components/PrivyConnectedAccounts';
import { Toaster } from '../components/ui/sonner';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [isPrivyModalOpen, setIsPrivyModalOpen] = useState(false);

  const navigationItems = [
    { path: '/agent', label: 'Contacts', icon: '🎤' },
    { path: '/create', label: 'Create', icon: '➕' },
    { path: '/my', label: 'My Cards', icon: '🎴' },
    { path: '/spend', label: 'Spend', icon: '💳' },
    { path: '/history', label: 'History', icon: '📜' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen circle-gradient-bg">
      <div className="abstract-shape" aria-hidden="true" />
      <header className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-circle-card">
            <Gift className="h-7 w-7" />
          </div>
          <span className="text-2xl font-semibold text-foreground">Sendly</span>
        </div>

        <div className="flex items-center gap-4">
          <PrivyConnectedAccounts />
          <button
            onClick={() => setIsPrivyModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-border bg-card/90 px-4 py-2 font-medium text-foreground transition-all duration-200 hover:bg-card backdrop-blur-sm shadow-circle-card"
          >
            🔐 Social login
          </button>
          <ConnectButton />
        </div>
      </header>

      <PrivyAuthModal
        isOpen={isPrivyModalOpen}
        onClose={() => setIsPrivyModalOpen(false)}
      />

      <div className="relative z-10 container mx-auto px-6 pb-6">
        <div className="max-w-2xl mx-auto">
          <nav className="mb-4">
            <div className="flex gap-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 px-3 py-2 rounded-2xl text-center text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/80 text-foreground/80 hover:bg-secondary'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <Card className="rounded-2xl bg-card shadow-circle-card backdrop-blur-sm">
            {children}
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
}

