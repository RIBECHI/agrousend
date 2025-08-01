
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, PlusCircle, Calendar as CalendarIcon, Wheat, Map, Settings, Trash2, Tractor, Wind, Sprout, MinusCircle, Pencil, Calculator, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface FarmPlot {
  id: string;
  name: string;
  area: number;
  culture: string;
}

interface Harvest {
  id: string;
  name: string;
}

interface AppliedInput {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
}

interface Operation {
    id: string;
    type: 'Plantio' | 'Pulverização' | 'Adubação' | 'Colheita' | 'Outra';
    date: Timestamp;
    description: string;
    inputs: AppliedInput[];
    status: 'Planejada' | 'Concluída';
    userId: string;
}

interface Item {
  id: string;
  name: string;
  unit: string;
  category: string;
}

// State for the form inputs, including the dose per hectare
interface OperationInputFormState {
    category: string;
    itemId: string;
    dosePerHectare: number | '';
}

const operationTypes = ['Plantio', 'Pulverização', 'Adubação', 'Colheita', 'Outra'];
const itemCategories = ['Sementes', 'Fertilizantes', 'Defensivos', 'Combustível', 'Peças', 'Adjuvantes', 'Outros'];


const OperationIcon = ({ type }: { type: Operation['type']}) => {
    switch(type) {
        case 'Plantio': return <Sprout className="h-5 w-5 text-green-500"/>
        case 'Pulverização': return <Wind className="h-5 w-5 text-blue-500"/>
        case 'Adubação': return <Tractor className="h-5 w-5 text-yellow-600"/>
        case 'Colheita': return <Wheat className="h-5 w-5 text-amber-500"/>
        default: return <Settings className="h-5 w-5 text-gray-500"/>
    }
}

export default function PlotOperationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { harvestId, plotId } = useParams<{ harvestId: string; plotId: string; }>();

  const [plot, setPlot] = useState<FarmPlot | null>(null);
  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const isEditing = !!editingOperation;

  // Form state
  const [opType, setOpType] = useState<string>('');
  const [opDate, setOpDate] = useState<Date | undefined>();
  const [opDescription, setOpDescription] = useState('');
  const [opStatus, setOpStatus] = useState<'Planejada' | 'Concluída'>('Planejada');
  const [opInputs, setOpInputs] = useState<OperationInputFormState[]>([]);


  // Dialog state
  const [opToDelete, setOpToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (!user || !harvestId || !plotId) return;

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const harvestDocRef = doc(firestore, 'harvests', harvestId);
            const harvestDoc = await getDoc(harvestDocRef);

            if (!harvestDoc.exists() || harvestDoc.data().userId !== user.uid) {
                throw new Error("Safra não encontrada ou acesso negado.");
            }
            setHarvest({ id: harvestDoc.id, ...harvestDoc.data() as Omit<Harvest, 'id'> });
            
            const plotDocRef = doc(firestore, 'farmPlots', plotId);
            const plotDoc = await getDoc(plotDocRef);

            if (!plotDoc.exists() || plotDoc.data().userId !== user.uid) {
                throw new Error("Talhão não encontrado ou acesso negado.");
            }
            setPlot({ id: plotDoc.id, ...plotDoc.data() as Omit<FarmPlot, 'id'> });
            
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: err.message });
            router.push('/planning');
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchInitialData();
    
    const opsQuery = query(collection(firestore, `harvests/${harvestId}/harvestPlots/${plotId}/operations`));
    const opsUnsubscribe = onSnapshot(opsQuery, (snapshot) => {
        let fetchedOps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Operation));
        fetchedOps.sort((a, b) => b.date.toMillis() - a.date.toMillis());
        setOperations(fetchedOps);
    }, (error) => {
        console.error("Error fetching operations: ", error);
        toast({ variant: 'destructive', title: 'Erro ao carregar operações', description: 'Verifique as permissões do Firestore.' });
    });

    const itemsQuery = query(collection(firestore, 'items'), where('userId', '==', user.uid));
    const itemsUnsubscribe = onSnapshot(itemsQuery, (snapshot) => {
        let fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Item));
        fetchedItems.sort((a, b) => a.name.localeCompare(b.name));
        setItems(fetchedItems);
    });

    return () => {
        opsUnsubscribe();
        itemsUnsubscribe();
    }
  }, [user, harvestId, plotId, router, toast]);
  
  const resetForm = useCallback(() => {
    setOpType('');
    setOpDate(undefined);
    setOpDescription('');
    setOpStatus('Planejada');
    setOpInputs([]);
    setIsSubmitting(false);
    setEditingOperation(null);
  }, []);

  const handleOpenSheet = (operation: Operation | null) => {
    if (operation && plot) {
        setEditingOperation(operation);
        setOpType(operation.type);
        setOpDate(operation.date.toDate());
        setOpDescription(operation.description);
        setOpStatus(operation.status);
        const plotArea = plot.area || 1; // Avoid division by zero
        setOpInputs(operation.inputs.map(i => {
            const itemDetail = items.find(item => item.id === i.itemId);
            return {
                category: itemDetail?.category || '',
                itemId: i.itemId, 
                dosePerHectare: plotArea > 0 ? (i.quantity / plotArea) : i.quantity
            }
        }));
    } else {
        resetForm();
    }
    setIsSheetOpen(true);
  }

  const handleAddInput = () => {
    setOpInputs(prev => [...prev, { category: '', itemId: '', dosePerHectare: '' }]);
  }
  
  const handleRemoveInput = (index: number) => {
    setOpInputs(prev => prev.filter((_, i) => i !== index));
  }

  const handleInputChange = (index: number, field: keyof OperationInputFormState, value: string | number) => {
    setOpInputs(prev => {
        const newInputs = [...prev];
        const currentInput = { ...newInputs[index] };
        
        if (field === 'category') {
            currentInput.category = value as string;
            // Reset item when category changes
            currentInput.itemId = ''; 
        } else if (field === 'itemId') {
            currentInput.itemId = value as string;
        } else {
            currentInput.dosePerHectare = value === '' ? '' : Number(value);
        }
        
        newInputs[index] = currentInput;
        return newInputs;
    });
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !plot || !opType || !opDate || (opDescription.trim() === '' && opInputs.length === 0)) {
        toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Tipo, data e pelo menos uma descrição ou insumo são obrigatórios.'});
        return;
    }

    const validInputs = opInputs
        .filter(input => input.itemId && (input.dosePerHectare || 0) > 0)
        .map(input => {
            const itemDetails = items.find(i => i.id === input.itemId);
            const totalQuantity = (input.dosePerHectare || 0) * (plot.area || 0);
            return {
                itemId: input.itemId,
                quantity: totalQuantity,
                itemName: itemDetails?.name || 'Desconhecido',
                unit: itemDetails?.unit || 'un'
            }
        });

    if (opInputs.length > 0 && validInputs.length !== opInputs.length) {
        toast({ variant: 'destructive', title: 'Insumos inválidos', description: 'Preencha todos os campos dos insumos adicionados (Categoria, Item e Dose).'});
        return;
    }

    setIsSubmitting(true);
    try {
        const opData: any = {
            type: opType,
            date: Timestamp.fromDate(opDate),
            description: opDescription,
            inputs: validInputs,
            status: opStatus,
        };

        if (isEditing && editingOperation) {
            const opDocRef = doc(firestore, `harvests/${harvestId}/harvestPlots/${plotId}/operations`, editingOperation.id);
            opData.userId = editingOperation.userId; 
            await updateDoc(opDocRef, opData);
            toast({ title: 'Sucesso!', description: 'Operação atualizada.'});
        } else {
            opData.userId = user.uid;
            opData.createdAt = serverTimestamp();
            const operationsCollection = collection(firestore, `harvests/${harvestId}/harvestPlots/${plotId}/operations`);
            await addDoc(operationsCollection, opData);
            toast({ title: 'Sucesso!', description: 'Operação registrada.'});
        }
        
        resetForm();
        setIsSheetOpen(false);
    } catch (error) {
        console.error("Erro ao salvar operação: ", error);
        toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível salvar a operação.'});
    } finally {
        setIsSubmitting(false);
    }
  }

  const openDeleteDialog = (opId: string) => {
    setOpToDelete(opId);
    setShowDeleteAlert(true);
  }

  const handleDeleteOperation = async (opId: string | null) => {
    if (!opId || !harvestId || !plotId) return;

    try {
        const opDocRef = doc(firestore, `harvests/${harvestId}/harvestPlots/${plotId}/operations`, opId);
        await deleteDoc(opDocRef);
        toast({ title: "Operação excluída", description: "O registro da operação foi removido."});
    } catch (error) {
        console.error("Erro ao excluir operação: ", error);
        toast({ variant: 'destructive', title: 'Erro ao excluir.'});
    } finally {
        setOpToDelete(null);
        setShowDeleteAlert(false);
    }
  }

  if (isLoading || !plot || !harvest) {
    return (
      <div className="text-center py-10">
        <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando dados do talhão...</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/planning')}>
        <ArrowLeft className="mr-2" />
        Voltar para o planejamento
      </Button>

      <Card>
        <CardHeader>
            <CardTitle className="text-2xl">{plot.name}</CardTitle>
            <CardDescription>
                <span className="font-semibold text-primary">{harvest.name}</span> • {plot.culture} • {plot.area.toFixed(2)} ha
            </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Operações do Talhão</h2>
         <Sheet open={isSheetOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsSheetOpen(open); }}>
          <SheetTrigger asChild>
            <Button onClick={() => handleOpenSheet(null)}>
              <PlusCircle className="mr-2" />
              Adicionar Operação
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>{isEditing ? 'Editar Operação' : 'Nova Operação'}</SheetTitle>
                    <SheetDescription>
                        {isEditing ? 'Altere os detalhes da atividade.' : 'Registre uma atividade planejada ou realizada neste talhão.'}
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                     <div>
                        <Label>Tipo de Operação</Label>
                        <Select value={opType} onValueChange={setOpType} required>
                            <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                            <SelectContent>
                                {operationTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                      <div>
                        <Label>Data da Operação</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !opDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {opDate ? format(opDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={opDate} onSelect={setOpDate} initialFocus /></PopoverContent>
                        </Popover>
                      </div>
                       <div>
                        <Label>Status</Label>
                        <Select value={opStatus} onValueChange={(v) => setOpStatus(v as any)} required>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Planejada">Planejada</SelectItem>
                                <SelectItem value="Concluída">Concluída</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                      
                      <Separator />

                      <div>
                          <Label>Insumos Utilizados</Label>
                          <div className="space-y-3 mt-2">
                              {opInputs.map((input, index) => {
                                  const selectedItem = items.find(i => i.id === input.itemId);
                                  const totalCalculated = (input.dosePerHectare || 0) * (plot?.area || 0);
                                  const filteredItems = input.category ? items.filter(i => i.category === input.category) : [];

                                  return (
                                    <div key={index} className="flex flex-col gap-2 p-3 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <p className='font-medium text-sm'>Insumo {index + 1}</p>
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive h-6 w-6" onClick={() => handleRemoveInput(index)}>
                                                <MinusCircle className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                        <div className='space-y-2'>
                                            <Label className="text-xs">Categoria</Label>
                                            <Select value={input.category} onValueChange={(value) => handleInputChange(index, 'category', value)}>
                                                <SelectTrigger><SelectValue placeholder="Selecione a Categoria..." /></SelectTrigger>
                                                <SelectContent>
                                                    {itemCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className='space-y-2'>
                                            <Label className="text-xs">Item</Label>
                                            <Select value={input.itemId} onValueChange={(value) => handleInputChange(index, 'itemId', value)} disabled={!input.category}>
                                                <SelectTrigger><SelectValue placeholder="Selecione o Item..." /></SelectTrigger>
                                                <SelectContent>
                                                    {filteredItems.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-2">
                                                <Label htmlFor={`dose-${index}`} className="text-xs">Dose / ha ({selectedItem?.unit || 'un'})</Label>
                                                <Input 
                                                    id={`dose-${index}`} 
                                                    type="number"
                                                    value={input.dosePerHectare}
                                                    onChange={(e) => handleInputChange(index, 'dosePerHectare', e.target.value)}
                                                    placeholder="0.00"
                                                    min="0"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`total-${index}`} className="text-xs">Total Calculado</Label>
                                                <Input 
                                                    id={`total-${index}`}
                                                    value={totalCalculated > 0 ? totalCalculated.toFixed(2) : ''}
                                                    readOnly
                                                    disabled
                                                    className="bg-muted"
                                                />
                                            </div>
                                         </div>
                                    </div>
                                  )
                              })}
                          </div>
                          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleAddInput}>
                              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Insumo
                          </Button>
                      </div>

                      <Separator />

                      <div>
                        <Label htmlFor="description">Observações</Label>
                        <Textarea id="description" value={opDescription} onChange={(e) => setOpDescription(e.target.value)} rows={3} placeholder="Detalhes adicionais, condições climáticas, etc."/>
                      </div>
                </div>
                 <SheetFooter className="pt-4 mt-auto">
                    <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : isEditing ? 'Salvar Alterações' : 'Salvar Operação'}
                    </Button>
                </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

       <Card>
        <CardContent className="p-0">
             {operations.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Nenhuma operação registrada para este talhão na safra.</p>
                </div>
             ) : (
                <ul className="divide-y">
                    {operations.map(op => (
                        <li key={op.id} className="p-4 flex items-start justify-between hover:bg-muted/50">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="p-2 bg-muted rounded-full mt-1">
                                    <OperationIcon type={op.type} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <p className="font-semibold">{op.type} <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${op.status === 'Concluída' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{op.status}</span></p>
                                        <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                                            {format(op.date.toDate(), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                        </p>
                                    </div>

                                    {op.inputs && op.inputs.length > 0 && (
                                        <div className="mt-2 text-sm">
                                            <p className="font-medium text-foreground">Insumos:</p>
                                            <ul className="list-disc list-inside text-muted-foreground">
                                                {op.inputs.map((input, index) => (
                                                    <li key={index}>{input.itemName}: {input.quantity.toFixed(2)} {input.unit}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {op.description && (
                                        <div className="mt-2 text-sm">
                                             <p className="font-medium text-foreground">Observações:</p>
                                             <p className="text-muted-foreground whitespace-pre-wrap">{op.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="ml-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenSheet(op)}>
                                            <Pencil className="mr-2 h-4 w-4"/>
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openDeleteDialog(op.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4"/>
                                            Excluir
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </li>
                    ))}
                </ul>
             )}
        </CardContent>
      </Card>
    </div>

     <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro desta operação.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteOperation(opToDelete)} className="bg-destructive hover:bg-destructive/90">
                Excluir
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
