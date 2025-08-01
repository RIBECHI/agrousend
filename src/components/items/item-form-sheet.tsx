
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, where, doc, updateDoc, getDocs, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
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
  partCode?: string;
  partType?: string;
  appliesToMachineId?: string;
  appliesToMachineName?: string;
}

const categories = ['Sementes', 'Fertilizantes', 'Defensivos', 'Combustível', 'Peças', 'Adjuvantes', 'Outros'];
const units = ['Litros (L)', 'Quilogramas (kg)', 'Sacos (sc)', 'Unidades (un)', 'Caixas (cx)'];

interface ItemFormSheetProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingItem?: Item | null;
    onItemSaved?: (itemId: string) => void;
}

export function ItemFormSheet({ isOpen, onOpenChange, editingItem, onItemSaved }: ItemFormSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [machines, setMachines] = useState<Machine[]>([]);
  
  const isEditing = !!editingItem;
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [partCode, setPartCode] = useState('');
  const [partType, setPartType] = useState('');
  const [appliesToMachineId, setAppliesToMachineId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen, editingItem, resetForm]);


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
    let savedItemId = '';

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
            savedItemId = editingItem.id;
            toast({ title: "Sucesso!", description: "Item atualizado com sucesso." });
        } else {
            itemData.currentStock = 0; // Initial stock
            itemData.createdAt = serverTimestamp();
            const newDocRef = await addDoc(collection(firestore, 'items'), itemData);
            savedItemId = newDocRef.id;
            toast({ title: "Sucesso!", description: "Item cadastrado com sucesso." });
        }
      
      resetForm();
      onOpenChange(false);
      if(onItemSaved) {
        onItemSaved(savedItemId);
      }

    } catch (error) {
      console.error("Erro ao salvar item: ", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar o item." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
  )
}
