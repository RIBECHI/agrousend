
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Machine {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  category: string;
  unit: string;
  userId: string;
  // Campos específicos para peças
  partCode?: string;
  partType?: string;
  appliesToMachineId?: string;
  appliesToMachineName?: string;
}

const categories = ['Sementes', 'Fertilizantes', 'Defensivos', 'Combustível', 'Peças', 'Adjuvantes', 'Outros'];
const units = ['Litros (L)', 'Quilogramas (kg)', 'Sacos (sc)', 'Unidades (un)', 'Caixas (cx)'];

export default function ItemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const isEditing = !!editingItem;
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [partCode, setPartCode] = useState('');
  const [partType, setPartType] = useState('');
  const [appliesToMachineId, setAppliesToMachineId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  // Fetch machinery for the selector
  useEffect(() => {
    if (!user) return;
    const machineryCollection = collection(firestore, 'machinery');
    const q = query(machineryCollection, where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMachines = snapshot.docs.map(doc => ({id: doc.id, name: doc.data().name} as Machine));
        setMachines(fetchedMachines);
    });
    return () => unsubscribe();
  }, [user]);

  const resetForm = useCallback(() => {
    setName('');
    setCategory('');
    setUnit('');
    setPartCode('');
    setPartType('');
    setAppliesToMachineId('');
    setEditingItem(null);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (isSheetOpen) {
        if(editingItem) {
            setName(editingItem.name);
            setCategory(editingItem.category);
            setUnit(editingItem.unit);
            setPartCode(editingItem.partCode || '');
            setPartType(editingItem.partType || '');
            setAppliesToMachineId(editingItem.appliesToMachineId || '');
        } else {
            resetForm();
        }
    }
  }, [isSheetOpen, editingItem, resetForm]);

  const handleOpenSheet = (item: Item | null) => {
    setEditingItem(item);
    setIsSheetOpen(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !category || !unit) {
      toast({ variant: "destructive", title: "Todos os campos básicos são obrigatórios." });
      return;
    }
     if (category === 'Peças' && (!partCode || !partType || !appliesToMachineId)) {
      toast({ variant: "destructive", title: "Campos de Peça obrigatórios.", description: "Código, tipo e máquina de aplicação são necessários." });
      return;
    }

    setIsSubmitting(true);
    try {
        const itemData: Omit<Item, 'id' | 'userId'> & { userId: string, createdAt?: any, currentStock?: number } = {
            name,
            category,
            unit,
            userId: user.uid,
        };

        if(category === 'Peças') {
            const machine = machines.find(m => m.id === appliesToMachineId);
            itemData.partCode = partCode;
            itemData.partType = partType;
            itemData.appliesToMachineId = appliesToMachineId;
            itemData.appliesToMachineName = machine?.name || 'Desconhecida';
        } else {
            itemData.partCode = undefined;
            itemData.partType = undefined;
            itemData.appliesToMachineId = undefined;
            itemData.appliesToMachineName = undefined;
        }


        if(isEditing && editingItem) {
            const docRef = doc(firestore, 'items', editingItem.id);
            await updateDoc(docRef, itemData);
            toast({ title: "Sucesso!", description: "Item atualizado com sucesso." });
        } else {
            itemData.currentStock = 0; // Initial stock
            itemData.createdAt = serverTimestamp();
            await addDoc(collection(firestore, 'items'), itemData);
            toast({ title: "Sucesso!", description: "Item cadastrado com sucesso." });
        }
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao salvar item: ", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar o item." });
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
        <h1 className="text-2xl font-bold">Cadastro de Insumos</h1>
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
      
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if(!open) resetForm();
            setIsSheetOpen(open);
        }}>
          <SheetContent className="w-full sm:max-w-lg">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>{isEditing ? 'Editar Item' : 'Cadastrar Novo Item'}</SheetTitle>
                <SheetDescription>
                  Preencha as informações do insumo para controle de estoque.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                  <div>
                    <Label htmlFor="name">Nome do Item</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Semente de Milho XPTO" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Categoria</Label>
                        <Select value={category} onValueChange={setCategory} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Unidade de Medida</Label>
                        <Select value={unit} onValueChange={setUnit} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>

                  {category === 'Peças' && (
                    <div className="space-y-4 pt-4 border-t">
                        <p className="text-sm font-medium text-foreground">Detalhes da Peça</p>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="partCode">Código da Peça</Label>
                                <Input id="partCode" value={partCode} onChange={(e) => setPartCode(e.target.value)} required placeholder="Ex: AH202-B" />
                            </div>
                             <div>
                                <Label htmlFor="partType">Tipo de Peça</Label>
                                <Input id="partType" value={partType} onChange={(e) => setPartType(e.target.value)} required placeholder="Ex: Filtro de ar" />
                            </div>
                        </div>
                        <div>
                            <Label>Aplica-se à Máquina</Label>
                            <Select value={appliesToMachineId} onValueChange={setAppliesToMachineId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a máquina" />
                                </SelectTrigger>
                                <SelectContent>
                                    {machines.length === 0 && <p className="p-2 text-xs text-muted-foreground">Nenhuma máquina cadastrada.</p>}
                                    {machines.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                  )}

              </div>
              <SheetFooter className="pt-4 mt-auto">
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

    