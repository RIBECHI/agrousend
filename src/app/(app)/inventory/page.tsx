
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, where, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, ArrowUpCircle, ArrowDownCircle, History, Warehouse } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Item {
  id: string;
  name: string;
  unit: string;
  userId: string;
  currentStock?: number;
}

interface InventoryLog {
    id: string;
    itemId: string;
    itemName: string;
    type: 'in' | 'out';
    quantity: number;
    createdAt: Timestamp;
    userId: string;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'in' | 'out'>('in');
  
  // Form state
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  

  // Fetch Items for select
  useEffect(() => {
    if (!user) {
      setIsLoadingItems(false);
      return;
    }
    const itemsCollection = collection(firestore, 'items');
    const q = query(itemsCollection, where('userId', '==', user.uid), orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
      setItems(fetchedItems);
      setIsLoadingItems(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch Inventory Logs
   useEffect(() => {
    if (!user) {
      setIsLoadingLogs(false);
      return;
    }
    const logsCollection = collection(firestore, 'inventoryLogs');
    const q = query(logsCollection, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryLog));
      setLogs(fetchedLogs);
      setIsLoadingLogs(false);
    });

    return () => unsubscribe();
  }, [user]);

  const resetForm = useCallback(() => {
    setSelectedItemId('');
    setQuantity('');
    setIsSubmitting(false);
  }, []);

  const handleOpenSheet = (type: 'in' | 'out') => {
    setTransactionType(type);
    setIsSheetOpen(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedItemId || !quantity || quantity <= 0) {
      toast({ variant: "destructive", title: "Campos inválidos", description: "Selecione um item e insira uma quantidade válida." });
      return;
    }

    setIsSubmitting(true);
    const itemRef = doc(firestore, 'items', selectedItemId);
    const logsCollection = collection(firestore, 'inventoryLogs');

    try {
        await runTransaction(firestore, async (transaction) => {
            const itemDoc = await transaction.get(itemRef);
            if (!itemDoc.exists()) {
                throw new Error("Item não encontrado!");
            }
            const currentStock = itemDoc.data().currentStock || 0;
            const numericQuantity = Number(quantity);

            let newStock = currentStock;
            if(transactionType === 'in') {
                newStock += numericQuantity;
            } else {
                if(currentStock < numericQuantity) {
                    throw new Error("Estoque insuficiente para esta saída.");
                }
                newStock -= numericQuantity;
            }
            
            transaction.update(itemRef, { currentStock: newStock });
            
            const selectedItem = items.find(i => i.id === selectedItemId);
            transaction.set(doc(logsCollection), {
                userId: user.uid,
                itemId: selectedItemId,
                itemName: selectedItem?.name || 'Item Desconhecido',
                type: transactionType,
                quantity: numericQuantity,
                createdAt: serverTimestamp()
            });
        });
        
        toast({ title: "Sucesso!", description: "Movimentação de estoque registrada." });
        resetForm();
        setIsSheetOpen(false);

    } catch (error: any) {
      console.error("Erro na transação de estoque: ", error);
      toast({ variant: "destructive", title: "Erro na operação", description: error.message || "Não foi possível registrar a movimentação." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedItemForForm = items.find(i => i.id === selectedItemId);
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Controle de Estoque</h1>
         <div className="flex gap-2">
             <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleOpenSheet('out')}>
                <ArrowDownCircle className="mr-2" />
                Registrar Saída
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleOpenSheet('in')}>
                <ArrowUpCircle className="mr-2" />
                Registrar Entrada
            </Button>
         </div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Situação do Estoque</CardTitle>
                        <CardDescription>Quantidades atuais de cada item.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingItems ? (
                             <p className="text-muted-foreground">Carregando...</p>
                        ) : items.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                <p>Nenhum item cadastrado.</p>
                                <p className="text-sm">Vá para a página de <a href="/items" className="underline text-primary">Insumos</a> para começar.</p>
                             </div>
                        ) : (
                            <ul className="space-y-3">
                                {items.map(item => (
                                    <li key={item.id} className="flex justify-between items-center">
                                        <span>{item.name}</span>
                                        <span className="font-bold">{item.currentStock || 0} <span className="text-xs text-muted-foreground">{item.unit}</span></span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Histórico de Movimentações</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {isLoadingLogs ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Loader className="mx-auto h-8 w-8 animate-spin" />
                                <p>Carregando histórico...</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold">Nenhuma movimentação</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Nenhuma entrada ou saída foi registrada ainda.</p>
                            </div>
                        ) : (
                            <div className="relative max-h-[600px] overflow-y-auto pr-2">
                               <div className="absolute left-4 h-full border-l-2 border-dashed border-gray-200 dark:border-gray-700"></div>
                                <ul className="space-y-6">
                                    {logs.map((log) => (
                                        <li key={log.id} className="relative pl-10">
                                             <div className={`absolute -left-2 top-1 h-4 w-4 rounded-full flex items-center justify-center`}>
                                                <div className={`h-4 w-4 rounded-full ${log.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                             </div>
                                             <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold">{log.itemName}</p>
                                                    <p className={`text-sm font-bold ${log.type === 'in' ? 'text-green-500' : 'text-red-500'}`}>
                                                        {log.type === 'in' ? 'Entrada de ' : 'Saída de '}{log.quantity}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                     {log.createdAt ? format(log.createdAt.toDate(), "dd/MM/yy 'às' HH:mm", { locale: ptBR }) : ''}
                                                </p>
                                             </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
       </div>

      
      <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if(!open) resetForm();
            setIsSheetOpen(open);
        }}>
          <SheetContent className="w-full sm:max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>
                    {transactionType === 'in' ? 'Registrar Entrada no Estoque' : 'Registrar Saída do Estoque'}
                </SheetTitle>
                <SheetDescription>
                  Selecione o item e a quantidade para a movimentação.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                  <div>
                    <Label>Item</Label>
                    <Select value={selectedItemId} onValueChange={setSelectedItemId} required>
                        <SelectTrigger disabled={isLoadingItems}>
                            <SelectValue placeholder={isLoadingItems ? "Carregando..." : "Selecione um item"} />
                        </SelectTrigger>
                        <SelectContent>
                            {items.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                   <div>
                    <Label htmlFor="quantity">Quantidade ({selectedItemForForm?.unit || 'unidade'})</Label>
                    <Input id="quantity" type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} required disabled={!selectedItemId}/>
                  </div>
              </div>
              <SheetFooter className="pt-4 mt-auto">
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Confirmar'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
    </>
  );
}

    