
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
import { Loader, PlusCircle, Trash2, Tag } from 'lucide-react';
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

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  userId: string;
}

export default function ItemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // State for the form
  const [name, setName] = useState('');
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

    const itemsCollection = collection(firestore, 'items');
    const q = query(itemsCollection, where('userId', '==', user.uid));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CatalogItem));
      setItems(fetchedItems);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar itens: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const resetForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setIsSubmitting(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "O nome do item é obrigatório.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'items'), {
        userId: user.uid,
        name,
        category,
        description,
        createdAt: new Date(),
      });

      toast({
        title: "Sucesso!",
        description: "Item cadastrado com sucesso.",
      });
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao cadastrar item: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível cadastrar o item.",
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
        await deleteDoc(doc(firestore, 'items', itemId));
        toast({
            title: "Item excluído",
            description: "O item foi removido do seu cadastro.",
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
        <h1 className="text-2xl font-bold">Cadastro de Itens</h1>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if(!open) resetForm();
            setIsSheetOpen(open);
        }}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Cadastrar Novo Item
            </Button>
          </SheetTrigger>
          <SheetContent>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Cadastrar Novo Item</SheetTitle>
                <SheetDescription>
                  Crie um novo item para seu catálogo. Ele poderá ser usado no controle de estoque.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6 flex-1">
                  <div>
                    <Label htmlFor="name">Nome do Item</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Semente de Soja TMG 7063" required />
                  </div>
                   <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Sementes, Fertilizantes, Defensivos" />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes sobre o item, fornecedor, etc." />
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
            <p className="mt-4 text-muted-foreground">Carregando seus itens...</p>
         </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-10">
            <CardHeader>
                <CardTitle>Nenhum item cadastrado</CardTitle>
                <CardDescription>Comece cadastrando seu primeiro item para poder gerenciá-lo aqui.</CardDescription>
            </CardHeader>
             <CardContent>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2"/>
                    Cadastrar Primeiro Item
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>{item.category || 'Sem categoria'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
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
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o item do seu cadastro.
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
