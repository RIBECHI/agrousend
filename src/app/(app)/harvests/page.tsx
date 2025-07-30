
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, where, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, Calendar as CalendarIcon, Wheat } from 'lucide-react';
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Harvest {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  userId: string;
  createdAt: Timestamp;
}

export default function HarvestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [harvestToDelete, setHarvestToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const harvestsCollection = collection(firestore, 'harvests');
    const q = query(harvestsCollection, where('userId', '==', user.uid), orderBy('startDate', 'asc'));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedHarvests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Harvest));
      setHarvests(fetchedHarvests);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar safras: ", error);
      let description = "Ocorreu um erro ao carregar as safras.";
      if ((error as any).code === 'failed-precondition') {
        description = "A consulta requer um índice do Firestore. Verifique o console do navegador para obter o link para criá-lo.";
      } else if ((error as any).code === 'permission-denied') {
        description = "Você não tem permissão para ver as safras. Verifique as Regras de Segurança do Firestore.";
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao carregar safras",
        description: description,
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);


  const resetForm = useCallback(() => {
    setName('');
    setDateRange(undefined);
    setIsSubmitting(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !dateRange?.from || !dateRange?.to) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome da safra e o período (início e fim) são obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const harvestData = {
          userId: user.uid,
          name,
          startDate: Timestamp.fromDate(dateRange.from),
          endDate: Timestamp.fromDate(dateRange.to),
          createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'harvests'), harvestData);

      toast({
        title: "Sucesso!",
        description: "Safra cadastrada com sucesso.",
      });
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao criar safra: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível criar a safra.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (harvestId: string) => {
    setHarvestToDelete(harvestId);
    setShowDeleteAlert(true);
  }

  const handleDeleteHarvest = async (harvestId: string | null) => {
    if (!harvestId) return;

    try {
        await deleteDoc(doc(firestore, 'harvests', harvestId));
        toast({
            title: "Safra excluída",
            description: "A safra foi removida com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao excluir safra: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível remover a safra.",
        });
    } finally {
        setHarvestToDelete(null);
        setShowDeleteAlert(false);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão de Safras</h1>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if(!open) resetForm();
            setIsSheetOpen(open);
        }}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Nova Safra
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Cadastrar Nova Safra</SheetTitle>
                <SheetDescription>
                  Defina um nome e o período para a sua nova safra.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                  <div>
                    <Label htmlFor="name">Nome da Safra</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Safra Soja 2024/2025" />
                  </div>
                  <div>
                    <Label>Período da Safra</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                    {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                                    {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y", { locale: ptBR })
                                )
                                ) : (
                                <span>Escolha o período</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                  </div>
              </div>
              <SheetFooter className="pt-4 mt-auto">
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Salvar Safra'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
         <div className="text-center py-10">
            <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando safras...</p>
         </div>
      ) : harvests.length === 0 ? (
        <Card className="text-center py-10 border-dashed">
            <CardHeader>
                <Wheat className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle>Nenhuma safra cadastrada</CardTitle>
                <CardDescription>Comece cadastrando sua primeira safra para iniciar o planejamento.</CardDescription>
            </CardHeader>
             <CardContent>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2"/>
                    Cadastrar Primeira Safra
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {harvests.map((harvest) => (
            <Card key={harvest.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                             <CardTitle className="text-xl">
                                <Link href={`/harvests/${harvest.id}`} className="hover:underline">{harvest.name}</Link>
                             </CardTitle>
                            <CardDescription className="flex items-center gap-2 pt-2">
                                <CalendarIcon className="h-4 w-4" />
                                {format(harvest.startDate.toDate(), "dd/MM/yyyy", { locale: ptBR })} à {format(harvest.endDate.toDate(), "dd/MM/yyyy", { locale: ptBR })}
                            </CardDescription>
                        </div>
                        <div>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(harvest.id)}>
                                <Trash2 className="h-5 w-5" />
                                <span className="sr-only">Excluir</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardFooter>
                    <Button asChild variant="outline">
                        <Link href={`/harvests/${harvest.id}`}>
                            Gerenciar Safra
                        </Link>
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
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a safra e todos os seus dados associados.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteHarvest(harvestToDelete)} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
