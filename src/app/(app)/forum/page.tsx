
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, setDoc, getDoc, updateDoc, increment, deleteDoc, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader, MessageSquare, PlusCircle, ArrowLeft, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn, capitalizeName } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';


interface ForumTopic {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  createdAt: Timestamp;
  lastReplyAt?: Timestamp;
  replyCount?: number;
}

interface ForumReply {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    authorPhotoURL: string | null;
    createdAt: Timestamp;
}


export default function ForumPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);

  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newReplyContent, setNewReplyContent] = useState('');

  const [showDeleteTopicAlert, setShowDeleteTopicAlert] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<ForumTopic | null>(null);

  // Fetch all topics
  useEffect(() => {
    const topicsCollection = collection(firestore, 'forumTopics');
    const q = query(topicsCollection, orderBy('lastReplyAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTopics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumTopic));
      setTopics(fetchedTopics);
      setIsLoadingTopics(false);
    }, (error) => {
      console.error("Erro ao buscar tópicos: ", error);
      toast({ variant: "destructive", title: "Erro ao carregar tópicos."});
      setIsLoadingTopics(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // Fetch replies for selected topic
  useEffect(() => {
    if (!selectedTopic) {
        setReplies([]);
        return;
    };

    setIsLoadingReplies(true);
    const repliesCollection = collection(firestore, 'forumTopics', selectedTopic.id, 'replies');
    const q = query(repliesCollection, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedReplies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumReply));
        setReplies(fetchedReplies);
        setIsLoadingReplies(false);
    }, (error) => {
        console.error("Erro ao buscar respostas: ", error);
        toast({ variant: "destructive", title: "Erro ao carregar respostas."});
        setIsLoadingReplies(false);
    });
    
    return () => unsubscribe();
  }, [selectedTopic, toast]);


  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTopicTitle.trim() || !newTopicContent.trim()) return;

    setIsCreatingTopic(true);
    try {
        const newTopicRef = doc(collection(firestore, 'forumTopics'));
        const now = serverTimestamp();

        await setDoc(newTopicRef, {
            title: newTopicTitle,
            content: newTopicContent,
            authorId: user.uid,
            authorName: user.displayName,
            authorPhotoURL: user.photoURL,
            createdAt: now,
            lastReplyAt: now,
            replyCount: 0
        });

        toast({ title: "Tópico criado com sucesso!" });
        setNewTopicTitle('');
        setNewTopicContent('');
        setIsCreatingTopic(false);
    } catch (error) {
        console.error("Erro ao criar tópico: ", error);
        toast({ variant: 'destructive', title: "Erro ao criar tópico." });
        setIsCreatingTopic(false);
    }
  }
  
  const handleCreateReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTopic || !newReplyContent.trim()) return;

    try {
        const topicRef = doc(firestore, 'forumTopics', selectedTopic.id);
        const repliesCollection = collection(topicRef, 'replies');
        const now = serverTimestamp();

        await addDoc(repliesCollection, {
            content: newReplyContent,
            authorId: user.uid,
            authorName: user.displayName,
            authorPhotoURL: user.photoURL,
            createdAt: now,
        });

        await updateDoc(topicRef, {
            lastReplyAt: new Date(), // Use current client time to trigger order change
            replyCount: increment(1)
        });

        setNewReplyContent('');

    } catch (error) {
        console.error("Erro ao responder: ", error);
        toast({ variant: 'destructive', title: "Erro ao enviar resposta."});
    }
  }

  const handleDeleteTopic = async (topic: ForumTopic | null) => {
    if (!topic || !user || user.uid !== topic.authorId) return;

    try {
        const topicRef = doc(firestore, 'forumTopics', topic.id);
        const repliesCollectionRef = collection(topicRef, 'replies');

        // Delete all replies first
        const repliesSnapshot = await getDocs(repliesCollectionRef);
        const deletePromises = repliesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Delete the topic itself
        await deleteDoc(topicRef);

        toast({ title: "Tópico excluído com sucesso."});
        setSelectedTopic(null); // Go back to topic list
    } catch (error) {
        console.error("Erro ao excluir tópico: ", error);
        toast({ variant: 'destructive', title: 'Erro ao excluir o tópico.'});
    } finally {
        setTopicToDelete(null);
        setShowDeleteTopicAlert(false);
    }
  }

  const openDeleteDialog = (topic: ForumTopic) => {
    setTopicToDelete(topic);
    setShowDeleteTopicAlert(true);
  }

  if (!selectedTopic) {
    // ############ TOPIC LIST VIEW ############
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Criar Novo Tópico de Discussão</CardTitle>
                    <CardDescription>Inicie uma nova conversa com a comunidade.</CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateTopic}>
                    <CardContent className="space-y-4">
                        <Input 
                            placeholder="Título do seu tópico" 
                            value={newTopicTitle}
                            onChange={(e) => setNewTopicTitle(e.target.value)}
                            required
                            disabled={isCreatingTopic}
                        />
                        <Textarea 
                            placeholder="Descreva o assunto aqui..."
                            value={newTopicContent}
                            onChange={(e) => setNewTopicContent(e.target.value)}
                            required
                            rows={4}
                            disabled={isCreatingTopic}
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={isCreatingTopic || !newTopicTitle.trim() || !newTopicContent.trim()}>
                            {isCreatingTopic ? <Loader className="mr-2 animate-spin" /> : <PlusCircle className="mr-2" />}
                            Criar Tópico
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Discussões do Fórum</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingTopics ? (
                        <div className="text-center text-muted-foreground py-8">
                            <Loader className="mx-auto h-8 w-8 animate-spin" />
                            <p>Carregando tópicos...</p>
                        </div>
                    ) : topics.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Ainda não há tópicos. Seja o primeiro a criar um!</p>
                    ) : (
                        <ul className="space-y-4">
                            {topics.map(topic => (
                                <li key={topic.id} className="border-b pb-4 last:border-b-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <MessageSquare className="h-8 w-8 text-primary" />
                                            <div>
                                                <button onClick={() => setSelectedTopic(topic)} className="text-lg font-semibold text-left hover:underline">
                                                    {topic.title}
                                                </button>
                                                <p className="text-sm text-muted-foreground">
                                                    por <Link href={`/profile/${topic.authorId}`} className="hover:underline font-medium">{capitalizeName(topic.authorName)}</Link> em {topic.createdAt ? format(topic.createdAt.toDate(), 'dd/MM/yyyy') : '...'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{topic.replyCount || 0}</p>
                                            <p className="text-sm text-muted-foreground">respostas</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
  }

  // ############ SINGLE TOPIC DETAIL VIEW ############
  return (
    <>
    <div className="space-y-6">
        <div>
            <Button variant="ghost" onClick={() => setSelectedTopic(null)}>
                <ArrowLeft className="mr-2" />
                Voltar para todos os tópicos
            </Button>
        </div>

        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl">{selectedTopic.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                            <Link href={`/profile/${selectedTopic.authorId}`}>
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={selectedTopic.authorPhotoURL || undefined} />
                                    <AvatarFallback>{selectedTopic.authorName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                            Iniciado por <Link href={`/profile/${selectedTopic.authorId}`} className="hover:underline font-medium">{capitalizeName(selectedTopic.authorName)}</Link> - {selectedTopic.createdAt ? formatDistanceToNow(selectedTopic.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : ''}
                        </CardDescription>
                    </div>
                    {user?.uid === selectedTopic.authorId && (
                         <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(selectedTopic)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Tópico
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap border-t pt-6">
                {selectedTopic.content}
            </CardContent>
        </Card>

        <h2 className="text-xl font-bold">Respostas ({replies.length})</h2>

        <div className="space-y-4">
            {isLoadingReplies ? (
                 <p className="text-center text-muted-foreground py-8">Carregando respostas...</p>
            ) : (
                replies.map(reply => (
                    <Card key={reply.id} className="bg-secondary/50">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                             <div className="flex items-center gap-3">
                                <Link href={`/profile/${reply.authorId}`}>
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={reply.authorPhotoURL || undefined} />
                                        <AvatarFallback>{reply.authorName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <Link href={`/profile/${reply.authorId}`} className="hover:underline">
                                    <p className="font-semibold">{capitalizeName(reply.authorName)}</p>
                                </Link>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {reply.createdAt ? formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : ''}
                            </p>
                        </CardHeader>
                        <CardContent className="pt-2 whitespace-pre-wrap">
                            {reply.content}
                        </CardContent>
                    </Card>
                ))
            )}
             {!isLoadingReplies && replies.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhuma resposta ainda. Seja o primeiro a responder!</p>
            )}
        </div>
        
        {user && (
            <Card>
                <CardHeader>
                    <CardTitle>Sua Resposta</CardTitle>
                </CardHeader>
                 <form onSubmit={handleCreateReply}>
                    <CardContent>
                        <Textarea 
                            placeholder="Escreva sua resposta aqui..." 
                            rows={5} 
                            value={newReplyContent}
                            onChange={(e) => setNewReplyContent(e.target.value)}
                            required
                        />
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={!newReplyContent.trim()}>
                            <Send className="mr-2" />
                            Enviar Resposta
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        )}
    </div>

    <AlertDialog open={showDeleteTopicAlert} onOpenChange={setShowDeleteTopicAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o tópico e todas as suas respostas.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteTopic(topicToDelete)} className="bg-destructive hover:bg-destructive/90">
                Excluir
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
