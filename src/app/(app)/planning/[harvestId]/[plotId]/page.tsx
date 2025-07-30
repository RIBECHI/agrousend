
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, PlusCircle, Calendar as CalendarIcon, Wheat, Map, Settings, Trash2, Tractor, Wind, Sprout } from 'lucide-react';
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

interface Operation {
    id: string;
    type: 'Plantio' | 'Pulverização' | 'Adubação' | 'Colheita' | 'Outra';
    date: Timestamp;
    description: string;
    status: 'Planejada' | 'Concluída';
    userId: string;
}

const operationTypes = ['Plantio', 'Pulverização', 'Adubação', 'Colheita', 'Outra'];

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
  const params = useParams();
  const { toast } = useToast();
  const { harvestId, plotId } = params as { harvestId: string, plotId: string };

  const [plot, setPlot] = useState<FarmPlot | null>(null);
  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [opType, setOpType] = useState<string>('');
  const [opDate, setOpDate] = useState<Date | undefined>();
  const [opDescription, setOpDescription] = useState('');
  const [opStatus, setOpStatus] = useState<'Planejada' | 'Concluída'>('Planejada');

  // Dialog state
  const [opToDelete, setOpToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (!user || !harvestId || !plotId) return;

    let unsubscribeOps: () => void = () => {};

    const fetchInitialDataAndSubscribe = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Harvest data first
            const harvestDocRef = doc(firestore, 'harvests', harvestId);
            const harvestDoc = await getDoc(harvestDocRef);

            if (!harvestDoc.exists() || harvestDoc.data().userId !== user.uid) {
                throw new Error("Safra não encontrada ou acesso negado.");
            }
            setHarvest({ id: harvestDoc.id, ...harvestDoc.data() } as Harvest);
            
            // 2. Fetch Plot data
            const plotDocRef = doc(firestore, 'farmPlots', plotId);
            const plotDoc = await getDoc(plotDocRef);

            if (!plotDoc.exists() || plotDoc.data().userId !== user.uid) {
                throw new Error("Talhão não encontrado ou acesso negado.");
            }
            setPlot({ id: plotDoc.id, ...plotDoc.data() } as FarmPlot);

            // 3. Listener for operations, only after we confirm access.
            const operationsCollectionPath = `harvests/${harvestId}/harvestPlots/${plotId}/operations`;
            const operationsCollection = collection(firestore, operationsCollectionPath);
            // CORREÇÃO: Removido orderBy para evitar erro de índice. A ordenação será feita no cliente.
            const q = query(operationsCollection, where('userId', '==', user.uid));

            unsubscribeOps = onSnapshot(q, (snapshot) => {
                let fetchedOps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Operation));
                // CORREÇÃO: Ordenando no lado do cliente.
                fetchedOps.sort((a, b) => b.date.toMillis() - a.date.toMillis());
                setOperations(fetchedOps);
            }, (error) => {
                console.error("Erro ao buscar operações: ", error);
                toast({ variant: 'destructive', title: 'Erro ao carregar operações.'});
            });

        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: err.message });
            router.push('/planning');
        } finally {
            setIsLoading(false);
        }
    };

    fetchInitialDataAndSubscribe();
    
    return () => unsubscribeOps();
  }, [user, harvestId, plotId, router, toast]);
  
  const resetForm = useCallback(() => {
    setOpType('');
    setOpDate(undefined);
    setOpDescription('');
    setOpStatus('Planejada');
    setIsSubmitting(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !opType || !opDate || !opDescription) {
        toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Tipo, data e descrição são obrigatórios.'});
        return;
    }

    setIsSubmitting(true);
    try {
        const opData = {
            userId: user.uid,
            type: opType,
            date: Timestamp.fromDate(opDate),
            description: opDescription,
            status: opStatus,
            createdAt: serverTimestamp(),
        };

        const operationsCollection = collection(firestore, `harvests/${harvestId}/harvestPlots/${plotId}/operations`);
        await addDoc(operationsCollection, opData);

        toast({ title: 'Sucesso!', description: 'Operação registrada.'});
        resetForm();
        setIsSheetOpen(false);
    } catch (error) {
        console.error("Erro ao salvar operação: ", error);
        toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível registrar a operação.'});
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
            <Button>
              <PlusCircle className="mr-2" />
              Adicionar Operação
            </Button>
          </SheetTrigger>
          <SheetContent>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Nova Operação</SheetTitle>
                    <SheetDescription>Registre uma atividade planejada ou realizada neste talhão.</SheetDescription>
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
                      <div>
                        <Label htmlFor="description">Descrição / Detalhes</Label>
                        <Textarea id="description" value={opDescription} onChange={(e) => setOpDescription(e.target.value)} rows={4} required placeholder="Ex: Aplicação de fungicida X, dose Y..."/>
                      </div>
                </div>
                 <SheetFooter className="pt-4 mt-auto">
                    <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Salvar Operação'}
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
                        <li key={op.id} className="p-4 flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-muted rounded-full">
                                    <OperationIcon type={op.type} />
                                </div>
                                <div>
                                    <p className="font-semibold">{op.type} <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${op.status === 'Concluída' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{op.status}</span></p>
                                    <p className="text-sm text-muted-foreground">{op.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {format(op.date.toDate(), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(op.id)}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
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
