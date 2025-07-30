
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, addDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, Calendar as CalendarIcon, MapPin, Plus, Minus, Wheat } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface Harvest {
  id: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  userId: string;
}

interface FarmPlot {
  id: string;
  name:string;
  area: number;
  culture: string;
}

interface HarvestPlot {
    id: string; // This will be the ID of the document in the harvestPlots subcollection
    plotId: string; // This will be the original ID from the farmPlots collection
    name: string;
    area: number;
    culture: string;
    userId: string;
}

export default function ManageHarvestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id: harvestId } = useParams() as { id: string };
  const { toast } = useToast();

  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [allPlots, setAllPlots] = useState<FarmPlot[]>([]);
  const [harvestPlots, setHarvestPlots] = useState<HarvestPlot[]>([]);
  
  const [isLoadingHarvest, setIsLoadingHarvest] = useState(true);
  const [isLoadingPlots, setIsLoadingPlots] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);


  // Fetch Harvest Details
  useEffect(() => {
    if (typeof harvestId !== 'string') return;
    const docRef = doc(firestore, 'harvests', harvestId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Harvest, 'id'>;
        // Ensure user has permission
        if (data.userId === user?.uid) {
            setHarvest({ id: docSnap.id, ...data });
        } else {
             toast({ variant: 'destructive', title: 'Acesso Negado' });
             router.push('/harvests');
        }
      } else {
        toast({ variant: 'destructive', title: 'Safra não encontrada' });
        router.push('/harvests');
      }
      setIsLoadingHarvest(false);
    });

    return () => unsubscribe();
  }, [harvestId, router, toast, user?.uid]);
  
  // Fetch All User's Farm Plots
  useEffect(() => {
    if (!user) return;
    const plotsCollection = collection(firestore, 'farmPlots');
    const q = query(plotsCollection, where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPlots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FarmPlot));
        setAllPlots(fetchedPlots);
        setIsLoadingPlots(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Fetch Plots associated with this Harvest
  useEffect(() => {
    if (!harvestId || typeof harvestId !== 'string' || !user) return;
    const harvestPlotsCollection = collection(firestore, 'harvests', harvestId, 'harvestPlots');
    // We can filter by userId here for security and efficiency, matching the Firestore rules.
    const q = query(harvestPlotsCollection, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPlots = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        } as HarvestPlot));
        setHarvestPlots(fetchedPlots);
    }, (error) => {
        console.error("Erro ao buscar talhões da safra: ", error);
        toast({ variant: "destructive", title: "Erro ao carregar talhões da safra", description: "Verifique suas permissões no Firestore."})
    });

    return () => unsubscribe();
  }, [harvestId, user, toast]);

  const handleAddPlotToHarvest = async (plot: FarmPlot) => {
    if (!harvestId || typeof harvestId !== 'string' || !user) return;
    setIsProcessing(true);
    try {
        const harvestPlotsCollection = collection(firestore, 'harvests', harvestId, 'harvestPlots');
        await addDoc(harvestPlotsCollection, {
            plotId: plot.id,
            name: plot.name,
            area: plot.area,
            culture: plot.culture,
            userId: user.uid // **CORREÇÃO: Adicionando o userId**
        });
        toast({ title: `"${plot.name}" adicionado à safra.`})
    } catch (error) {
        console.error("Erro ao adicionar talhão: ", error);
        toast({ variant: 'destructive', title: 'Erro ao adicionar talhão.' });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleRemovePlotFromHarvest = async (harvestPlot: HarvestPlot) => {
     if (!harvestId || typeof harvestId !== 'string') return;
     setIsProcessing(true);
     try {
        const docRef = doc(firestore, 'harvests', harvestId, 'harvestPlots', harvestPlot.id);
        await deleteDoc(docRef);
        toast({ title: `"${harvestPlot.name}" removido da safra.`});
     } catch (error) {
        console.error("Erro ao remover talhão: ", error);
        toast({ variant: 'destructive', title: 'Erro ao remover talhão.' });
    } finally {
        setIsProcessing(false);
    }
  }
  
  const availablePlots = useMemo(() => {
    const harvestPlotIds = new Set(harvestPlots.map(p => p.plotId));
    return allPlots.filter(p => !harvestPlotIds.has(p.id));
  }, [allPlots, harvestPlots]);

  const totalAreaInHarvest = useMemo(() => {
    return harvestPlots.reduce((acc, plot) => acc + plot.area, 0);
  }, [harvestPlots]);


  if (isLoadingHarvest) {
    return (
      <div className="text-center py-10">
        <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando safra...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/harvests')}>
        <ArrowLeft className="mr-2" />
        Voltar para todas as safras
      </Button>
      
      <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-3 text-2xl">
                <Wheat />
                {harvest?.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 pt-2">
                <CalendarIcon className="h-4 w-4" />
                {harvest ? `${format(harvest.startDate.toDate(), "dd 'de' MMM, yyyy", { locale: ptBR })} à ${format(harvest.endDate.toDate(), "dd 'de' MMM, yyyy", { locale: ptBR })}` : '...'}
            </CardDescription>
            <CardDescription>
                Área total na safra: <strong>{totalAreaInHarvest.toFixed(2)} hectares</strong>
            </CardDescription>
          </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Talhões na Safra</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoadingPlots ? <p>Carregando...</p> : (
                    <ul className="space-y-2">
                        {harvestPlots.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum talhão adicionado.</p>}
                        {harvestPlots.map(plot => (
                            <li key={plot.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-semibold">{plot.name}</p>
                                    <p className="text-sm text-muted-foreground">{plot.culture} - {plot.area.toFixed(2)} ha</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleRemovePlotFromHarvest(plot)} disabled={isProcessing}>
                                    <Minus className="h-4 w-4 mr-1"/>
                                    Remover
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Talhões Disponíveis</CardTitle>
                <CardDescription>Adicione seus talhões cadastrados a esta safra.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoadingPlots ? <p>Carregando...</p> : (
                    <ul className="space-y-2">
                        {availablePlots.length === 0 && <p className="text-muted-foreground text-center py-4">Todos os seus talhões já estão nesta safra. <Link href="/farms" className="underline">Cadastre mais talhões</Link>.</p>}
                        {availablePlots.map(plot => (
                            <li key={plot.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-semibold">{plot.name}</p>
                                    <p className="text-sm text-muted-foreground">{plot.culture} - {plot.area.toFixed(2)} ha</p>
                                </div>
                                <Button size="sm" onClick={() => handleAddPlotToHarvest(plot)} disabled={isProcessing}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Adicionar
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
