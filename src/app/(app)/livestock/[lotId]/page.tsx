
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, query, onSnapshot, addDoc, serverTimestamp, Timestamp, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, PlusCircle, Calendar, Weight, VenetianMask, Trash2, Pencil, Beef } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface LivestockLot {
    id: string;
    name: string;
    description?: string;
    animalCount?: number;
}

interface Animal {
    id: string;
    identifier: string; // Brinco ou nome
    entryDate: Timestamp;
    weight: number;
    sex: 'Macho' | 'Fêmea';
    breed: string;
    userId: string;
}

const races = ["Nelore", "Angus", "Brahman", "Girolando", "Holandês", "Outra"];

export default function LotDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const lotId = params.lotId as string;

    const [lot, setLot] = useState<LivestockLot | null>(null);
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Sheet state
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
    const isEditing = !!editingAnimal;
    
    // Form state
    const [identifier, setIdentifier] = useState('');
    const [entryDate, setEntryDate] = useState<Date | undefined>();
    const [weight, setWeight] = useState<number | ''>('');
    const [sex, setSex] = useState<'Macho' | 'Fêmea' | ''>('');
    const [breed, setBreed] = useState('');
    const [customBreed, setCustomBreed] = useState('');

    // Dialog state
    const [animalToDelete, setAnimalToDelete] = useState<string | null>(null);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);


    // Fetch lot details
    useEffect(() => {
        if (!user || !lotId) return;

        const lotDocRef = doc(firestore, 'livestockLots', lotId);
        const unsubscribe = onSnapshot(lotDocRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().userId === user.uid) {
                setLot({ id: docSnap.id, ...docSnap.data() } as LivestockLot);
            } else {
                toast({ variant: 'destructive', title: 'Lote não encontrado ou acesso negado.' });
                router.push('/livestock');
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, lotId, router, toast]);

    // Fetch animals in the lot
    useEffect(() => {
        if (!lotId) return;

        const animalsCollection = collection(firestore, 'livestockLots', lotId, 'animals');
        const q = query(animalsCollection);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAnimals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Animal));
            setAnimals(fetchedAnimals);
        });
        
        return () => unsubscribe();
    }, [lotId]);
    
    const resetForm = useCallback(() => {
        setIdentifier('');
        setEntryDate(undefined);
        setWeight('');
        setSex('');
        setBreed('');
        setCustomBreed('');
        setIsSubmitting(false);
        setEditingAnimal(null);
    }, []);

    const handleOpenSheet = (animal: Animal | null) => {
        if (animal) {
            setEditingAnimal(animal);
            setIdentifier(animal.identifier);
            setEntryDate(animal.entryDate.toDate());
            setWeight(animal.weight);
            setSex(animal.sex);
            if (races.includes(animal.breed)) {
                setBreed(animal.breed);
                setCustomBreed('');
            } else {
                setBreed('Outra');
                setCustomBreed(animal.breed);
            }
        } else {
            resetForm();
        }
        setIsSheetOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalBreed = breed === 'Outra' ? customBreed : breed;
        if (!user || !identifier || !entryDate || !weight || !sex || !finalBreed) {
            toast({ variant: 'destructive', title: 'Todos os campos são obrigatórios.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const animalData = {
                userId: user.uid,
                identifier,
                entryDate: Timestamp.fromDate(entryDate),
                weight: Number(weight),
                sex,
                breed: finalBreed,
            };

            const lotDocRef = doc(firestore, 'livestockLots', lotId);
            const animalsCollection = collection(lotDocRef, 'animals');

            if (isEditing && editingAnimal) {
                const animalDocRef = doc(animalsCollection, editingAnimal.id);
                await updateDoc(animalDocRef, animalData);
                toast({ title: 'Sucesso!', description: 'Dados do animal atualizados.' });
            } else {
                await addDoc(animalsCollection, { ...animalData, createdAt: serverTimestamp() });
                await updateDoc(lotDocRef, { animalCount: increment(1) });
                toast({ title: 'Sucesso!', description: 'Animal cadastrado no lote.' });
            }

            resetForm();
            setIsSheetOpen(false);
        } catch (error) {
            console.error("Erro ao salvar animal: ", error);
            toast({ variant: 'destructive', title: 'Erro ao salvar.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const openDeleteDialog = (animalId: string) => {
        setAnimalToDelete(animalId);
        setShowDeleteAlert(true);
    };
    
    const handleDeleteAnimal = async (animalId: string | null) => {
        if (!animalId) return;

        try {
            const animalDocRef = doc(firestore, 'livestockLots', lotId, 'animals', animalId);
            await deleteDoc(animalDocRef);
            
            const lotDocRef = doc(firestore, 'livestockLots', lotId);
            await updateDoc(lotDocRef, { animalCount: increment(-1) });

            toast({ title: 'Animal removido', description: 'O animal foi removido do lote.' });
        } catch (error) {
            console.error("Erro ao remover animal: ", error);
            toast({ variant: "destructive", title: "Erro ao remover animal." });
        } finally {
            setAnimalToDelete(null);
            setShowDeleteAlert(false);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center py-10">
                <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando dados do lote...</p>
            </div>
        );
    }
    
    return (
        <>
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.push('/livestock')}>
                <ArrowLeft className="mr-2" />
                Voltar para todos os lotes
            </Button>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                        <Beef />
                        {lot?.name}
                    </CardTitle>
                    <CardDescription>
                        {lot?.description || 'Gerencie os animais neste lote.'}
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <p>Total de <strong>{lot?.animalCount || 0} animais</strong> no lote.</p>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Animais no Lote</h2>
                <Sheet open={isSheetOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsSheetOpen(open); }}>
                    <SheetTrigger asChild>
                        <Button onClick={() => handleOpenSheet(null)}>
                            <PlusCircle className="mr-2" />
                            Adicionar Animal
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
                            <SheetHeader>
                                <SheetTitle>{isEditing ? 'Editar Animal' : 'Novo Animal'}</SheetTitle>
                                <SheetDescription>Preencha os dados do animal.</SheetDescription>
                            </SheetHeader>
                            <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                                <div>
                                    <Label htmlFor="identifier">Identificação (Brinco/Nome)</Label>
                                    <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
                                </div>
                                <div>
                                    <Label>Data de Entrada / Nascimento</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !entryDate && "text-muted-foreground")}>
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {entryDate ? format(entryDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><CalendarPicker mode="single" selected={entryDate} onSelect={setEntryDate} initialFocus /></PopoverContent>
                                    </Popover>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <Label htmlFor="weight">Peso (kg)</Label>
                                        <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))} required />
                                    </div>
                                    <div>
                                        <Label>Sexo</Label>
                                        <Select value={sex} onValueChange={(v) => setSex(v as any)} required>
                                            <SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Macho">Macho</SelectItem>
                                                <SelectItem value="Fêmea">Fêmea</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label>Raça</Label>
                                    <Select value={breed} onValueChange={setBreed} required>
                                        <SelectTrigger><SelectValue placeholder="Selecione a raça"/></SelectTrigger>
                                        <SelectContent>
                                            {races.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {breed === 'Outra' && (
                                    <div>
                                        <Label htmlFor="customBreed">Especifique a raça</Label>
                                        <Input id="customBreed" value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} required placeholder="Ex: Gir Leiteiro" />
                                    </div>
                                )}
                            </div>
                            <SheetFooter className="pt-4 mt-auto">
                                <SheetClose asChild><Button type="button" variant="outline">Cancelar</Button></SheetClose>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : isEditing ? 'Salvar Alterações' : 'Adicionar Animal'}
                                </Button>
                            </SheetFooter>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>
            
             <Card>
                <CardContent className="p-0">
                    {animals.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10">Nenhum animal cadastrado neste lote.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Identificação</TableHead>
                                    <TableHead>Sexo</TableHead>
                                    <TableHead>Raça</TableHead>
                                    <TableHead>Peso (kg)</TableHead>
                                    <TableHead>Data de Entrada</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {animals.map(animal => (
                                    <TableRow key={animal.id}>
                                        <TableCell className="font-medium">{animal.identifier}</TableCell>
                                        <TableCell>{animal.sex}</TableCell>
                                        <TableCell>{animal.breed}</TableCell>
                                        <TableCell>{animal.weight}</TableCell>
                                        <TableCell>{format(animal.entryDate.toDate(), 'dd/MM/yyyy')}</TableCell>
                                        <TableCell className="text-right">
                                             <Button variant="ghost" size="icon" className="mr-2" onClick={() => handleOpenSheet(animal)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(animal.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

        </div>
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente os dados do animal.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteAnimal(animalToDelete)} className="bg-destructive hover:bg-destructive/90">
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
