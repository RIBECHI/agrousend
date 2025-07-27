
'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ThumbsUp, Share2, MoreHorizontal, ImagePlus, Video, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useRef, useState } from 'react';

const posts = [
  {
    id: 1,
    author: {
      name: 'João da Silva',
      avatar: 'https://placehold.co/40x40.png',
      handle: '@joaosilva',
    },
    content: 'Colheita de soja começando a todo vapor! O tempo ajudou e a expectativa é de uma safra recorde. #agro #soja #safra2024',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'soybean harvest',
    likes: 125,
    comments: 23,
    shares: 12,
    timestamp: '2h',
  },
  {
    id: 2,
    author: {
      name: 'Maria Oliveira',
      avatar: 'https://placehold.co/40x40.png',
      handle: '@mariaoliveira',
    },
    content: 'Dia de campo sobre novas tecnologias de irrigação. Aprendendo muito para otimizar o uso da água na fazenda. 💧🌱',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'farm irrigation',
    likes: 88,
    comments: 15,
    shares: 5,
    timestamp: '5h',
  },
  {
    id: 3,
    author: {
      name: 'Carlos Pereira',
      avatar: 'https://placehold.co/40x40.png',
      handle: '@carlospereira',
    },
    content: 'Nosso novo trator chegou! Animado para colocar essa máquina pra trabalhar. Mais eficiência e produtividade para a nossa lavoura de milho.',
    image: 'https://placehold.co/600x400.png',
    imageHint: 'new tractor',
    likes: 210,
    comments: 45,
    shares: 20,
    timestamp: '1d',
  },
];

export default function Home() {
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setMediaPreview({ url, type });
    }
  };

  const removeMedia = () => {
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview.url);
    }
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
                <Textarea placeholder="No que você está pensando, produtor?" className="mb-2 bg-secondary border-none" />
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
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleMediaButtonClick('image/*')}>
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                        </Button>
                         <Button variant="ghost" size="icon" onClick={() => handleMediaButtonClick('video/*')}>
                            <Video className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                  <Button>Publicar</Button>
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
                <p className="text-sm text-muted-foreground">{post.author.handle} · {post.timestamp}</p>
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
