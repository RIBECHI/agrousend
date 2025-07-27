
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ThumbsUp, Share2, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useRef } from 'react';
import { firestore, storage } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, DocumentData } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { X } from 'lucide-react';
import Link from 'next/link';

interface Post {
  id: string;
  author: {
    uid: string;
    name: string;
    avatar: string;
  };
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: any;
}

export default function FeedPage() {
  const { user, loading } = useAuth(); 
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState<File | null>(null);
  const [postMediaPreview, setPostMediaPreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(firestore, "posts"), orderBy("timestamp", "desc"));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(postsData);
    }, (error) => {
      console.error("Error fetching posts: ", error);
    });

    return () => unsubscribePosts();
  }, [user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPostMedia(file);
      setPostMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setPostMedia(null);
    setPostMediaPreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handlePublish = async () => {
    if (!user) { 
      alert("Você precisa estar logado para publicar.");
      return;
    }
    if (!postContent.trim() && !postMedia) {
        alert("A publicação não pode estar vazia.");
        return;
    }

    setIsPublishing(true);

    try {
      let imageUrl: string | undefined = undefined;
      
      if (postMedia) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${postMedia.name}`);
        const uploadResult = await uploadBytes(storageRef, postMedia);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }
      
      const postData: DocumentData = {
        author: {
          uid: user.uid,
          name: user.displayName || 'Usuário Anônimo',
          avatar: user.photoURL || 'https://placehold.co/40x40.png',
        },
        content: postContent,
        likes: 0,
        comments: 0,
        shares: 0,
        timestamp: new Date(),
      };
      
      if (imageUrl) {
        postData.imageUrl = imageUrl;
      }

      await addDoc(collection(firestore, "posts"), postData);

      setPostContent('');
      removeMedia();

    } catch (error) {
      console.error("Erro ao publicar:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      alert(`Ocorreu um erro ao publicar: ${errorMessage}`);
    } finally {
      setIsPublishing(false);
    }
  };
  
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'enviando...';
  
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
        return 'agora';
    }
  
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
  
    if (diffSeconds < 5) return 'agora';
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d`;
  }

  if (loading) {
    // We show the AppLayout's loading indicator, so we can return null here.
    return null;
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl h-full flex items-center justify-center">
        <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center text-center p-8 gap-4">
                <h3 className="text-xl font-semibold">Bem-vindo ao AgroUs!</h3>
                <p className="text-muted-foreground">Para ver o feed e interagir com a comunidade, você precisa se conectar.</p>
                <div className="flex gap-4 mt-2">
                <Button asChild size="lg">
                    <Link href="/">Fazer Login</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                    <Link href="/signup">Cadastre-se</Link>
                </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-2xl">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <fieldset disabled={isPublishing}>
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={user?.photoURL || 'https://placehold.co/40x40.png'} />
                  <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <Textarea 
                    placeholder={`No que você está pensando, ${user.displayName}?`}
                    className="mb-2 bg-secondary border-none"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                  />

                  {postMediaPreview && (
                    <div className="relative mt-2">
                      <Image src={postMediaPreview} alt="Preview" width={500} height={300} className="rounded-lg w-full h-auto object-cover" />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removeMedia}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />

                    <Button onClick={handlePublish} disabled={isPublishing}>
                      {isPublishing ? 'Publicando...' : 'Publicar'}
                    </Button>
                  </div>
                </div>
              </div>
            </fieldset>
          </CardContent>
        </Card>
        
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">@{post.author.name.toLowerCase().replace(' ', '')} · {formatTimestamp(post.timestamp)}</p>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-0">
              <p className="mb-4">{post.content}</p>
              {post.imageUrl && (
                <div className="mb-4">
                   <Image src={post.imageUrl} alt="Post media" width={1200} height={675} className="rounded-lg w-full h-auto object-cover border" />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between p-4">
              <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground">
                <ThumbsUp className="h-5 w-5" />
                <span>{post.likes}</span>
              </Button>
              <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                <span>{post.comments}</span>
              </Button>
              <Button variant="ghost" className="flex items-center gap-2 text-muted-foreground">
                <Share2 className="h-5 w-5" />
                <span>{post.shares}</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
