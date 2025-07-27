
'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ThumbsUp, Share2, MoreHorizontal, ImagePlus, Video, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useRef, useState, useEffect } from 'react';
import app from '@/lib/firebase';
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";


interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    handle: string;
  };
  content: string;
  image?: string;
  video?: string;
  imageHint?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: any;
}


export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);


  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in.
        setCurrentUser(user);
        console.log('User signed in anonymously:', user.uid);
      } else {
        // User is signed out.
        setCurrentUser(null);
      }
    });
    
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribePosts = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        postsData.push({ 
          id: doc.id,
          ...data,
          timestamp: data.timestamp,
        } as Post);
      });
      setPosts(postsData);
    }, (error) => {
        console.error("Error fetching posts: ", error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    }
  }, [db, auth]);


  const handleMediaButtonClick = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      setMediaFile(file);
      setMediaPreview({ url, type });
    }
  };

  const removeMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.url);
    }
    setMediaPreview(null);
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!postContent && !mediaFile) return;

    try {
        let user = auth.currentUser;
        // If user is not logged in, sign in anonymously and wait for it.
        if (!user) {
            const userCredential = await signInAnonymously(auth);
            user = userCredential.user;
            console.log("Signed in anonymously to publish:", user.uid);
        }

        const postData: any = {
          author: {
            name: 'Usuário Anônimo',
            avatar: 'https://placehold.co/40x40.png',
            handle: `@user${user.uid.substring(0, 5)}`,
          },
          content: postContent,
          likes: 0,
          comments: 0,
          shares: 0,
          timestamp: serverTimestamp(),
        };

        if (mediaFile) {
            const storageRef = ref(storage, `posts/${user.uid}/${mediaFile.name}_${Date.now()}`);
            await uploadBytes(storageRef, mediaFile);
            const mediaUrl = await getDownloadURL(storageRef);
            const mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';

            if (mediaType === 'image') {
              postData.image = mediaUrl;
              postData.imageHint = 'new post';
            } else if (mediaType === 'video') {
              postData.video = mediaUrl;
            }
        }


        await addDoc(collection(db, "posts"), postData);

        setPostContent('');
        removeMedia();
    } catch (error) {
        console.error("Error publishing post: ", error);
        alert("Ocorreu um erro ao publicar. Verifique o console para mais detalhes.");
    }
  };
  
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'agora';
  
    let date: Date;
    // Check if it's already a Firebase Timestamp object
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp && typeof timestamp.seconds === 'number' && typeof timestamp.nanoseconds === 'number') {
      // Handle the object format that comes from Firestore before conversion
      date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
    } else {
      // Fallback for serverTimestamp() which might not be resolved yet
      return 'enviando...';
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
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://placehold.co/40x40.png" />
                <AvatarFallback>EU</AvatarFallback>
              </Avatar>
              <div className="w-full">
                <Textarea 
                  placeholder="No que você está pensando, produtor?" 
                  className="mb-2 bg-secondary border-none"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                />
                {mediaPreview && (
                  <div className="mt-4 relative">
                    {mediaPreview.type === 'image' ? (
                      <Image
                        src={mediaPreview.url}
                        alt="Preview"
                        width={500}
                        height={300}
                        className="rounded-lg object-cover w-full"
                      />
                    ) : (
                      <video src={mediaPreview.url} controls className="rounded-lg w-full" />
                    )}
                     <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={removeMedia}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*,video/*"
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleMediaButtonClick('image/*')}>
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleMediaButtonClick('video/*')}>
                            <Video className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                  <Button onClick={handlePublish}>Publicar</Button>
                </div>
              </div>
            </div>
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
              {post.image && (
                <div className="relative aspect-video w-full rounded-lg border">
                  <Image
                    src={post.image}
                    alt="Post image"
                    fill
                    className="object-cover rounded-lg"
                    data-ai-hint={post.imageHint}
                  />
                </div>
              )}
               {post.video && (
                <div className="relative aspect-video w-full rounded-lg border">
                  <video src={post.video} controls className="rounded-lg w-full h-full object-cover" />
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
