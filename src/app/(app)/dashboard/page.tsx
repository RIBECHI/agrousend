
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BarChart3, Tractor, Warehouse, MessageSquare, Calendar, Store, User, Tag } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const featureCards = [
  {
    title: 'Feed da Comunidade',
    description: 'Veja as últimas publicações e interaja com outros membros.',
    href: '/feed',
    icon: MessageSquare,
    color: 'text-blue-500'
  },
  {
    title: 'Marketplace',
    description: 'Compre e venda produtos e equipamentos agrícolas.',
    href: '/market',
    icon: Store,
    color: 'text-orange-500'
  },
  {
    title: 'Gestão de Talhões',
    description: 'Desenhe e gerencie as áreas da sua propriedade.',
    href: '/farms',
    icon: Tractor,
    color: 'text-green-500'
  },
  {
    title: 'Cadastro de Itens',
    description: 'Catalogue seus insumos, sementes e peças.',
    href: '/items',
    icon: Tag,
    color: 'text-purple-500'
  },
  {
    title: 'Controle de Estoque',
    description: 'Monitore a quantidade dos seus itens cadastrados.',
    href: '/inventory',
    icon: Warehouse,
    color: 'text-yellow-500'
  },
  {
    title: 'Agenda de Eventos',
    description: 'Fique por dentro dos eventos e feiras do setor.',
    href: '/events',
    icon: Calendar,
    color: 'text-red-500'
  },
];


export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {user?.displayName || 'Produtor'}. Aqui está um resumo da sua atividade.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featureCards.map((card) => (
          <Card key={card.title} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">{card.title}</CardTitle>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
            <CardFooter>
               <Button asChild className="w-full">
                  <Link href={card.href}>Acessar <ArrowRight className="ml-2 h-4 w-4" /></Link>
               </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
