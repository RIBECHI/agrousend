
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, PlusCircle, Calendar as CalendarIcon, Wrench, Trash2, Pencil, MoreVertical } from 'lucide-react';
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
import Image from 'next/image';

interface Machine {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  imageUrl?: string;
}

interface Maintenance {
    id: string;
    type: 'Preventiva' | 'Corretiva' | 'Troca de Óleo' | 'Revisão' | 'Outra';
    date: Timestamp;
    description: string;
    cost: number;
    userId: string;
}

const maintenanceTypes = ['Preventiva', 'Corretiva', 'Troca de Óleo', 'Revisão', 'Outra'];

export default function MachineMaintenancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null);
  const isEditing = !!editingMaintenance;

  // Form state
  const [maintType, setMaintType] = useState<string>('');
  const [maintDate, setMaintDate] = useState<Date | undefined>();
  const [maintDescription, setMaintDescription] = useState('');
  const [maintCost, setMaintCost] = useState<number | ''>('');


  // Dialog state
  const [maintToDelete, setMaintToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    const machineId = params.machineId as string;
    if (!user || !machineId) return;

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const machineDocRef = doc(firestore, 'machinery', machineId);
            const machineDoc = await getDoc(machineDocRef);

            if (!machineDoc.exists() || machineDoc.data().userId !== user.uid) {
                throw new Error("Máquina não encontrada ou acesso negado.");
            }
            setMachine({ id: machineDoc.id, ...machineDoc.data() as Omit<Machine, 'id'> });
            
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: err.message });
            router.push('/machinery');
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchInitialData();
    
    const maintQuery = query(collection(firestore, `machinery/${machineId}/maintenances`), orderBy('date', 'desc'));
    const maintUnsubscribe = onSnapshot(maintQuery, (snapshot) => {
        let fetchedMaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Maintenance));
        setMaintenances(fetchedMaints);
    }, (error) => {
        console.error("Error fetching maintenances: ", error);
        toast({ variant: 'destructive', title: 'Erro ao carregar manutenções', description: 'Verifique as permissões do Firestore.' });
    });

    return () => {
        maintUnsubscribe();
    }
  }, [user, params, router, toast]);
  
  const resetForm = useCallback(() => {
    setMaintType('');
    setMaintDate(undefined);
    setMaintDescription('');
    setMaintCost('');
    setIsSubmitting(false);
    setEditingMaintenance(null);
  }, []);

  const handleOpenSheet = (maintenance: Maintenance | null) => {
    if (maintenance) {
        setEditingMaintenance(maintenance);
        setMaintType(maintenance.type);
        setMaintDate(maintenance.date.toDate());
        setMaintDescription(maintenance.description);
        setMaintCost(maintenance.cost);
    } else {
        resetForm();
    }
    setIsSheetOpen(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const machineId = params.machineId as string;
    if (!user || !maintType || !maintDate) {
        toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Tipo e data são obrigatórios.'});
        return;
    }

    setIsSubmitting(true);
    try {
        const maintData: any = {
            type: maintType,
            date: Timestamp.fromDate(maintDate),
            description: maintDescription,
            cost: Number(maintCost) || 0,
        };

        if (isEditing && editingMaintenance) {
            const maintDocRef = doc(firestore, `machinery/${machineId}/maintenances`, editingMaintenance.id);
            await updateDoc(maintDocRef, maintData);
            toast({ title: 'Sucesso!', description: 'Manutenção atualizada.'});
        } else {
            maintData.userId = user.uid;
            maintData.createdAt = serverTimestamp();
            const maintenancesCollection = collection(firestore, `machinery/${machineId}/maintenances`);
            await addDoc(maintenancesCollection, maintData);
            toast({ title: 'Sucesso!', description: 'Manutenção registrada.'});
        }
        
        resetForm();
        setIsSheetOpen(false);
    } catch (error) {
        console.error("Erro ao salvar manutenção: ", error);
        toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível salvar a manutenção.'});
    } finally {
        setIsSubmitting(false);
    }
  }

  const openDeleteDialog = (maintId: string) => {
    setMaintToDelete(maintId);
    setShowDeleteAlert(true);
  }

  const handleDeleteMaintenance = async (maintId: string | null) => {
    const machineId = params.machineId as string;
    if (!maintId || !machineId) return;

    try {
        const maintDocRef = doc(firestore, `machinery/${machineId}/maintenances`, maintId);
        await deleteDoc(maintDocRef);
        toast({ title: "Manutenção excluída", description: "O registro da manutenção foi removido."});
    } catch (error) {
        console.error("Erro ao excluir manutenção: ", error);
        toast({ variant: 'destructive', title: 'Erro ao excluir.'});
    } finally {
        setMaintToDelete(null);
        setShowDeleteAlert(false);
    }
  }

  if (isLoading || !machine) {
    return (
      <div className="text-center py-10">
        <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando dados da máquina...</p>
      </div>
    );
  }

  const totalCost = maintenances.reduce((acc, curr) => acc + (curr.cost || 0), 0);

  return (
    <>
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/machinery')}>
        <ArrowLeft className="mr-2" />
        Voltar para Maquinário
      </Button>

      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {machine.imageUrl && (
                <div className="relative w-full md:w-32 aspect-video md:aspect-square rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image src={machine.imageUrl} alt={machine.name} fill className="object-cover" />
                </div>
            )}
            <div>
                <CardTitle className="text-2xl">{machine.name}</CardTitle>
                <CardDescription>
                    {machine.brand} {machine.model} ({machine.year})
                </CardDescription>
                <CardDescription className="font-semibold mt-2">
                    Custo Total de Manutenções: {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </CardDescription>
            </div>
        </CardHeader>
      </Card>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Histórico de Manutenções</h2>
         <Sheet open={isSheetOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsSheetOpen(open); }}>
          <SheetTrigger asChild>
            <Button onClick={() => handleOpenSheet(null)}>
              <PlusCircle className="mr-2" />
              Adicionar Manutenção
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>{isEditing ? 'Editar Manutenção' : 'Nova Manutenção'}</SheetTitle>
                    <SheetDescription>
                        {isEditing ? 'Altere os detalhes da manutenção.' : 'Registre uma nova manutenção para este equipamento.'}
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                     <div>
                        <Label>Tipo de Manutenção</Label>
                        <Select value={maintType} onValueChange={setMaintType} required>
                            <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                            <SelectContent>
                                {maintenanceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                      <div>
                        <Label>Data da Manutenção</Label>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !maintDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {maintDate ? format(maintDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={maintDate} onSelect={setMaintDate} initialFocus /></PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="cost">Custo (R$)</Label>
                        <Input 
                            id="cost" 
                            type="number"
                            value={maintCost}
                            onChange={(e) => setMaintCost(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Descrição do Serviço</Label>
                        <Textarea id="description" value={maintDescription} onChange={(e) => setMaintDescription(e.target.value)} rows={5} placeholder="Descreva os serviços realizados, peças trocadas, etc."/>
                      </div>
                </div>
                 <SheetFooter className="pt-4 mt-auto">
                    <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : isEditing ? 'Salvar Alterações' : 'Salvar Manutenção'}
                    </Button>
                </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

       <Card>
        <CardContent className="p-0">
             {maintenances.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                    <Wrench className="mx-auto h-10 w-10 mb-2"/>
                    <p>Nenhuma manutenção registrada para esta máquina.</p>
                </div>
             ) : (
                <ul className="divide-y">
                    {maintenances.map(maint => (
                        <li key={maint.id} className="p-4 flex items-start justify-between hover:bg-muted/50">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="p-2 bg-muted rounded-full mt-1">
                                    <Wrench className="h-5 w-5 text-primary"/>
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <p className="font-semibold">{maint.type}</p>
                                        <p className="text-xs text-muted-foreground mt-1 sm:mt-0">
                                            {format(maint.date.toDate(), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                    {maint.description && (
                                        <p className="text-muted-foreground text-sm mt-1 whitespace-pre-wrap">{maint.description}</p>
                                    )}
                                     <p className="text-sm font-semibold mt-2">Custo: {maint.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
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
                                        <DropdownMenuItem onClick={() => handleOpenSheet(maint)}>
                                            <Pencil className="mr-2 h-4 w-4"/>
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openDeleteDialog(maint.id)} className="text-destructive">
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
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro desta manutenção.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteMaintenance(maintToDelete)} className="bg-destructive hover:bg-destructive/90">
                Excluir
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
