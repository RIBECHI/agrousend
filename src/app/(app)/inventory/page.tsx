
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, Package } from 'lucide-react';
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

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  description: string;
  userId: string;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // State for the form
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    };

    const itemsCollection = collection(firestore, 'inventoryItems');
    const q = query(itemsCollection, where('userId', '==', user.uid));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setItems(fetchedItems);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar itens de estoque: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const resetForm = () => {
    setName('');
    setQuantity('');
    setUnit('');
    setCategory('');
    setDescription('');
    setIsSubmitting(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !quantity) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome e quantidade são obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'inventoryItems'), {
        userId: user.uid,
        name,
        quantity: parseFloat(quantity),
        unit,
        category,
        description,
        createdAt: new Date(),
      });

      toast({
        title: "Sucesso!",
        description: "Item adicionado ao estoque.",
      });
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao adicionar item: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível adicionar o item.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteAlert(true);
  }

  const handleDeleteItem = async (itemId: string | null) => {
    if (!itemId) return;

    try {
        await deleteDoc(doc(firestore, 'inventoryItems', itemId));
        toast({
            title: "Item excluído",
            description: "O item foi removido do seu estoque.",
        });
    } catch (error) {
        console.error("Erro ao excluir o item: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível remover o item.",
        });
    } finally {
        setItemToDelete(null);
        setShowDeleteAlert(false);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Controle de Estoque</h1>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if(!open) resetForm();
            setIsSheetOpen(open);
        }}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Adicionar Item
            </Button>
          </SheetTrigger>
          <SheetContent>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Adicionar Novo Item ao Estoque</SheetTitle>
                <SheetDescription>
                  Preencha as informações do item que deseja adicionar.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6 flex-1">
                  <div>
                    <Label htmlFor="name">Nome do Item</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Semente de Soja" required />
                  </div>
                   <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Sementes, Fertilizantes" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ex: 500" required />
                    </div>
                     <div>
                      <Label htmlFor="unit">Unidade</Label>
                      <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Ex: Sacas, Litros" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes sobre o item" />
                  </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Salvar Item'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
         <div className="text-center py-10">
            <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando seu estoque...</p>
         </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-10">
            <CardHeader>
                <CardTitle>Seu estoque está vazio</CardTitle>
                <CardDescription>Comece adicionando seu primeiro item para gerenciá-lo aqui.</CardDescription>
            </CardHeader>
             <CardContent>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2"/>
                    Adicionar Primeiro Item
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>{item.category || 'Sem categoria'}</CardDescription>
                </div>
                <Package className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                 <div>
                    <p className="text-3xl font-bold">{item.quantity}</p>
                    <p className="text-sm text-muted-foreground">{item.unit || 'Unidades'}</p>
                 </div>
                 {item.description && <p className="text-sm text-muted-foreground pt-2 border-t mt-2">{item.description}</p>}
              </CardContent>
              <CardFooter className="flex justify-end">
                 <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(item.id)}>
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">Excluir</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o item do seu estoque.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteItem(itemToDelete)} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
