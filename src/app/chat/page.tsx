import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const conversations = [
  { id: 1, name: 'Maria Oliveira', lastMessage: 'Claro, podemos combinar sim!', avatar: 'https://placehold.co/40x40.png', online: true },
  { id: 2, name: 'Carlos Pereira', lastMessage: 'O trator está em perfeito estado...', avatar: 'https://placehold.co/40x40.png', online: false },
  { id: 3, name: 'Fazenda Boa Vista', lastMessage: 'Temos interesse nas sementes.', avatar: 'https://placehold.co/40x40.png', online: true },
  { id: 4, name: 'Agropecuária Sul', lastMessage: 'Qual o valor mínimo?', avatar: 'https://placehold.co/40x40.png', online: false },
  { id: 5, name: 'José Almeida', lastMessage: 'Ok, obrigado!', avatar: 'https://placehold.co/40x40.png', online: false },
];

const messages = [
  { id: 1, sender: 'Maria Oliveira', content: 'Olá João! Vi seu anúncio do trator, ainda está disponível?', time: '10:30', type: 'received' },
  { id: 2, sender: 'You', content: 'Olá Maria! Sim, está disponível.', time: '10:31', type: 'sent' },
  { id: 3, sender: 'Maria Oliveira', content: 'Ótimo! Gostaria de ver o trator. Podemos marcar uma visita?', time: '10:32', type: 'received' },
  { id: 4, sender: 'You', content: 'Claro, podemos combinar sim!', time: '10:35', type: 'sent' },
];

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
       <header className="mb-4">
          <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
          <p className="text-muted-foreground">Converse com outros produtores e feche negócios.</p>
        </header>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 border rounded-lg bg-card overflow-hidden">
        {/* Conversations List */}
        <div className="flex flex-col border-r">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Buscar conversas" className="pl-10" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {conversations.map((convo, index) => (
              <div
                key={convo.id}
                className={cn(
                  'flex items-center gap-4 p-4 cursor-pointer hover:bg-secondary/50',
                  index === 0 && 'bg-secondary'
                )}
              >
                <Avatar className="relative">
                  <AvatarImage src={convo.avatar} />
                  <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                  {convo.online && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />}
                </Avatar>
                <div className="flex-1 truncate">
                  <p className="font-semibold">{convo.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Message View */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col">
          <div className="p-4 border-b flex items-center gap-4">
            <Avatar>
              <AvatarImage src={conversations[0].avatar} />
              <AvatarFallback>{conversations[0].name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{conversations[0].name}</p>
              <p className="text-sm text-green-500">Online</p>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex items-end gap-2', msg.type === 'sent' ? 'justify-end' : 'justify-start')}
              >
                {msg.type === 'received' && <Avatar className="h-8 w-8"><AvatarImage src={conversations[0].avatar} /></Avatar>}
                <div
                  className={cn(
                    'max-w-xs lg:max-w-md p-3 rounded-2xl',
                    msg.type === 'sent' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary rounded-bl-none'
                  )}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn("text-xs mt-1", msg.type === 'sent' ? 'text-primary-foreground/70' : 'text-muted-foreground/70' ,'text-right')}>{msg.time}</p>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="p-4 border-t bg-background">
            <div className="relative">
              <Input placeholder="Digite sua mensagem..." className="pr-12 h-12" />
              <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9">
                <Send className="h-5 w-5" />
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
