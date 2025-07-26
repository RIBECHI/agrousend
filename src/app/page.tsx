import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ThumbsUp, Share2, MoreHorizontal } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
                <div className="flex justify-end">
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
