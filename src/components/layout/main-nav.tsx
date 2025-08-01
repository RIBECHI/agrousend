
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
  Leaf,
  Shield,
  Tractor,
  Warehouse,
  ChevronDown,
  Settings,
  LayoutDashboard,
  Tag,
  Store,
  Map,
  Box,
  ClipboardList,
  Wheat,
  ListChecks,
  ShieldCheck,
  Beef,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

const topLevelNavItems = [
  { href: '/feed', label: 'Feed', icon: Home },
  { href: '/market', label: 'Marketplace', icon: Store },
  { href: '/chat', label: 'Chat', icon: MessageSquare },
  { href: '/forum', label: 'Fórum', icon: MessagesSquare },
  { href: '/events', label: 'Eventos', icon: CalendarDays },
];

const managementNavItems = [
    { href: '/harvests', label: 'Safras', icon: Wheat },
    { href: '/farms', label: 'Gestão de Talhões', icon: Map },
    { href: '/items', label: 'Insumos', icon: Box },
    { href: '/inventory', label: 'Estoque', icon: Warehouse },
    { href: '/machinery', label: 'Maquinário', icon: Tractor },
    { href: '/livestock', label: 'Rebanho', icon: Beef },
    { href: '/planning', label: 'Planejamento', icon: ListChecks },
]

const bottomLevelNavItems = [
  { href: '/profile', label: 'Perfil', icon: User },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

const adminNavItem = { href: '/admin', label: 'Admin', icon: Shield };
const promoteNavItem = { href: '/promote', label: 'Promover para Admin', icon: ShieldCheck };


export function MainNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isManagementOpen, setIsManagementOpen] = useState(
    managementNavItems.some(item => pathname.startsWith(item.href))
  );

  return (
    <nav className="flex flex-col p-2 space-y-1 h-full">
      {topLevelNavItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
          className="w-full justify-start rounded-md"
        >
          <Link href={item.href}>
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Link>
        </Button>
      ))}

        <Collapsible open={isManagementOpen} onOpenChange={setIsManagementOpen}>
            <CollapsibleTrigger asChild>
                 <Button
                    variant={'ghost'}
                    className="w-full justify-start rounded-md"
                >
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    Gestão
                    <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", isManagementOpen && "rotate-180")} />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="py-1 pl-6">
                <div className="flex flex-col space-y-1">
                    {managementNavItems.map((item) => (
                         <Button
                            key={item.href}
                            asChild
                            variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                            className="w-full justify-start rounded-md"
                            >
                            <Link href={item.href}>
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.label}
                            </Link>
                        </Button>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>

      <div className="flex-grow" />
      
      {user?.email === 'desafyo@gmail.com' && user?.role !== 'admin' && (
         <Button
          asChild
          variant={pathname.startsWith(promoteNavItem.href) ? 'secondary' : 'ghost'}
          className="w-full justify-start rounded-md text-primary"
        >
          <Link href={promoteNavItem.href}>
            <promoteNavItem.icon className="mr-3 h-5 w-5" />
            {promoteNavItem.label}
          </Link>
        </Button>
      )}

      {user?.role === 'admin' && (
         <Button
          asChild
          variant={pathname.startsWith(adminNavItem.href) ? 'secondary' : 'ghost'}
          className="w-full justify-start rounded-md"
        >
          <Link href={adminNavItem.href}>
            <adminNavItem.icon className="mr-3 h-5 w-5" />
            {adminNavItem.label}
          </Link>
        </Button>
      )}

      {bottomLevelNavItems.map((item) => (
        <Button
          key={item.href}
          asChild
          variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
          className="w-full justify-start rounded-md"
        >
          <Link href={item.href}>
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
