
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader, Search as SearchIcon, X, SlidersHorizontal, MapPin, Tag, MessageSquare, User, Copy, Share2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { brazilianStates } from '@/lib/brazilian-locations';

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
                    <p className="font-semibold leading-tight line-clamp-2">{listing.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{listing.location}</p>
                </div>
            </CardContent>
        </Card>
    )
}

const categories = ['Todos', 'Tratores', 'Sementes', 'Fertilizantes', 'Peças', 'Serviços', 'Outros'];
const distances = ['50km', '100km', '200km', '500km', 'Qualquer'];

export default function MarketSearchPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [filterState, setFilterState] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [cities, setCities] = useState<string[]>([]);
  const [filterDistance, setFilterDistance] = useState('Qualquer');

  // Details Modal state
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (filterState && filterState !== 'all') {
        const selectedStateData = brazilianStates.find(s => s.sigla === filterState);
        setCities(selectedStateData ? selectedStateData.cidades : []);
        setFilterCity('all'); // Reseta a cidade quando o estado muda
    } else {
        setCities([]);
    }
  }, [filterState]);

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
        const matchesCategory = filterCategory === 'Todos' || listing.category === filterCategory;
        const locationString = listing.location.toLowerCase();
        
        const stateInfo = brazilianStates.find(s => s.sigla === filterState);
        const stateName = stateInfo ? stateInfo.nome.toLowerCase() : '';

        const matchesLocation = (filterState === 'all' && filterCity === 'all') || 
                                (filterState !== 'all' && filterCity === 'all' && (locationString.includes(stateName) || locationString.includes(filterState.toLowerCase()))) ||
                                (filterState !== 'all' && filterCity !== 'all' && locationString.includes(filterCity.toLowerCase()) && (locationString.includes(stateName) || locationString.includes(filterState.toLowerCase())));
        
        return matchesSearch && matchesCategory && matchesLocation;
    })
  }, [listings, searchTerm, filterCategory, filterState, filterCity]);

  const formattedPrice = (price: number | undefined) => {
    if (!price) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(price);
  }

  const SearchResults = () => {
    if (isLoading) {
        return (
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
        )
    }

    if (filteredListings.length === 0) {
        return (
            <div className="text-center py-20 col-span-full">
                <p className="text-lg font-semibold">Nenhum anúncio encontrado</p>
                <p className="text-muted-foreground">Tente ajustar seus filtros ou busca.</p>
            </div>
        )
    }

    return (
        <div className="grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-4">
            {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onViewDetails={() => router.push(`/market/listing/${listing.id}`)} />
            ))}
        </div>
    )
  }

  return (
    <>
    <div className="p-4 space-y-6">
        <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="O que você está procurando?"
                className="pl-10 h-12 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Estados</SelectItem>
                    {brazilianStates.map(state => <SelectItem key={state.sigla} value={state.sigla}>{state.nome}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={filterCity} onValueChange={setFilterCity} disabled={!filterState || filterState === 'all'}>
                <SelectTrigger>
                    <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Cidades</SelectItem>
                    {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
            </Select>
             <Select value={filterDistance} onValueChange={setFilterDistance}>
                <SelectTrigger>
                    <SelectValue placeholder="Raio" />
                </SelectTrigger>
                <SelectContent>
                    {distances.map(dist => <SelectItem key={dist} value={dist}>{dist}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        
        <Separator />

       <SearchResults />
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
                        src={(selectedListing.imageUrls && selectedListing.imageUrls[0]) || 'https://placehold.co/600x600.png'}
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
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Entrar em contato
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    )}
    </>
  );
}
