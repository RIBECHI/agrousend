
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ThumbsUp, Share2, MoreHorizontal } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { firestore, auth } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    handle: string;
  };
  content: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: any;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
        } catch (error) {
          console.error("Error signing in anonymously:", error);
        }
      }
    });

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

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const handlePublish = async () => {
    if (!user) {
      alert("Aguardando autenticação. Por favor, tente novamente em alguns segundos.");
      return;
    }
    if (!postContent.trim()) {
        alert("A publicação não pode estar vazia.");
        return;
    }

    setIsPublishing(true);

    try {
      const newPost = {
        author: {
          name: 'Usuário Anônimo',
          avatar: 'https://placehold.co/40x40.png',
          handle: `@user${user.uid.substring(0, 5)}`,
        },
        content: postContent,
        likes: 0,
        comments: 0,
        shares: 0,
        timestamp: new Date(),
      };

      await addDoc(collection(firestore, "posts"), newPost);

      setPostContent('');
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

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <fieldset disabled={!user || isPublishing} className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" />
                <AvatarFallback>EU</AvatarFallback>
              </Avatar>
              <div className="w-full">
                <Textarea 
                  placeholder={!user ? "Autenticando..." : "No que você está pensando, produtor?"}
                  className="mb-2 bg-secondary border-none"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                <div className="flex justify-end items-center mt-2">
                  <Button onClick={handlePublish} disabled={!user || isPublishing}>
                    {isPublishing ? 'Publicando...' : 'Publicar'}
                  </Button>
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
                <p className="text-sm text-muted-foreground">{post.author.handle} · {formatTimestamp(post.timestamp)}</p>
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-0">
              <p className="mb-4">{post.content}</p>
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
