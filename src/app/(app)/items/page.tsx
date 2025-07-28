
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, Leaf, Spray, Bug, Beaker, Cog, Tractor } from 'lucide-react';
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

const categoryConfig: { [key: string]: { icon: React.ElementType, color: string } } = {
  fungicida: { icon: Spray, color: 'border-t-blue-500' },
  inseticida: { icon: Bug, color: 'border-t-red-500' },
  fertilizante: { icon: Beaker, color: 'border-t-green-500' },
  herbicida: { icon: Leaf, color: 'border-t-yellow-500' },
  sementes: { icon: Tractor, color: 'border-t-orange-500' },
  peças: { icon: Cog, color: 'border-t-gray-500' },
  default: { icon: Tractor, color: 'border-t-gray-400' },
};


export default function ItemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // State for the form
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
    try {
      const newItem: Omit<CatalogItem, 'id'> & { createdAt: any } = {
        userId: user.uid,
        name,
        category,
        description,
        createdAt: serverTimestamp(),
      };

      if (category === 'peças') {
        newItem.tipo = tipo;
        newItem.aplicacao = aplicacao;
        newItem.codigo = codigo;
      } else {
        newItem.fabricante = fabricante;
        newItem.principioAtivo = principioAtivo;
        newItem.formula = formula;
      }

      await addDoc(collection(firestore, 'items'), newItem);

      toast({
        title: "Sucesso!",
        description: "Item cadastrado com sucesso.",
      });
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao cadastrar item: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível cadastrar o item.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteAlert(true);
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
              <SheetTitle>Cadastrar Novo Item</SheetTitle>
              <SheetDescription>
                Crie um novo item para seu catálogo. Ele poderá ser usado no controle de estoque.
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
                    <Select value={category} onValueChange={setCategory}>
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const config = categoryConfig[item.category] || categoryConfig.default;
            const Icon = config.icon;
            return (
              <Card key={item.id} className={cn("flex flex-col border-t-4", config.color)}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <CardDescription>{item.category || 'Sem categoria'}</CardDescription>
                      </div>
                      <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                   {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                </CardContent>
                <CardFooter className="flex justify-end pt-4">
                   <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(item.id)}>
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Excluir</span>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
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
    </>
  );
}

    