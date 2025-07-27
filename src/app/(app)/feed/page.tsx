
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  content: string;
  createdAt: Timestamp;
}

export default function FeedPage() {
    const { user, loading } = useAuth();
    const [newPost, setNewPost] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        if (!user) return;

        const postsCollection = collection(firestore, 'posts');
        const q = query(postsCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Post));
            setPosts(fetchedPosts);
        });

        return () => unsubscribe();
    }, [user]);

    const handlePostSubmit = async () => {
        if (!newPost.trim() || !user) return;

        setIsPosting(true);
        try {
            await addDoc(collection(firestore, 'posts'), {
                authorId: user.uid,
                authorName: user.displayName || 'Anônimo',
                authorPhotoURL: user.photoURL,
                content: newPost,
                createdAt: serverTimestamp(),
            });
            setNewPost('');
        } catch (error) {
            console.error("Erro ao criar post: ", error);
            // Aqui você pode adicionar um toast de erro
        } finally {
            setIsPosting(false);
        }
    };

    if (loading) {
        return <div>Carregando...</div>;
    }

    if (!user) {
        return (
             <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Acesso Negado</CardTitle>
                        <CardDescription>
                            Você precisa estar logado para ver o feed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button asChild>
                            <Link href="/">Fazer Login</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/signup">Cadastre-se</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Crie uma publicação</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <Textarea
                            placeholder={`No que você está pensando, ${user.displayName || 'Produtor'}?`}
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            rows={4}
                            disabled={isPosting}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={handlePostSubmit} disabled={isPosting || !newPost.trim()}>
                        {isPosting ? 'Publicando...' : 'Publicar'}
                    </Button>
                </CardFooter>
            </Card>
            
            <div className="space-y-4">
                {posts.map(post => (
                    <Card key={post.id}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={post.authorPhotoURL || 'https://placehold.co/40x40.png'} alt={post.authorName} />
                                    <AvatarFallback>{post.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{post.authorName}</CardTitle>
                                    <CardDescription>
                                        {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'agora mesmo'}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{post.content}</p>
                        </CardContent>
                    </Card>
                ))}
                 {posts.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>Ainda não há publicações.</p>
                        <p>Seja o primeiro a compartilhar algo!</p>
                    </div>
                )}
            </div>

        </div>

        <aside className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Bem-vindo ao AgroUs, {user.displayName || 'Produtor'}!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Fique por dentro das últimas notícias e conecte-se com outros produtores.</p>
                </CardContent>
            </Card>
        </aside>
    </div>
  );
}
