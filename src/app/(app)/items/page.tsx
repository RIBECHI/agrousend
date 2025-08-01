
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, where, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, Pencil, Box } from 'lucide-react';
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
import { ItemFormSheet } from '@/components/items/item-form-sheet';

interface Item {
  id: string;
  name: string;
  category: string;
  unit: string;
  userId: string;
  partCode?: string;
  partType?: string;
  appliesToMachineId?: string;
  appliesToMachineName?: string;
}

export default function ItemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  // Dialog state
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Fetch items
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const itemsCollection = collection(firestore, 'items');
    const q = query(itemsCollection, where('userId', '==', user.uid));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      fetchedItems.sort((a, b) => a.name.localeCompare(b.name));
      setItems(fetchedItems);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar itens: ", error);
      toast({ variant: "destructive", title: "Erro ao carregar itens." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleOpenSheet = (item: Item | null) => {
    setEditingItem(item);
    setIsSheetOpen(true);
  }
  
  const openDeleteDialog = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteAlert(true);
  }

  const handleDeleteItem = async (itemId: string | null) => {
    if (!itemId) return;

    try {
        await deleteDoc(doc(firestore, 'items', itemId));
        toast({ title: "Item excluído", description: "O item foi removido com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir item: ", error);
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível remover o item." });
    } finally {
        setItemToDelete(null);
        setShowDeleteAlert(false);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">Cadastro de Insumos</h1>
        <Button onClick={() => handleOpenSheet(null)}>
            <PlusCircle className="mr-2" />
            Cadastrar Item
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Meus Itens</CardTitle>
            <CardDescription>Lista de todos os insumos e itens cadastrados.</CardDescription>
        </CardHeader>
        <CardContent>
             {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                    <Loader className="mx-auto h-8 w-8 animate-spin" />
                    <p>Carregando itens...</p>
                </div>
            ) : items.length === 0 ? (
                 <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Box className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Nenhum item cadastrado</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Comece cadastrando um novo insumo.</p>
                    <div className="mt-6">
                        <Button onClick={() => handleOpenSheet(null)}>
                            <PlusCircle className="mr-2" />
                            Cadastrar Item
                        </Button>
                    </div>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => (
                        <li key={item.id} className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 text-primary p-3 rounded-full">
                                    <Box />
                                </div>
                                <div>
                                    <p className="font-semibold">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{item.category} - Unidade: {item.unit}</p>
                                    {item.category === 'Peças' && item.appliesToMachineName && (
                                        <p className="text-xs text-muted-foreground">
                                            Aplicação: {item.appliesToMachineName}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className='flex gap-2'>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenSheet(item)}>
                                    <Pencil className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(item.id)}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </CardContent>
      </Card>
      
      <ItemFormSheet 
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        editingItem={editingItem}
        onItemSaved={() => setEditingItem(null)}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o item. Os registros de estoque associados não serão removidos, mas podem se tornar órfãos.
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
