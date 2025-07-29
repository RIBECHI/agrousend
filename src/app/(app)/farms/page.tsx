
'use client';

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, where, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, MapPin, Minimize2, Maximize2 } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { LatLngBounds } from 'leaflet';
import { Separator } from '@/components/ui/separator';

const LeafletMap = lazy(() => import('@/components/leaflet-map'));
const LeafletMapDisplay = lazy(() => import('@/components/leaflet-map-display'));


interface FarmPlot {
  id: string;
  name: string;
  area: number;
  culture: string;
  geoJson: any; 
  userId: string;
  createdAt: Timestamp;
}

export default function FarmsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [plots, setPlots] = useState<FarmPlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [culture, setCulture] = useState('');
  const [area, setArea] = useState(0);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [plotToDelete, setPlotToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const plotsCollection = collection(firestore, 'farmPlots');
    const q = query(plotsCollection, where('userId', '==', user.uid));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPlots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmPlot));
      setPlots(fetchedPlots);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar talhões: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar talhões.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const resetForm = useCallback(() => {
    setName('');
    setCulture('');
    setArea(0);
    setGeoJson(null);
    setIsSubmitting(false);
  }, []);

  const handleDrawComplete = useCallback((areaInHectares: number, drawnGeoJson: any) => {
    setArea(areaInHectares);
    setGeoJson(drawnGeoJson);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !culture || !geoJson) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Nome, cultura e o desenho no mapa são obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
        const plotData = {
            userId: user.uid,
            name,
            culture,
            area,
            geoJson: geoJson, // Save the full GeoJSON Feature object
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'farmPlots'), plotData);

        toast({
            title: "Sucesso!",
            description: "Talhão cadastrado com sucesso.",
        });
        
        resetForm();
        setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao criar talhão: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível cadastrar o talhão.",
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

  const totalArea = plots.reduce((acc, plot) => acc + plot.area, 0);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col space-y-6">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Visão Geral dos Talhões</CardTitle>
                        <CardDescription>Visualize todos os seus talhões no mapa.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="h-[400px] w-full p-0">
                     <Suspense fallback={<Skeleton className="h-full w-full" />}>
                        <LeafletMapDisplay plots={plots} onBoundsChange={setMapBounds} />
                    </Suspense>
                </CardContent>
             </Card>
             <Card>
                 <CardHeader>
                    <CardTitle>Lista de Talhões</CardTitle>
                     <CardDescription>
                        Total de {plots.length} talhões cadastrados, somando {totalArea.toFixed(2)} hectares.
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                    {isLoading ? (
                        <div className="text-center text-muted-foreground py-8">
                            <Loader className="mx-auto h-8 w-8 animate-spin" />
                            <p>Carregando...</p>
                        </div>
                    ) : plots.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">Nenhum talhão cadastrado.</p>
                    ) : (
                       <ul className="space-y-4">
                            {plots.map(plot => (
                                <li key={plot.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{plot.name}</p>
                                        <p className="text-sm text-muted-foreground">{plot.culture} - {plot.area.toFixed(2)} ha</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(plot.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                 </CardContent>
             </Card>
        </div>
        <div className="lg:col-span-1">
             <Sheet open={isSheetOpen} onOpenChange={(open) => {
                if(!open) resetForm();
                setIsSheetOpen(open);
            }}>
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle>Adicionar Novo Talhão</CardTitle>
                        <CardDescription>Desenhe o polígono do seu talhão no mapa para cadastrá-lo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SheetTrigger asChild>
                            <Button className="w-full">
                                <PlusCircle className="mr-2" />
                                Cadastrar Talhão
                            </Button>
                        </SheetTrigger>
                    </CardContent>
                </Card>
                <SheetContent className="w-full sm:max-w-4xl">
                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <SheetHeader>
                        <SheetTitle>Cadastrar Novo Talhão</SheetTitle>
                        <SheetDescription>
                            Preencha os dados e use as ferramentas do mapa para desenhar o polígono da área.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 flex-1 pr-6 overflow-y-auto">
                        <div className="md:col-span-1 space-y-4">
                             <div>
                                <Label htmlFor="name">Nome do Talhão</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Talhão Sede"/>
                            </div>
                            <div>
                                <Label htmlFor="culture">Cultura Plantada</Label>
                                <Input id="culture" value={culture} onChange={(e) => setCulture(e.target.value)} required placeholder="Ex: Soja, Milho"/>
                            </div>
                             <div>
                                <Label>Área Calculada (ha)</Label>
                                <Input value={area > 0 ? area.toFixed(4) : 'Desenhe no mapa'} readOnly disabled />
                            </div>
                        </div>
                        <div className="md:col-span-2 h-[400px] md:h-full w-full rounded-lg overflow-hidden">
                           <Suspense fallback={<Skeleton className="h-full w-full" />}>
                             <LeafletMap onDrawComplete={handleDrawComplete} initialBounds={mapBounds} />
                           </Suspense>
                        </div>
                    </div>
                    <SheetFooter className="pt-4 mt-auto">
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
      </div>
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o talhão.
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
