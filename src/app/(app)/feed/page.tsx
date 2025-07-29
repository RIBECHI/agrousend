
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, Timestamp, deleteDoc, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDocs, writeBatch } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImageIcon, X, MoreVertical, Trash2, Heart, MessageSquare, Send, Share2, ThumbsUp } from 'lucide-react';
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
import { cn, capitalizeName } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';


interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorPhotoURL: string | null;
    content: string;
    createdAt: Timestamp;
}

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string | null;
  content: string;
  imageUrl?: string;
  videoId?: string;
  createdAt: Timestamp;
  likes?: string[];
  comments?: Comment[];
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const PostCard = ({ post, user, openDeleteDialog, handleLikeToggle }: { post: Post, user: any, openDeleteDialog: (id: string) => void, handleLikeToggle: (id: string) => void }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isCommenting, setIsCommenting] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const { toast } = useToast();
    const hasLiked = user ? post.likes?.includes(user.uid) : false;

    useEffect(() => {
        const commentsCollection = collection(firestore, 'posts', post.id, 'comments');
        const q = query(commentsCollection, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
            setComments(fetchedComments);
        }, (error) => {
            console.error("Erro ao buscar comentários: ", error);
        });

        return () => unsubscribe();
    }, [post.id]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setIsCommenting(true);
        try {
            const commentsCollection = collection(firestore, 'posts', post.id, 'comments');
            await addDoc(commentsCollection, {
                authorId: user.uid,
                authorName: user.displayName || 'Anônimo',
                authorPhotoURL: user.photoURL,
                content: newComment,
                createdAt: serverTimestamp(),
            });
            setNewComment('');
            setShowCommentInput(false); // Oculta o campo após o envio
        } catch (error) {
            console.error("Erro ao adicionar comentário: ", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível adicionar seu comentário.",
            });
        } finally {
            setIsCommenting(false);
        }
    };
    
    const embedUrl = post.videoId ? `https://www.youtube.com/embed/${post.videoId}` : null;
    const likeCount = post.likes?.length || 0;
    const commentCount = comments.length || 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={`/profile/${post.authorId}`}>
                            <Avatar>
                                <AvatarImage src={post.authorPhotoURL || undefined} alt={post.authorName} />
                                <AvatarFallback>{post.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </Link>
                        <div>
                            <Link href={`/profile/${post.authorId}`} className="hover:underline">
                                <CardTitle className="text-base">{capitalizeName(post.authorName)}</CardTitle>
                            </Link>
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
                                <DropdownMenuItem onClick={() => openDeleteDialog(post.id)} className="text-destructive cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Excluir</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="py-0">
                {post.content && <p className="whitespace-pre-wrap mb-4">{post.content}</p>}
                
                {embedUrl && (
                     <div className="relative aspect-video rounded-lg overflow-hidden border">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src={embedUrl}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
                {post.imageUrl && !embedUrl && (
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
            
            {(likeCount > 0 || commentCount > 0) && (
                 <div className="px-6 py-2 flex justify-between items-center text-sm text-muted-foreground">
                    {likeCount > 0 && (
                        <div className="flex items-center gap-1">
                            <div className="bg-primary p-1 rounded-full">
                                <ThumbsUp className="h-3 w-3 text-primary-foreground" />
                            </div>
                            <span>{likeCount}</span>
                        </div>
                    )}
                     {commentCount > 0 && (
                        <span>{commentCount} {commentCount === 1 ? 'comentário' : 'comentários'}</span>
                    )}
                </div>
            )}
           
            <div className="border-t border-b mx-6 my-2">
                <div className="flex justify-around">
                    <Button variant="ghost" className="w-full rounded-none" onClick={() => handleLikeToggle(post.id)}>
                        <Heart className={cn("mr-2 h-5 w-5", hasLiked && "text-red-500 fill-current")} />
                        <span>Curtir</span>
                    </Button>
                     <div className="border-l h-auto my-2"></div>
                    <Button variant="ghost" className="w-full rounded-none" onClick={() => setShowCommentInput(!showCommentInput)}>
                        <MessageSquare className="mr-2 h-5 w-5" />
                        <span>Comentar</span>
                    </Button>
                     <div className="border-l h-auto my-2"></div>
                     <Button variant="ghost" className="w-full rounded-none" onClick={() => toast({ title: 'Funcionalidade em breve!'})}>
                        <Share2 className="mr-2 h-5 w-5" />
                        <span>Compartilhar</span>
                    </Button>
                </div>
            </div>


            <CardFooter className="flex-col items-start pt-4">
                {showCommentInput && user && (
                  <form onSubmit={handleCommentSubmit} className="w-full flex items-center gap-2 mb-4">
                      <Avatar className="h-9 w-9">
                          <AvatarImage src={user?.photoURL || undefined} />
                          <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Input 
                          placeholder="Adicione um comentário..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          disabled={isCommenting}
                          className="rounded-full bg-muted focus-visible:ring-1"
                          autoFocus
                      />
                      <Button type="submit" size="icon" disabled={!newComment.trim() || isCommenting} className="rounded-full">
                          <Send className="h-5 w-5" />
                      </Button>
                  </form>
                )}

                <div className="w-full space-y-4">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-3">
                           <Link href={`/profile/${comment.authorId}`}>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={comment.authorPhotoURL || undefined} alt={comment.authorName} />
                                    <AvatarFallback>{comment.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="bg-muted p-3 rounded-lg w-full">
                                <div className="flex items-center justify-between">
                                     <Link href={`/profile/${comment.authorId}`} className="hover:underline">
                                        <p className="font-semibold text-sm">{capitalizeName(comment.authorName)}</p>
                                     </Link>
                                    <p className="text-xs text-muted-foreground">
                                         {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : ''}
                                    </p>
                                </div>
                                <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardFooter>
        </Card>
    )
};


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

    const compressImage = async (file: File, quality = 0.7, maxSizeMB = 1): Promise<File> => {
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size <= maxSize) {
            return file;
        }

        return new Promise((resolve, reject) => {
            const image = new window.Image();
            image.src = URL.createObjectURL(file);
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    return reject(new Error('Não foi possível obter o contexto do canvas.'));
                }

                let { width, height } = image;

                // Opcional: Redimensionar a imagem se for muito grande
                const MAX_WIDTH_HEIGHT = 1920;
                if (width > height) {
                    if (width > MAX_WIDTH_HEIGHT) {
                        height *= MAX_WIDTH_HEIGHT / width;
                        width = MAX_WIDTH_HEIGHT;
                    }
                } else {
                    if (height > MAX_WIDTH_HEIGHT) {
                        width *= MAX_WIDTH_HEIGHT / height;
                        height = MAX_WIDTH_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(image, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            if (blob.size > maxSize) {
                                // Se ainda for muito grande, tenta comprimir mais (recursivamente)
                                // Isso é uma simplificação, idealmente você não usaria recursão aqui para evitar loops
                                toast({
                                    variant: "destructive",
                                    title: "Compressão falhou",
                                    description: "A imagem é muito grande mesmo após a compressão inicial.",
                                });
                                return reject(new Error("Imagem muito grande."));
                            }
                            const newFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Falha ao criar o blob da imagem.'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            image.onerror = reject;
        });
    };


    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const compressedFile = await compressImage(file);
                setImageFile(compressedFile);
                const previewUrl = URL.createObjectURL(compressedFile);
                setImagePreview(previewUrl);
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Erro ao processar imagem",
                    description: error.message || "Não foi possível comprimir a imagem.",
                });
                removeImage();
            }
        }
    };


    const getYouTubeVideoId = (url: string): string | null => {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|shorts\/|user\/.+\/|attribution_link\?a=.*&u=%2Fwatch%3Fv%3D|e\/)?([\w-]{11})(?:\S+)?/;
        const match = url.match(youtubeRegex);
        return match ? match[1] : null;
    }
    
    const handlePostSubmit = useCallback(async () => {
        if ((!newPost.trim() && !imageFile) || !user) return;
    
        setIsPosting(true);
    
        try {
            const postsCollection = collection(firestore, 'posts');
            
            const postData: Omit<Post, 'id' | 'createdAt' | 'comments'> & { createdAt: any; likes: any[]; videoId?: string; imageUrl?: string } = {
                authorId: user.uid,
                authorName: user.displayName || 'Anônimo',
                authorPhotoURL: user.photoURL,
                content: newPost,
                createdAt: serverTimestamp(),
                likes: [],
            };
    
            if (imageFile) {
                postData.imageUrl = await toBase64(imageFile);
            }
            
            const videoId = getYouTubeVideoId(newPost);
            if (videoId) {
                postData.videoId = videoId;
            }
    
            await addDoc(postsCollection, postData);
    
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
    
        const postRef = doc(firestore, 'posts', postId);
        const commentsCollectionRef = collection(postRef, 'comments');
    
        try {
            const batch = writeBatch(firestore);
            
            const commentsSnapshot = await getDocs(commentsCollectionRef);
            if (!commentsSnapshot.empty) {
                commentsSnapshot.forEach((commentDoc) => {
                    batch.delete(commentDoc.ref);
                });
            }
    
            batch.delete(postRef);
            await batch.commit();
    
            toast({
                title: "Publicação excluída",
                description: "Sua publicação e todos os comentários foram removidos.",
            });
        } catch (error) {
            console.error("Erro ao excluir post: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao excluir",
                description: "Não foi possível remover a publicação. Verifique as regras de segurança.",
            });
        } finally {
            setPostToDelete(null);
            setShowDeleteAlert(false);
        }
    };
    
    const handleLikeToggle = async (postId: string) => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Ação necessária",
                description: "Você precisa estar logado para curtir uma publicação.",
            });
            return;
        }
    
        const postRef = doc(firestore, 'posts', postId);
        const post = posts.find(p => p.id === postId);
    
        if (!post) return;
    
        try {
            if (post.likes?.includes(user.uid)) {
                // Unlike
                await updateDoc(postRef, {
                    likes: arrayRemove(user.uid)
                });
            } else {
                // Like
                await updateDoc(postRef, {
                    likes: arrayUnion(user.uid)
                });
            }
        } catch (error) {
            console.error("Erro ao curtir o post: ", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível atualizar a curtida.",
            });
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
                            placeholder={`No que você está pensando, ${capitalizeName(user.displayName || 'Produtor')}? Cole um link do YouTube!`}
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
                   <PostCard 
                     key={post.id} 
                     post={post} 
                     user={user} 
                     openDeleteDialog={openDeleteDialog} 
                     handleLikeToggle={handleLikeToggle}
                   />
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
                    <CardTitle>Bem-vindo ao AgroUs, {capitalizeName(user.displayName || 'Produtor')}!</CardTitle>
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
                Esta ação não pode ser desfeita. Isso excluirá permanentemente a sua publicação e todos os comentários associados.
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
