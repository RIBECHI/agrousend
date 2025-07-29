
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, Leaf, SprayCan, Bug, Beaker, Cog, Tractor, Pencil, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Separator } from '@/components/ui/separator';


interface CatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  userId: string;
  fabricante?: string;
  principioAtivo?: string;
  formula?: string;
  tipo?: string;
  aplicacao?: string;
  codigo?: string;
}

const categoryConfig: { [key: string]: { icon: React.ElementType, color: string, label: string } } = {
  fungicida: { icon: SprayCan, color: 'text-blue-500', label: 'Fungicida' },
  inseticida: { icon: Bug, color: 'text-red-500', label: 'Inseticida' },
  fertilizante: { icon: Beaker, color: 'text-green-500', label: 'Fertilizante' },
  herbicida: { icon: Leaf, color: 'text-yellow-500', label: 'Herbicida' },
  sementes: { icon: Tractor, color: 'text-orange-500', label: 'Sementes' },
  peças: { icon: Cog, color: 'text-gray-500', label: 'Peças' },
  default: { icon: Tractor, color: 'text-gray-400', label: 'Item' },
};


export default function ItemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // State for the form
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [principioAtivo, setPrincipioAtivo] = useState('');
  const [formula, setFormula] = useState('');
  const [tipo, setTipo] = useState('');
  const [aplicacao, setAplicacao] = useState('');
  const [codigo, setCodigo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const itemsCollection = collection(firestore, 'items');
    const q = query(
      itemsCollection,
      where('userId', '==', user.uid)
    );
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CatalogItem));
        setItems(fetchedItems.sort((a, b) => a.name.localeCompare(b.name)));
        setIsLoading(false);
      }, 
      (error) => {
        console.error("ERRO DO FIREBASE AQUI: ", error); 
        toast({
          variant: "destructive",
          title: "Erro ao carregar itens.",
          description: "Verifique o console do navegador para mais detalhes e criar o índice se necessário.",
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, toast]);

  const resetForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setFabricante('');
    setPrincipioAtivo('');
    setFormula('');
    setTipo('');
    setAplicacao('');
    setCodigo('');
    setIsSubmitting(false);
    setEditingItem(null);
  }

  const handleEditClick = (item: CatalogItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description);
    setFabricante(item.fabricante || '');
    setPrincipioAtivo(item.principioAtivo || '');
    setFormula(item.formula || '');
    setTipo(item.tipo || '');
    setAplicacao(item.aplicacao || '');
    setCodigo(item.codigo || '');
    setIsSheetOpen(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !category) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome do item e categoria são obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);
    
    const itemData: Omit<CatalogItem, 'id' | 'userId'> & { userId?: string, createdAt?: any } = {
        name,
        category,
        description,
        fabricante: category !== 'peças' ? fabricante : '',
        principioAtivo: category !== 'peças' ? principioAtivo : '',
        formula: category !== 'peças' ? formula : '',
        tipo: category === 'peças' ? tipo : '',
        aplicacao: category === 'peças' ? aplicacao : '',
        codigo: category === 'peças' ? codigo : '',
    };


    try {
      if (editingItem) {
        // Update existing item
        const itemRef = doc(firestore, 'items', editingItem.id);
        await updateDoc(itemRef, itemData);
        toast({
          title: "Sucesso!",
          description: "Item atualizado com sucesso.",
        });

      } else {
        // Create new item
        itemData.userId = user.uid;
        itemData.createdAt = serverTimestamp();
        await addDoc(collection(firestore, 'items'), itemData);
        toast({
          title: "Sucesso!",
          description: "Item cadastrado com sucesso.",
        });
      }
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao salvar item: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar o item.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteAlert(true);
  }
  
  const openDetailsDialog = (item: CatalogItem) => {
    setSelectedItem(item);
    setShowDetailsDialog(true);
  }

  const handleDeleteItem = async (itemId: string | null) => {
    if (!itemId) return;

    try {
        await deleteDoc(doc(firestore, 'items', itemId));
        toast({
            title: "Item excluído",
            description: "O item foi removido do seu cadastro.",
        });
    } catch (error) {
        console.error("Erro ao excluir o item: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível remover o item.",
        });
    } finally {
        setItemToDelete(null);
        setShowDeleteAlert(false);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cadastro de Itens</h1>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if(!open) resetForm();
            setIsSheetOpen(open);
        }}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Cadastrar Novo Item
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>{editingItem ? 'Editar Item' : 'Cadastrar Novo Item'}</SheetTitle>
              <SheetDescription>
                {editingItem ? 'Altere as informações do item.' : 'Crie um novo item para seu catálogo. Ele poderá ser usado no controle de estoque.'}
              </SheetDescription>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <div className="space-y-4 py-6 flex-1 overflow-y-auto pr-6">
                  <div>
                    <Label htmlFor="name">Nome do Item</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Semente de Soja TMG 7063" required />
                  </div>
                   <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fungicida">Fungicida</SelectItem>
                            <SelectItem value="inseticida">Inseticida</SelectItem>
                            <SelectItem value="fertilizante">Fertilizante</SelectItem>
                            <SelectItem value="herbicida">Herbicida</SelectItem>
                            <SelectItem value="sementes">Sementes</SelectItem>
                            <SelectItem value="peças">Peças</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  
                  {category && category !== 'peças' && (
                    <div className="space-y-4 border-t pt-4">
                        <div>
                            <Label htmlFor="fabricante">Fabricante</Label>
                            <Input id="fabricante" value={fabricante} onChange={(e) => setFabricante(e.target.value)} placeholder="Ex: Bayer, Syngenta" />
                        </div>
                        <div>
                            <Label htmlFor="principioAtivo">Princípio Ativo</Label>
                            <Input id="principioAtivo" value={principioAtivo} onChange={(e) => setPrincipioAtivo(e.target.value)} placeholder="Ex: Glifosato, Mancozebe" />
                        </div>
                        <div>
                            <Label htmlFor="formula">Fórmula</Label>
                            <Input id="formula" value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="Ex: C3H8NO5P" />
                        </div>
                    </div>
                  )}

                  {category === 'peças' && (
                     <div className="space-y-4 border-t pt-4">
                        <div>
                            <Label htmlFor="tipo">Tipo</Label>
                            <Input id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ex: Filtro de ar, Correia" />
                        </div>
                        <div>
                            <Label htmlFor="aplicacao">Aplicação</Label>
                            <Input id="aplicacao" value={aplicacao} onChange={(e) => setAplicacao(e.target.value)} placeholder="Ex: Motor, Colheitadeira" />
                        </div>
                        <div>
                            <Label htmlFor="codigo">Código/Referência</Label>
                            <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: 5801483321" />
                        </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes sobre o item, fornecedor, etc." />
                  </div>
              </div>
              <SheetFooter className="pt-4 mt-auto">
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Salvar Item'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
         <div className="text-center py-10">
            <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando seus itens...</p>
         </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-10">
            <CardHeader>
                <CardTitle>Nenhum item cadastrado</CardTitle>
                <CardDescription>Comece cadastrando seu primeiro item para poder gerenciá-lo aqui.</CardDescription>
            </CardHeader>
             <CardContent>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2"/>
                    Cadastrar Primeiro Item
                </Button>
            </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const config = categoryConfig[item.category] || categoryConfig.default;
                  const Icon = config.icon;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Icon className={cn("h-6 w-6", config.color)} />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{config.label}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" onClick={() => openDetailsDialog(item)}>
                            <Eye className="h-5 w-5" />
                            <span className="sr-only">Detalhes</span>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleEditClick(item)}>
                            <Pencil className="h-5 w-5" />
                            <span className="sr-only">Editar</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(item.id)}>
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">Excluir</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
          </Table>
        </Card>
      )}

        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o item do seu cadastro.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteItem(itemToDelete)} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {selectedItem && (
             <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{selectedItem.name}</DialogTitle>
                        <DialogDescription>
                            Detalhes completos do item cadastrado.
                        </DialogDescription>
                    </DialogHeader>
                    <Separator />
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label className="text-right text-muted-foreground">Categoria</Label>
                            <span className="col-span-2 font-medium">{categoryConfig[selectedItem.category]?.label || 'N/A'}</span>
                        </div>
                        
                        {selectedItem.category === 'peças' ? (
                            <>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label className="text-right text-muted-foreground">Tipo</Label>
                                    <span className="col-span-2">{selectedItem.tipo || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label className="text-right text-muted-foreground">Aplicação</Label>
                                    <span className="col-span-2">{selectedItem.aplicacao || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label className="text-right text-muted-foreground">Código</Label>
                                    <span className="col-span-2">{selectedItem.codigo || 'N/A'}</span>
                                </div>
                            </>
                        ) : (
                             <>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label className="text-right text-muted-foreground">Fabricante</Label>
                                    <span className="col-span-2">{selectedItem.fabricante || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label className="text-right text-muted-foreground">Princípio Ativo</Label>
                                    <span className="col-span-2">{selectedItem.principioAtivo || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label className="text-right text-muted-foreground">Fórmula</Label>
                                    <span className="col-span-2">{selectedItem.formula || 'N/A'}</span>
                                </div>
                            </>
                        )}
                         <Separator />
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Descrição/Observações</Label>
                            <p className="text-sm p-3 bg-muted rounded-md min-h-[60px]">
                                {selectedItem.description || 'Nenhuma descrição fornecida.'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Fechar
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </>
  );
}
