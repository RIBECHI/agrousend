
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, where, doc, deleteDoc, Timestamp, updateDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, Beef, Users, MapPin, Move } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LivestockLot {
  id: string;
  name: string;
  description?: string;
  animalCount?: number;
  currentPlotId?: string;
  currentPlotName?: string;
  userId: string;
  createdAt: Timestamp;
}

interface FarmPlot {
  id: string;
  name: string;
}

export default function LivestockPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [lots, setLots] = useState<LivestockLot[]>([]);
  const [plots, setPlots] = useState<FarmPlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create Lot Sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete Lot Dialog
  const [lotToDelete, setLotToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Move Lot Sheet
  const [isMoveSheetOpen, setIsMoveSheetOpen] = useState(false);
  const [lotToMove, setLotToMove] = useState<LivestockLot | null>(null);
  const [destinationPlotId, setDestinationPlotId] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const lotsCollection = collection(firestore, 'livestockLots');
    const qLots = query(lotsCollection, where('userId', '==', user.uid));
    
    setIsLoading(true);
    const unsubscribeLots = onSnapshot(qLots, (snapshot) => {
      let fetchedLots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LivestockLot));
      // Ordenação no cliente para evitar índice composto
      fetchedLots.sort((a, b) => (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0) - (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0));
      setLots(fetchedLots);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar lotes: ", error);
      toast({ variant: "destructive", title: "Erro ao carregar lotes." });
      setIsLoading(false);
    });

    const plotsCollection = collection(firestore, 'farmPlots');
    const qPlots = query(plotsCollection, where('userId', '==', user.uid));
    const unsubscribePlots = onSnapshot(qPlots, (snapshot) => {
        const fetchedPlots = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name } as FarmPlot));
        setPlots(fetchedPlots);
    });


    return () => {
      unsubscribeLots();
      unsubscribePlots();
    }
  }, [user, toast]);


  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setIsSubmitting(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) {
      toast({ variant: "destructive", title: "Nome do lote é obrigatório." });
      return;
    }

    setIsSubmitting(true);
    try {
      const lotData = {
          userId: user.uid,
          name,
          description,
          animalCount: 0,
          createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'livestockLots'), lotData);

      toast({ title: "Sucesso!", description: "Lote cadastrado com sucesso." });
      resetForm();
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Erro ao criar lote: ", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível criar o lote." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (lotId: string) => {
    setLotToDelete(lotId);
    setShowDeleteAlert(true);
  }

  const handleDeleteLot = async (lotId: string | null) => {
    if (!lotId) return;

    try {
        await deleteDoc(doc(firestore, 'livestockLots', lotId));
        toast({ title: "Lote excluído", description: "O lote foi removido com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir lote: ", error);
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível remover o lote." });
    } finally {
        setLotToDelete(null);
        setShowDeleteAlert(false);
    }
  };

  const handleOpenMoveSheet = (lot: LivestockLot) => {
    setLotToMove(lot);
    setDestinationPlotId(lot.currentPlotId || 'none');
    setIsMoveSheetOpen(true);
  };

  const handleMoveLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotToMove || !user) return;

    // Não permite mover para o mesmo local
    if(lotToMove.currentPlotId === destinationPlotId) {
        toast({ variant: "default", title: 'Lote já está neste local.' });
        return;
    }

    setIsMoving(true);
    try {
        const batch = writeBatch(firestore);
        const lotDocRef = doc(firestore, 'livestockLots', lotToMove.id);
        const now = Timestamp.now();
        
        // 1. Finaliza o registro de movimento anterior, se houver
        if (lotToMove.currentPlotId) {
            const historyCollectionRef = collection(lotDocRef, 'movementHistory');
            const q = query(historyCollectionRef, where('exitDate', '==', null));
            const oldMovementSnapshot = await getDocs(q);

            if (!oldMovementSnapshot.empty) {
                const oldMovementDoc = oldMovementSnapshot.docs[0];
                batch.update(oldMovementDoc.ref, { exitDate: now });
            }
        }
        
        // 2. Cria o novo registro de movimento, se o destino for um pasto
        if (destinationPlotId && destinationPlotId !== 'none') {
            const historyCollectionRef = collection(lotDocRef, 'movementHistory');
            const selectedPlot = plots.find(p => p.id === destinationPlotId);
            const newMovementRef = doc(historyCollectionRef); // Cria uma referência para o novo documento
            batch.set(newMovementRef, {
                userId: user.uid,
                plotId: destinationPlotId,
                plotName: selectedPlot?.name || 'Desconhecido',
                entryDate: now,
                exitDate: null, // Fica em aberto
            });
             batch.update(lotDocRef, {
                currentPlotId: destinationPlotId,
                currentPlotName: selectedPlot?.name || null
            });
        } else {
             // 3. Limpa a localização atual no lote se o destino for "Nenhum"
             batch.update(lotDocRef, {
                currentPlotId: null,
                currentPlotName: null
            });
        }
        
        await batch.commit();
        toast({ title: 'Lote movido com sucesso!' });
        setIsMoveSheetOpen(false);
        setLotToMove(null);

    } catch (error) {
        console.error("Erro ao mover lote: ", error);
        toast({ variant: 'destructive', title: 'Erro ao mover lote.' });
    } finally {
        setIsMoving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-3"><Beef /> Gestão de Rebanho</h1>
        <Sheet open={isSheetOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsSheetOpen(open); }}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Novo Lote
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Cadastrar Novo Lote</SheetTitle>
                <SheetDescription>
                  Crie um novo lote para agrupar e gerenciar seus animais.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                  <div>
                    <Label htmlFor="name">Nome do Lote</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Novilhas Nelore 2024" />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição / Observações</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Qualquer informação relevante sobre este lote." />
                  </div>
              </div>
              <SheetFooter className="pt-4 mt-auto">
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Salvar Lote'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
         <div className="text-center py-10">
            <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando lotes...</p>
         </div>
      ) : lots.length === 0 ? (
        <Card className="text-center py-10 border-dashed">
            <CardHeader>
                <Beef className="mx-auto h-12 w-12 text-muted-foreground" />
                <CardTitle>Nenhum lote de gado cadastrado</CardTitle>
                <CardDescription>Comece cadastrando seu primeiro lote para organizar seu rebanho.</CardDescription>
            </CardHeader>
             <CardContent>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2"/>
                    Cadastrar Primeiro Lote
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot) => (
            <Card key={lot.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader>
                    <div className="flex justify-between items-start">
                         <CardTitle className="text-xl">
                            {lot.name}
                         </CardTitle>
                         <Button variant="ghost" size="icon" className="text-destructive -mt-2 -mr-2" onClick={() => openDeleteDialog(lot.id)}>
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">Excluir</span>
                        </Button>
                    </div>
                    <div className="space-y-2 pt-2">
                        <CardDescription className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {lot.animalCount || 0} animais no lote
                        </CardDescription>
                        <CardDescription className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {lot.currentPlotName || 'Sem localização'}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">
                        {lot.description || 'Nenhuma descrição para este lote.'}
                    </p>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" className="w-full">
                        <Link href={`/livestock/${lot.id}`}>
                            Gerenciar Lote
                        </Link>
                    </Button>
                    <Button onClick={() => handleOpenMoveSheet(lot)} className="w-full">
                        <Move className="mr-2 h-4 w-4" />
                        Alocar / Mover
                    </Button>
                </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Lot Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o lote e todos os seus dados associados (animais, etc).
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteLot(lotToDelete)} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
      </AlertDialog>

      {/* Move Lot Sheet */}
      <Sheet open={isMoveSheetOpen} onOpenChange={(open) => { if(!open) setLotToMove(null); setIsMoveSheetOpen(open); }}>
          <SheetContent className="w-full sm:max-w-md">
            <form onSubmit={handleMoveLot} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Alocar / Mover Lote</SheetTitle>
                <SheetDescription>
                  Selecione o pasto (talhão) de destino para o lote "{lotToMove?.name}".
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                  <div>
                    <Label htmlFor="destination-plot">Pasto de Destino</Label>
                    <Select value={destinationPlotId} onValueChange={setDestinationPlotId}>
                        <SelectTrigger id="destination-plot">
                            <SelectValue placeholder="Selecione um pasto" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhum (Remover do pasto)</SelectItem>
                            {plots.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
              </div>
              <SheetFooter className="pt-4 mt-auto">
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isMoving}>
                  {isMoving ? <><Loader className="mr-2 animate-spin" /> Movendo...</> : 'Salvar Localização'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
    </>
  );
}
