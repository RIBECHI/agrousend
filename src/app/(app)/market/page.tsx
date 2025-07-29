
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, User, MessageSquare, ArrowLeft, Bell, Copy } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tag, MapPin } from 'lucide-react';

interface Listing {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  imageUrl?: string;
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
                        src={listing.imageUrl || 'https://placehold.co/400x400.png'} 
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

const categories = ['Tratores', 'Sementes', 'Fertilizantes', 'Peças', 'Serviços', 'Outros'];

export default function MarketPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Details Modal state
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

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


  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
        const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || listing.category === filterCategory;
        return matchesSearch && matchesCategory;
    })
  }, [listings, searchTerm, filterCategory]);

  const formattedPrice = (price: number | undefined) => {
    if (!price) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(price);
  }

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
            <div className="grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3">
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
        ) : filteredListings.length === 0 ? (
            <Card className="text-center py-20 col-span-full">
                <CardHeader>
                    <CardTitle>Nenhum anúncio encontrado</CardTitle>
                    <CardDescription>
                        {searchTerm || filterCategory !== 'all' 
                            ? "Tente ajustar seus filtros ou busca."
                            : "Ainda não há produtos à venda. Que tal criar o primeiro anúncio?"
                        }
                    </CardDescription>
                </CardHeader>
            </Card>
        ) : (
            <div className="grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3">
            {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onViewDetails={handleListingClick} />
            ))}
            </div>
        )}
    </div>


    {selectedListing && (
    <Dialog open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle className="text-2xl">{selectedListing.title}</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6 py-4">
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                    <Image 
                        src={selectedListing.imageUrl || 'https://placehold.co/600x600.png'}
                        alt={selectedListing.title}
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-3xl font-bold text-primary">{formattedPrice(selectedListing.price)}</p>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h3 className="font-semibold">Detalhes</h3>
                        <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                <span>{selectedListing.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{selectedListing.location}</span>
                            </div>
                                <div className="flex items-center gap-2 col-span-2">
                                <User className="h-4 w-4" />
                                <span>Vendido por: {selectedListing.authorName}</span>
                            </div>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h3 className="font-semibold">Descrição</h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {selectedListing.description || "Nenhuma descrição fornecida."}
                        </p>
                    </div>
                </div>
            </div>
            <DialogFooter className="sm:justify-start gap-2">
                <Button variant="outline" onClick={() => handleCopyLink(selectedListing.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Link
                </Button>
                <Button onClick={() => {
                    setSelectedListing(null);
                    router.push('/chat');
                    toast({ title: "Inicie uma conversa com o vendedor!"});
                }}>
                    <MessageSquare className="mr-2" />
                    Entrar em contato
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    )}
    </>
  );
}

    
