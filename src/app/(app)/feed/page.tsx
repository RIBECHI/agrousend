
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImageIcon, X, MoreVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  content: string;
  imageUrl?: string;
  createdAt: Timestamp;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export default function FeedPage() {
    const { user, loading } = useAuth();
    const [newPost, setNewPost] = useState('');
    const [posts, setPosts] = useState<Post[]>([]);
    const [isPosting, setIsPosting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        const postsCollection = collection(firestore, 'posts');
        const q = query(postsCollection, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Post));
            setPosts(fetchedPosts);
        }, (error) => {
            console.error("Erro ao buscar posts: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar o feed",
                description: "Houve um problema ao buscar as publicações. Tente novamente mais tarde.",
            });
        });

        return () => unsubscribe();
    }, [toast]);

    const removeImage = useCallback(() => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [imagePreview]);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 1 * 1024 * 1024) { // 1MB limit
                toast({
                    variant: "destructive",
                    title: "Imagem muito grande",
                    description: "Por favor, selecione uma imagem com menos de 1MB.",
                });
                return;
            }
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };


    const handlePostSubmit = useCallback(async () => {
        if ((!newPost.trim() && !imageFile) || !user) return;
    
        setIsPosting(true);
    
        try {
            const postsCollection = collection(firestore, 'posts');
            const newPostRef = doc(postsCollection); // Cria uma referência com ID único
    
            const postData: Omit<Post, 'createdAt'> & { createdAt: any } = {
                id: newPostRef.id,
                authorId: user.uid,
                authorName: user.displayName || 'Anônimo',
                authorPhotoURL: user.photoURL,
                content: newPost,
                createdAt: serverTimestamp(),
            };
    
            if (imageFile) {
                postData.imageUrl = await toBase64(imageFile);
            }
    
            await setDoc(newPostRef, postData); // Usa setDoc para salvar com o ID já definido
    
            setNewPost('');
            removeImage();
        } catch (error: any) {
            console.error("Erro ao criar post: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao publicar",
                description: error.message || "Não foi possível criar a publicação. Verifique o console para mais detalhes.",
            });
        } finally {
            setIsPosting(false);
        }
    }, [newPost, imageFile, user, removeImage, toast]);
    

    const handleDeletePost = async (postId: string | null) => {
        if (!postId) return;
    
        try {
            const postRef = doc(firestore, 'posts', postId);
            await deleteDoc(postRef);
            toast({
                title: "Publicação excluída",
                description: "Sua publicação foi removida com sucesso.",
            });
        } catch (error) {
            console.error("Erro ao excluir post: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao excluir",
                description: "Não foi possível remover a publicação.",
            });
        } finally {
            setPostToDelete(null);
            setShowDeleteAlert(false);
        }
    };

    const openDeleteDialog = (postId: string) => {
        setPostToDelete(postId);
        setShowDeleteAlert(true);
    }

    if (loading) {
        return (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-24 w-full" />
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                            <Skeleton className="h-10 w-10" />
                            <Skeleton className="h-10 w-24" />
                        </CardFooter>
                    </Card>
                </div>
             </div>
        )
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
    <>
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
                        {imagePreview && (
                            <div className="relative">
                                <Image src={imagePreview} alt="Preview da imagem" width={100} height={100} className="rounded-md object-cover h-24 w-24" />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6"
                                    onClick={removeImage}
                                    disabled={isPosting}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                         <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isPosting}>
                        <ImageIcon className="h-5 w-5" />
                        <span className="sr-only">Adicionar imagem</span>
                    </Button>
                    <Button onClick={handlePostSubmit} disabled={isPosting || (!newPost.trim() && !imageFile)}>
                        {isPosting ? 'Publicando...' : 'Publicar'}
                    </Button>
                </CardFooter>
            </Card>

            <div className="space-y-4">
                {posts.map(post => (
                    <Card key={post.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={post.authorPhotoURL || undefined} alt={post.authorName} />
                                        <AvatarFallback>{post.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{post.authorName}</CardTitle>
                                        <CardDescription>
                                            {post.createdAt ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'agora mesmo'}
                                        </CardDescription>
                                    </div>
                                </div>
                                {user && user.uid === post.authorId && (
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-5 w-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openDeleteDialog(post.id)} className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                <span>Excluir</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {post.content && <p className="whitespace-pre-wrap mb-4">{post.content}</p>}
                            {post.imageUrl && (
                                <div className="relative mt-4 aspect-video rounded-lg overflow-hidden border">
                                    <Image
                                        src={post.imageUrl}
                                        alt="Imagem da publicação"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                 {posts.length === 0 && !loading && (
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

    <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a sua publicação.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeletePost(postToDelete)} className="bg-destructive hover:bg-destructive/90">
                Excluir
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
