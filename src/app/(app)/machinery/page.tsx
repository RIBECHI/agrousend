
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, where, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, Pencil, Tractor, Wrench, Info, Image as ImageIcon, X } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';


interface Machine {
  id: string;
  name: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  userId: string;
  imageUrl?: string;
}

const machineTypes = ['Trator', 'Colheitadeira', 'Pulverizador', 'Plantadeira', 'Implemento', 'Veículo', 'Outro'];

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

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
  const [year, setYear] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Dialog state
  const [machineToDelete, setMachineToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Detail view state
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const machinesCollection = collection(firestore, 'machinery');
    const q = query(machinesCollection, where('userId', '==', user.uid));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedMachines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
      fetchedMachines.sort((a, b) => a.name.localeCompare(b.name));
      setMachines(fetchedMachines);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar máquinas: ", error);
      toast({ variant: "destructive", title: "Erro ao carregar maquinário." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);
  
  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
  }, []);

  const resetForm = useCallback(() => {
    setName('');
    setType('');
    setBrand('');
    setModel('');
    setYear('');
    setEditingMachine(null);
    setIsSubmitting(false);
    removeImage();
  }, [removeImage]);

  useEffect(() => {
    if (isSheetOpen) {
        if(editingMachine) {
            setName(editingMachine.name);
            setType(editingMachine.type);
            setBrand(editingMachine.brand);
            setModel(editingMachine.model);
            setYear(editingMachine.year);
            setImagePreview(editingMachine.imageUrl || null);
        } else {
            resetForm();
        }
    }
  }, [isSheetOpen, editingMachine, resetForm]);

  const handleOpenEditSheet = (machine: Machine | null) => {
    setEditingMachine(machine);
    setIsSheetOpen(true);
  }
  
  const handleViewDetails = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsDetailSheetOpen(true);
  };
  
    const compressImage = async (file: File, quality = 0.6, maxSizeMB = 0.5): Promise<File> => {
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size <= maxSize && file.type === 'image/jpeg') {
            return file;
        }

        return new Promise((resolve, reject) => {
            const image = new window.Image();
            image.src = URL.createObjectURL(file);
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    return reject(new Error('Não foi possível obter o contexto do canvas.'));
                }

                let { width, height } = image;
                const MAX_WIDTH_HEIGHT = 1024; // Reduzido para imagens de equipamento
                if (width > height) {
                    if (width > MAX_WIDTH_HEIGHT) {
                        height *= MAX_WIDTH_HEIGHT / width;
                        width = MAX_WIDTH_HEIGHT;
                    }
                } else {
                    if (height > MAX_WIDTH_HEIGHT) {
                        width *= MAX_WIDTH_HEIGHT / height;
                        height = MAX_WIDTH_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(image, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            if (blob.size > maxSize) {
                                return reject(new Error("A imagem ainda é muito grande após a compressão."));
                            }
                            const newFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Falha ao criar o blob da imagem.'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            image.onerror = reject;
        });
    };
    
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const compressedFile = await compressImage(file);
                setImageFile(compressedFile);
                const previewUrl = URL.createObjectURL(compressedFile);
                setImagePreview(previewUrl);
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Erro ao processar imagem",
                    description: error.message || "Não foi possível comprimir a imagem.",
                });
                removeImage();
            }
        }
    };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !type || !brand || !model || !year) {
      toast({ variant: "destructive", title: "Todos os campos são obrigatórios." });
      return;
    }

    setIsSubmitting(true);
    try {
        const machineData: any = {
            userId: user.uid,
            name,
            type,
            brand,
            model,
            year: Number(year),
        };
        
        if (imageFile) {
            machineData.imageUrl = await toBase64(imageFile);
        } else if (isEditing && !imagePreview) {
            // Se a imagem foi removida na edição
            machineData.imageUrl = null;
        }

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
        <Button onClick={() => handleOpenEditSheet(null)}>
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
                        <Button onClick={() => handleOpenEditSheet(null)}>
                            <PlusCircle className="mr-2" />
                            Cadastrar Máquina
                        </Button>
                    </div>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {machines.map((machine) => (
                        <li key={machine.id} className="py-3 px-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => handleViewDetails(machine)}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                     <div className="relative flex-shrink-0 w-16 h-16 rounded-md bg-muted overflow-hidden">
                                        <Image 
                                            src={machine.imageUrl || 'https://placehold.co/100x100.png'}
                                            alt={machine.name}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="tractor agriculture machinery"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{machine.name}</p>
                                        <p className="text-sm text-muted-foreground">{machine.brand} {machine.model} - Ano {machine.year}</p>
                                        <p className="text-xs font-medium bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 inline-block mt-1">{machine.type}</p>
                                    </div>
                                </div>
                                <div className='flex gap-2'>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenEditSheet(machine); }}>
                                        <Pencil className="h-5 w-5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteDialog(machine.id); }}>
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
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
                        <Label>Foto do Equipamento</Label>
                        {imagePreview ? (
                            <div className="relative mt-2">
                                <Image src={imagePreview} alt="Preview do equipamento" width={200} height={100} className="rounded-md object-cover w-full aspect-video" />
                                <Button variant="destructive" size="icon" onClick={removeImage} className="absolute top-2 right-2 h-7 w-7">
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-gray-100/25">
                                <div className="text-center">
                                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark dark:bg-transparent">
                                        <span>Selecione uma imagem</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                    </label>
                                    <p className="pl-1 dark:text-gray-400">ou arraste e solte</p>
                                    </div>
                                    <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG até 500KB</p>
                                </div>
                            </div>
                        )}
                    </div>

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
      
        <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{selectedMachine?.name}</SheetTitle>
                    <SheetDescription>Detalhes do equipamento selecionado.</SheetDescription>
                </SheetHeader>
                 {selectedMachine && (
                    <div className="py-6 flex flex-col gap-4">
                        {selectedMachine.imageUrl && (
                             <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
                                <Image src={selectedMachine.imageUrl} alt={selectedMachine.name} fill className="object-cover" />
                             </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center">
                            <Label>Tipo</Label>
                            <p className="font-medium">{selectedMachine.type}</p>
                        </div>
                        <Separator />
                         <div className="flex justify-between items-center">
                            <Label>Marca</Label>
                            <p className="font-medium">{selectedMachine.brand}</p>
                        </div>
                         <Separator />
                         <div className="flex justify-between items-center">
                            <Label>Modelo</Label>
                            <p className="font-medium">{selectedMachine.model}</p>
                        </div>
                         <Separator />
                         <div className="flex justify-between items-center">
                            <Label>Ano</Label>
                            <p className="font-medium">{selectedMachine.year}</p>
                        </div>
                         <Separator />
                    </div>
                )}
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">Fechar</Button>
                    </SheetClose>
                </SheetFooter>
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

    