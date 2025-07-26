'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Newspaper,
  MessageSquare,
  User,
  Bell,
  CalendarDays,
  MessagesSquare,
  Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Feed', icon: Home },
  { href: '/market', label: 'Anúncios Rurais', icon: Newspaper },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/forum', label: 'Fórum', icon: MessagesSquare },
  { href: '/events', label: 'Eventos', icon: CalendarDays },
  { href: '/profile', label: 'Perfil', icon: User },
  { href: '/notifications', label: 'Notificações', icon: Bell },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col p-4 space-y-2">
      {navItems.map((item) => (
        <Link href={item.href} key={item.href} passHref>
          <Button
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="w-full justify-start rounded-full"
            asChild
          >
            <a>
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </a>
          </Button>
        </Link>
      ))}
    </nav>
  );
}
