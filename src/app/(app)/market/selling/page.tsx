
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, orderBy, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, MoreVertical, Pencil, Trash2, CheckCircle, PackageOpen } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { CreateListingSheet } from '../layout';
import { Separator } from '@/components/ui/separator';

interface Listing {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  description:string;
  price: number;
  category: string;
  location: string;
  imageUrls: string[];
  createdAt: Timestamp;
  status?: 'active' | 'sold';
}

export default function SellingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  
  // Alert dialog state
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    };

    const listingsCollection = collection(firestore, 'listings');
    const q = query(
      listingsCollection, 
      where('userId', '==', user.uid)
    );
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      
      // Sort on the client side to avoid composite index
      fetchedListings.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setListings(fetchedListings);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar anúncios: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar seus anúncios.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleEditClick = (listing: Listing) => {
    setEditingListing(listing);
    setIsSheetOpen(true);
  };

  const handleListingUpdated = () => {
    setEditingListing(null);
  }
  
  const openDeleteDialog = (listingId: string) => {
    setListingToDelete(listingId);
    setShowDeleteAlert(true);
  }

  const handleDeleteListing = async (listingId: string | null) => {
    if (!listingId) return;

    try {
        await deleteDoc(doc(firestore, 'listings', listingId));
        toast({
            title: "Anúncio excluído",
            description: "Seu anúncio foi removido com sucesso.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível remover o anúncio.",
        });
    } finally {
        setListingToDelete(null);
        setShowDeleteAlert(false);
    }
  };

  const handleToggleStatus = async (listing: Listing) => {
    const newStatus = listing.status === 'sold' ? 'active' : 'sold';
    const docRef = doc(firestore, 'listings', listing.id);
    try {
        await updateDoc(docRef, { status: newStatus });
        toast({
            title: "Status alterado!",
            description: `Seu anúncio foi marcado como ${newStatus === 'sold' ? 'vendido' : 'ativo'}.`
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao alterar status",
        });
    }
  }

  const formattedPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(price);
  }

  return (
    <>
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center gap-4">
            <h1 className="text-2xl font-bold">Minhas Vendas</h1>
        </div>
        <Separator />
        
        {isLoading ? (
            <div className="text-center py-10">
                <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando seus anúncios...</p>
            </div>
        ) : listings.length === 0 ? (
            <Card className="text-center py-20 col-span-full border-dashed">
                <CardHeader>
                    <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle>Você ainda não tem anúncios</CardTitle>
                    <CardDescription>
                        Clique no botão "Vender" na barra inferior para criar seu primeiro anúncio.
                    </CardDescription>
                </CardHeader>
            </Card>
        ) : (
            <div className="space-y-4">
            {listings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden">
                    <div className="flex items-center p-4 gap-4">
                        <div className="relative aspect-square w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0">
                            <Image 
                                src={(listing.imageUrls && listing.imageUrls[0]) || 'https://placehold.co/400x400.png'}
                                alt={listing.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-grow space-y-1">
                            <h3 className="font-semibold leading-tight">{listing.title}</h3>
                            <p className="text-lg font-bold text-primary">{formattedPrice(listing.price)}</p>
                            <div>
                                <Badge variant={listing.status === 'sold' ? 'secondary' : 'default'}>
                                    {listing.status === 'sold' ? 'Vendido' : 'Ativo'}
                                </Badge>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(listing)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    <span>Editar</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(listing)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    <span>Marcar como {listing.status === 'sold' ? 'Ativo' : 'Vendido'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openDeleteDialog(listing.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Excluir</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </Card>
            ))}
            </div>
        )}
      </div>

      {/* Reutiliza o mesmo Sheet de criação, mas agora com capacidade de edição */}
      <CreateListingSheet 
        isSheetOpen={isSheetOpen}
        setIsSheetOpen={setIsSheetOpen}
        editingListing={editingListing}
        onListingUpdated={handleListingUpdated}
      />

      {/* Alert Dialog para confirmação de exclusão */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o seu anúncio.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteListing(listingToDelete)} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
