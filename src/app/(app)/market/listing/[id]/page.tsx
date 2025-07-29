
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, MapPin, Tag, User, MessageSquare, Copy } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { capitalizeName } from '@/lib/utils';

interface Listing {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  imageUrls: string[];
  createdAt: any;
}

export default function ListingDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === 'string') {
      const getListing = async () => {
        setIsLoading(true);
        const docRef = doc(firestore, 'listings', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() } as Listing);
        } else {
          toast({
            variant: "destructive",
            title: "Anúncio não encontrado",
          });
          router.push('/market');
        }
        setIsLoading(false);
      };

      getListing();
    }
  }, [id, router, toast]);
  
  const handleCopyLink = async (listingId: string) => {
    try {
        const link = `${window.location.origin}/market/listing/${listingId}`;
        await navigator.clipboard.writeText(link);
        toast({ title: 'Link do anúncio copiado!' });
    } catch (err) {
        console.error('Falha ao copiar o link:', err);
        toast({
            variant: 'destructive',
            title: 'Erro',
            description: 'Não foi possível copiar o link.',
        });
    }
  };

  const formattedPrice = (price: number | undefined) => {
    if (!price) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(price);
  }

  if (isLoading) {
    return (
        <div className="p-4 md:p-8">
            <header className="mb-6">
                <Skeleton className="h-8 w-40" />
            </header>
            <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="w-full aspect-square rounded-lg" />
                <div className="space-y-6">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-12 w-1/3" />
                    <Separator />
                    <Skeleton className="h-6 w-1/4" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-2/3" />
                    </div>
                     <div className="flex gap-2 pt-4">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>
        </div>
    )
  }

  if (!listing) {
    return null; // ou um componente de "não encontrado" mais elaborado
  }


  return (
    <div className="min-h-screen bg-background">
         <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4">
            <Button variant="ghost" asChild>
            <Link href="/market">
                <ArrowLeft />
                <span className="ml-2 font-semibold">Voltar ao Marketplace</span>
            </Link>
            </Button>
        </header>

        <main className="p-4 md:p-8 max-w-6xl mx-auto">
             <div className="grid md:grid-cols-2 gap-8">
                <Carousel className="w-full">
                    <CarouselContent>
                        {(listing.imageUrls && listing.imageUrls.length > 0) ? (
                            listing.imageUrls.map((url, index) => (
                                <CarouselItem key={index}>
                                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                                        <Image
                                            src={url}
                                            alt={`${listing.title} - imagem ${index + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                </CarouselItem>
                            ))
                        ) : (
                            <CarouselItem>
                                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                                    <Image
                                        src={'https://placehold.co/600x600.png'}
                                        alt={listing.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </CarouselItem>
                        )}
                    </CarouselContent>
                    {(listing.imageUrls && listing.imageUrls.length > 1) && (
                        <>
                            <CarouselPrevious className="absolute left-2" />
                            <CarouselNext className="absolute right-2" />
                        </>
                    )}
                </Carousel>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold">{listing.title}</h1>
                    
                    <div>
                        <p className="text-4xl font-bold text-primary">{formattedPrice(listing.price)}</p>
                    </div>

                    <Separator />
                    
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Detalhes</h3>
                        <div className="text-base text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2">
                            <div className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                <span>{listing.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                <span>{listing.location}</span>
                            </div>
                                <div className="flex items-center gap-2 col-span-2">
                                <User className="h-5 w-5" />
                                <span>Vendido por: <Link href={`/profile/${listing.userId}`} className="font-medium text-foreground hover:underline">{capitalizeName(listing.authorName)}</Link></span>
                            </div>
                        </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg">Descrição</h3>
                        <p className="text-base text-muted-foreground whitespace-pre-wrap">
                            {listing.description || "Nenhuma descrição fornecida."}
                        </p>
                    </div>
                    
                     <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button size="lg" onClick={() => handleCopyLink(listing.id)}>
                            <Copy className="mr-2" />
                            Copiar Link
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => {
                            router.push('/chat');
                            toast({ title: "Inicie uma conversa com o vendedor!"});
                        }}>
                            <MessageSquare className="mr-2" />
                            Entrar em contato
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
}
