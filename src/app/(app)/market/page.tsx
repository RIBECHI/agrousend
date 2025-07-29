
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Search, Tag, DollarSign, MapPin, Image as ImageIcon, User, MessageSquare, ArrowLeft, Bell } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  imageUrl?: string;
  createdAt: any;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const removeImage = useCallback(() => {
    setImageFile(null);
    if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  }, [imagePreview]);


  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('');
    setLocation('');
    removeImage();
    setIsSubmitting(false);
  }, [removeImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast({
                variant: "destructive",
                title: "Imagem muito grande",
                description: "Por favor, selecione uma imagem com menos de 2MB.",
            });
            return;
        }
        setImageFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !price || !category || !location || !imageFile) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Todos os campos, incluindo a imagem, são obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
        const listingData: any = {
            userId: user.uid,
            authorName: user.displayName,
            title,
            description,
            price: parseFloat(price),
            category,
            location,
            createdAt: serverTimestamp(),
            imageUrl: await toBase64(imageFile),
        };

      await addDoc(collection(firestore, 'listings'), listingData);

      toast({
        title: "Sucesso!",
        description: "Anúncio publicado com sucesso.",
      });
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao criar anúncio: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao publicar",
        description: "Não foi possível criar o anúncio.",
      });
    } finally {
      setIsSubmitting(false);
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
            <Sheet open={isSheetOpen} onOpenChange={(open) => {
                    if(!open) resetForm();
                    setIsSheetOpen(open);
                }}>
                <SheetTrigger asChild>
                    <Button>
                    <PlusCircle className="mr-2" />
                    Criar Anúncio
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <SheetHeader>
                        <SheetTitle>Criar Novo Anúncio</SheetTitle>
                        <SheetDescription>
                        Preencha as informações para vender um item no marketplace.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                        <div className="space-y-1">
                            <Label>Imagem do Anúncio</Label>
                            {imagePreview ? (
                                <div className="relative">
                                    <Image src={imagePreview} alt="Preview do anúncio" width={200} height={200} className="rounded-md object-cover w-full aspect-square" />
                                    <Button variant="destructive" size="sm" onClick={removeImage} className="absolute top-2 right-2">Remover</Button>
                                </div>
                            ) : (
                                <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-gray-100/25">
                                    <div className="text-center">
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark dark:bg-transparent">
                                            <span>Selecione uma imagem</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" required/>
                                        </label>
                                        <p className="pl-1 dark:text-gray-400">ou arraste e solte</p>
                                        </div>
                                        <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG, GIF até 2MB</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Trator John Deere 6110J" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="price">Preço (R$)</Label>
                                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="Ex: 250000" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="category">Categoria</Label>
                                <Select value={category} onValueChange={setCategory} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="location">Localização</Label>
                            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="Ex: Rondonópolis, MT" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Fale mais sobre o item, condição, etc."/>
                        </div>
                        
                    </div>
                    <SheetFooter className="pt-4 mt-auto">
                        <SheetClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                        </SheetClose>
                        <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Publicando...</> : 'Publicar Anúncio'}
                        </Button>
                    </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
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
                <CardContent>
                    <Button onClick={() => setIsSheetOpen(true)}>
                        <PlusCircle className="mr-2"/>
                        Criar Primeiro Anúncio
                    </Button>
                </CardContent>
            </Card>
        ) : (
            <div className="grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3">
            {filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} onViewDetails={setSelectedListing} />
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
            <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedListing(null)}>Fechar</Button>
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
