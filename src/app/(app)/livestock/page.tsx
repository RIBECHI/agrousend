
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
import { Loader, PlusCircle, Trash2, Beef, Users } from 'lucide-react';
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

interface LivestockLot {
  id: string;
  name: string;
  description?: string;
  animalCount?: number;
  userId: string;
  createdAt: Timestamp;
}

export default function LivestockPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [lots, setLots] = useState<LivestockLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [lotToDelete, setLotToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const lotsCollection = collection(firestore, 'livestockLots');
    const q = query(lotsCollection, where('userId', '==', user.uid));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedLots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LivestockLot));
      // Ordenando os dados no lado do cliente para evitar a necessidade de um índice composto
      fetchedLots.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return dateB - dateA;
      });
      setLots(fetchedLots);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar lotes: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar lotes.",
        description: "Verifique as regras do Firestore para permitir a leitura da coleção 'livestockLots'.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
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
                    <CardDescription className="flex items-center gap-2 pt-2">
                        <Users className="h-4 w-4" />
                        {lot.animalCount || 0} animais no lote
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3 h-[60px]">
                        {lot.description || 'Nenhuma descrição para este lote.'}
                    </p>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={`/livestock`}>
                            Gerenciar Lote
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
    </>
  );
}
