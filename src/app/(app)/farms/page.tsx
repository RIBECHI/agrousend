
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, MapPin } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import MapWithDraw from '@/components/map-with-draw';
import Image from 'next/image';


interface FarmPlot {
  id: string;
  name: string;
  description: string;
  area: number;
  geoJson: any;
  culture?: string;
  userId: string;
}

const getStaticMapUrl = (geoJson: any) => {
    // Placeholder as we are using Leaflet now
    return 'https://placehold.co/600x400.png';
}


export default function FarmsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [plots, setPlots] = useState<FarmPlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // State for the form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [culture, setCulture] = useState('');
  const [area, setArea] = useState(0);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [plotToDelete, setPlotToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    };

    const plotsCollection = collection(firestore, 'farmPlots');
    const q = query(plotsCollection, where('userId', '==', user.uid));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPlots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmPlot));
      setPlots(fetchedPlots);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar talhões: ", error);
      // Removido o toast de erro para não confundir o usuário quando a coleção está vazia.
      // O estado de 'nenhum talhão' é tratado na renderização.
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCulture('');
    setArea(0);
    setGeoJson(null);
    setIsSubmitting(false);
  }

  const handleDrawComplete = (areaInHectares: number, geoJsonData: any) => {
    setArea(parseFloat(areaInHectares.toFixed(4)));
    setGeoJson(geoJsonData);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !geoJson) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome do talhão e desenho no mapa são obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'farmPlots'), {
        userId: user.uid,
        name,
        description,
        culture,
        area,
        geoJson,
        createdAt: new Date(),
      });

      toast({
        title: "Sucesso!",
        description: "Talhão adicionado com sucesso.",
      });
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao adicionar talhão: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível adicionar o talhão.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (plotId: string) => {
    setPlotToDelete(plotId);
    setShowDeleteAlert(true);
  }

  const handleDeletePlot = async (plotId: string | null) => {
    if (!plotId) return;

    try {
        await deleteDoc(doc(firestore, 'farmPlots', plotId));
        toast({
            title: "Talhão excluído",
            description: "O talhão foi removido com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao excluir talhão: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível remover o talhão.",
        });
    } finally {
        setPlotToDelete(null);
        setShowDeleteAlert(false);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestão de Talhões</h1>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if(!open) resetForm();
            setIsSheetOpen(open);
        }}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Adicionar Talhão
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-3xl">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Adicionar Novo Talhão</SheetTitle>
                <SheetDescription>
                  Preencha as informações abaixo e desenhe o polígono do seu talhão no mapa.
                </SheetDescription>
              </SheetHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-1">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Talhão</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="culture">Cultura</Label>
                    <Input id="culture" value={culture} onChange={(e) => setCulture(e.target.value)} placeholder="Ex: Soja, Milho, Café" />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                   <div>
                    <Label>Área (Hectares)</Label>
                    <Input value={area > 0 ? `${area} ha` : 'Desenhe no mapa para calcular'} readOnly disabled />
                  </div>
                </div>
                <div className="h-[400px] md:h-full w-full rounded-lg overflow-hidden border">
                   <MapWithDraw onDrawComplete={handleDrawComplete} />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Salvar Talhão'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
         <div className="text-center py-10">
            <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando seus talhões...</p>
         </div>
      ) : plots.length === 0 ? (
        <Card className="text-center py-10">
            <CardHeader>
                <CardTitle>Nenhum talhão encontrado</CardTitle>
                <CardDescription>Comece adicionando seu primeiro talhão para visualizá-lo aqui.</CardDescription>
            </CardHeader>
             <CardContent>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2"/>
                    Adicionar seu Primeiro Talhão
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plots.map((plot) => (
            <Card key={plot.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plot.name}</CardTitle>
                <CardDescription>{plot.culture || 'Cultura não definida'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                 <div className="h-48 w-full rounded-lg overflow-hidden border mb-4 relative">
                    <p className="text-center text-muted-foreground p-4">Visualização de mapa em breve.</p>
                </div>
                <p className="text-sm text-muted-foreground">{plot.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="font-bold text-lg">{plot.area} ha</div>
                 <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(plot.id)}>
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">Excluir</span>
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
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o seu talhão.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeletePlot(plotToDelete)} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
