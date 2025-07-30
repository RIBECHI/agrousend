
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
import { Loader, PlusCircle, Trash2, Pencil, Tractor } from 'lucide-react';
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
  type: string;
  brand: string;
  model: string;
  year: number;
  userId: string;
}

const machineTypes = ['Trator', 'Colheitadeira', 'Pulverizador', 'Plantadeira', 'Implemento', 'Veículo', 'Outro'];

export default function MachineryPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const isEditing = !!editingMachine;
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dialog state
  const [machineToDelete, setMachineToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const machinesCollection = collection(firestore, 'machinery');
    const q = query(machinesCollection, where('userId', '==', user.uid), orderBy('name', 'asc'));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMachines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
      setMachines(fetchedMachines);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar máquinas: ", error);
      toast({ variant: "destructive", title: "Erro ao carregar maquinário." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const resetForm = useCallback(() => {
    setName('');
    setType('');
    setBrand('');
    setModel('');
    setYear('');
    setEditingMachine(null);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (isSheetOpen) {
        if(editingMachine) {
            setName(editingMachine.name);
            setType(editingMachine.type);
            setBrand(editingMachine.brand);
            setModel(editingMachine.model);
            setYear(editingMachine.year);
        } else {
            resetForm();
        }
    }
  }, [isSheetOpen, editingMachine, resetForm]);

  const handleOpenSheet = (machine: Machine | null) => {
    setEditingMachine(machine);
    setIsSheetOpen(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !type || !brand || !model || !year) {
      toast({ variant: "destructive", title: "Todos os campos são obrigatórios." });
      return;
    }

    setIsSubmitting(true);
    try {
        const machineData = {
            userId: user.uid,
            name,
            type,
            brand,
            model,
            year: Number(year),
        };

        if(isEditing && editingMachine) {
            const docRef = doc(firestore, 'machinery', editingMachine.id);
            await updateDoc(docRef, machineData);
            toast({ title: "Sucesso!", description: "Máquina atualizada com sucesso." });
        } else {
            await addDoc(collection(firestore, 'machinery'), { ...machineData, createdAt: serverTimestamp() });
            toast({ title: "Sucesso!", description: "Máquina cadastrada com sucesso." });
        }
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao salvar máquina: ", error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar os dados da máquina." });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const openDeleteDialog = (machineId: string) => {
    setMachineToDelete(machineId);
    setShowDeleteAlert(true);
  }

  const handleDeleteMachine = async (machineId: string | null) => {
    if (!machineId) return;

    try {
        await deleteDoc(doc(firestore, 'machinery', machineId));
        toast({ title: "Máquina excluída", description: "O registro da máquina foi removido com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir máquina: ", error);
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível remover a máquina." });
    } finally {
        setMachineToDelete(null);
        setShowDeleteAlert(false);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão de Maquinário</h1>
        <Button onClick={() => handleOpenSheet(null)}>
            <PlusCircle className="mr-2" />
            Cadastrar Máquina
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Minhas Máquinas e Equipamentos</CardTitle>
            <CardDescription>Lista de todo o maquinário cadastrado em sua propriedade.</CardDescription>
        </CardHeader>
        <CardContent>
             {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                    <Loader className="mx-auto h-8 w-8 animate-spin" />
                    <p>Carregando maquinário...</p>
                </div>
            ) : machines.length === 0 ? (
                 <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <Tractor className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Nenhuma máquina cadastrada</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Comece cadastrando seu primeiro trator, colheitadeira ou implemento.</p>
                    <div className="mt-6">
                        <Button onClick={() => handleOpenSheet(null)}>
                            <PlusCircle className="mr-2" />
                            Cadastrar Máquina
                        </Button>
                    </div>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {machines.map((machine) => (
                        <li key={machine.id} className="py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 text-primary p-3 rounded-full">
                                    <Tractor />
                                </div>
                                <div>
                                    <p className="font-semibold">{machine.name}</p>
                                    <p className="text-sm text-muted-foreground">{machine.brand} {machine.model} - Ano {machine.year}</p>
                                    <p className="text-xs font-medium bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 inline-block mt-1">{machine.type}</p>
                                </div>
                            </div>
                            <div className='flex gap-2'>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenSheet(machine)}>
                                    <Pencil className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(machine.id)}>
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
                <SheetTitle>{isEditing ? 'Editar Máquina' : 'Cadastrar Nova Máquina'}</SheetTitle>
                <SheetDescription>
                  Preencha as informações do seu equipamento para melhor controle.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                  <div>
                    <Label htmlFor="name">Nome / Apelido</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Tratorzão Amarelo" />
                  </div>
                   <div>
                    <Label>Tipo</Label>
                    <Select value={type} onValueChange={setType} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de máquina" />
                        </SelectTrigger>
                        <SelectContent>
                            {machineTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="brand">Marca</Label>
                            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required placeholder="Ex: John Deere" />
                        </div>
                        <div>
                            <Label htmlFor="model">Modelo</Label>
                            <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} required placeholder="Ex: 6110J" />
                        </div>
                   </div>
                  <div>
                    <Label htmlFor="year">Ano de Fabricação</Label>
                    <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))} required placeholder="Ex: 2022" />
                  </div>
              </div>
              <SheetFooter className="pt-4 mt-auto">
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Salvar'}
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
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente os dados da máquina.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteMachine(machineToDelete)} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
