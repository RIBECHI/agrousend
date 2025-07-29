
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, Bell, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

const ListingCard = ({ listing, onViewDetails }: { listing: Listing, onViewDetails: (listing: Listing) => void }) => {
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(listing.price);

    return (
        <Card className="overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => onViewDetails(listing)}>
            <CardContent className="p-0">
                <div className="relative aspect-square bg-muted">
                     <Image 
                        src={(listing.imageUrls && listing.imageUrls[0]) || 'https://placehold.co/400x400.png'}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        data-ai-hint="farm product"
                    />
                </div>
                <div className="p-4 space-y-2">
                    <p className="text-lg font-bold">{formattedPrice}</p>
                    <p className="font-semibold leading-tight">{listing.title}</p>
                    <p className="text-sm text-muted-foreground">{listing.location}</p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function MarketPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const listingsCollection = collection(firestore, 'listings');
    const q = query(listingsCollection, orderBy('createdAt', 'desc'));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setListings(fetchedListings);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar anúncios: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar anúncios.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleListingClick = (listing: Listing) => {
    router.push(`/market/listing/${listing.id}`);
  };

  return (
    <>
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4">
        <Button variant="ghost" asChild>
          <Link href="/feed">
            <ArrowLeft />
            <span className="ml-2 font-semibold">Feed</span>
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Marketplace</h1>
        <Button variant="ghost" size="icon">
          <Bell />
          <span className="sr-only">Notificações</span>
        </Button>
    </header>
    <div className="p-4 space-y-4">
        <div className="flex justify-between items-center gap-4">
            <h1 className="text-2xl font-bold">Anúncios</h1>
        </div>

        {isLoading ? (
            <div className="grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-0">
                            <Skeleton className="w-full aspect-square" />
                            <div className="p-4 space-y-2">
                                <Skeleton className="h-7 w-1/3" />
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-5 w-1/2" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : listings.length === 0 ? (
            <Card className="text-center py-20 col-span-full">
                <CardHeader>
                    <CardTitle>Nenhum anúncio encontrado</CardTitle>
                    <CardDescription>
                        Ainda não há produtos à venda. Que tal criar o primeiro anúncio?
                    </CardDescription>
                </CardHeader>
            </Card>
        ) : (
            <div className="grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-4">
            {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onViewDetails={handleListingClick} />
            ))}
            </div>
        )}
    </div>
    </>
  );
}
