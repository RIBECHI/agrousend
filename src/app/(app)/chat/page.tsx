
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const usersCollection = collection(firestore, 'users');
    const q = user ? query(usersCollection, where('uid', '!=', user.uid)) : query(usersCollection);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(fetchedUsers);
      setIsLoadingUsers(false);
    }, (error) => {
      console.error("Erro ao buscar usuários: ", error);
      setIsLoadingUsers(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (selectedUser && user) {
      const chatId = [user.uid, selectedUser.uid].sort().join('_');
      const messagesCollection = collection(firestore, 'chats', chatId, 'messages');
      const q = query(messagesCollection, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(fetchedMessages);
      });

      return () => unsubscribe();
    }
  }, [selectedUser, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUser || isSending) return;

    setIsSending(true);
    const chatId = [user.uid, selectedUser.uid].sort().join('_');
    const messagesCollection = collection(firestore, 'chats', chatId, 'messages');

    try {
      await addDoc(messagesCollection, {
        text: newMessage,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Erro ao enviar mensagem: ", error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);
  
  return (
    <div className="h-[calc(100vh-10rem)] flex">
      <Card className="w-1/3 min-w-[300px] flex flex-col">
        <CardHeader className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users /> Produtores</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ScrollArea className="h-full">
            {isLoadingUsers ? (
                <p className="p-4 text-muted-foreground">Carregando usuários...</p>
            ) : (
                filteredUsers.map(u => (
                <div
                    key={u.uid}
                    className={cn(
                        "flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50",
                        selectedUser?.uid === u.uid && "bg-muted"
                    )}
                    onClick={() => setSelectedUser(u)}
                >
                    <Avatar>
                    <AvatarImage src={u.photoURL || undefined} alt={u.displayName} />
                    <AvatarFallback>{u.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                    <p className="font-semibold">{u.displayName}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                </div>
                ))
            )}
            {!isLoadingUsers && filteredUsers.length === 0 && (
                 <p className="p-4 text-center text-muted-foreground">Nenhum produtor encontrado.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <Card className="flex-1 flex flex-col ml-4">
            <CardHeader className="border-b">
              <div className="flex items-center gap-4">
                 <Avatar>
                    <AvatarImage src={selectedUser.photoURL || undefined} alt={selectedUser.displayName} />
                    <AvatarFallback>{selectedUser.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                 </Avatar>
                 <h2 className="text-xl font-bold">{selectedUser.displayName}</h2>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-19rem)] p-4">
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={cn("flex", msg.senderId === user?.uid ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "rounded-lg px-4 py-2 max-w-sm",
                                     msg.senderId === user?.uid ? "bg-primary text-primary-foreground" : "bg-muted"
                                )}>
                                    <p>{msg.text}</p>
                                    <p className={cn(
                                        "text-xs mt-1",
                                        msg.senderId === user?.uid ? "text-primary-foreground/70" : "text-muted-foreground/70"
                                    )}>
                                        {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div ref={messagesEndRef} />
                </ScrollArea>
            </CardContent>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        disabled={isSending}
                    />
                    <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                        <Send />
                    </Button>
                </form>
            </div>
          </Card>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground ml-4 border rounded-lg">
            <div className="text-center">
                <User className="mx-auto h-12 w-12" />
                <p className="mt-2">Selecione um produtor para iniciar uma conversa.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
