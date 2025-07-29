
'use client';

import {
  Heart,
  Home,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  Store,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/market', label: 'Início', icon: Store },
  { href: '/market/search', label: 'Buscar', icon: Search },
  { href: '/market/selling', label: 'Vendas', icon: Package },
  { href: '/market/buying', label: 'Compras', icon: ShoppingCart },
];

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen bg-background">
        <main className="flex-1 overflow-y-auto pb-20">
            {children}
        </main>
        
        <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur-sm">
            <nav className="flex items-center justify-around h-16">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                    'flex flex-col items-center justify-center text-xs gap-1 transition-colors w-full h-full',
                    isActive
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-primary'
                    )}
                >
                    <item.icon className="h-6 w-6" />
                    <span>{item.label}</span>
                </Link>
                );
            })}
            </nav>
        </footer>
    </div>
  );
}
