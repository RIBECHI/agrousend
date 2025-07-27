
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, MessageCircle, Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';

const notifications = [
  {
    id: 1,
    type: 'like',
    user: { name: 'Maria Oliveira', avatar: 'https://placehold.co/40x40.png' },
    content: 'curtiu sua publicação: "Colheita de soja começando..."',
    timestamp: '5m',
    read: false,
    icon: ThumbsUp,
    iconClass: 'text-blue-500 bg-blue-100',
  },
  {
    id: 2,
    type: 'comment',
    user: { name: 'Carlos Pereira', avatar: 'https://placehold.co/40x40.png' },
    content: 'comentou na sua publicação: "Ótima máquina! Boa sorte com ela."',
    timestamp: '1h',
    read: false,
    icon: MessageCircle,
    iconClass: 'text-green-500 bg-green-100',
  },
  {
    id: 3,
    type: 'ad',
    user: { name: 'Sistema', avatar: 'https://placehold.co/40x40.png' },
    content: 'Novo anúncio de "Trator Valtra" em sua região.',
    timestamp: '3h',
    read: true,
    icon: Newspaper,
    iconClass: 'text-orange-500 bg-orange-100',
  },
  {
    id: 4,
    type: 'like',
    user: { name: 'Fazenda Boa Vista', avatar: 'https://placehold.co/40x40.png' },
    content: 'curtiu sua publicação: "Dia de campo sobre novas tecnologias..."',
    timestamp: '1d',
    read: true,
    icon: ThumbsUp,
    iconClass: 'text-blue-500 bg-blue-100',
  },
];


export default function NotificationsPage() {
  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Notificações</CardTitle>
            <Button variant="link">Marcar todas como lidas</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg transition-colors hover:bg-secondary/50',
                  !notification.read && 'bg-secondary'
                )}
              >
                <div className={cn("p-2 rounded-full", notification.iconClass)}>
                  <notification.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p>
                    <span className="font-semibold">{notification.user.name}</span>{' '}
                    {notification.content}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{notification.timestamp}</p>
                </div>
                {!notification.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
