
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs, Timestamp, collectionGroup } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import { Loader, Wheat, Map, ChevronsRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Harvest {
  id: string;
  name: string;
  startDate: Timestamp;
}

interface HarvestPlot {
    id: string; 
    plotId: string;
    name: string;
    culture: string;
}

interface HarvestWithPlots extends Harvest {
    plots: HarvestPlot[];
}

interface FarmPlot {
  id: string;
  name: string;
  area: number;
  culture: string;
  userId: string;
}

export default function PlanningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [harvestsWithPlots, setHarvestsWithPlots] = useState<HarvestWithPlots[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    }

    const harvestsCollection = collection(firestore, 'harvests');
    const harvestsQuery = query(harvestsCollection, where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(harvestsQuery, async (harvestsSnapshot) => {
        setIsLoading(true);
        try {
            const harvestsData = harvestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Harvest));

            if (harvestsData.length === 0) {
                setHarvestsWithPlots([]);
                setIsLoading(false);
                return;
            }
            
            const harvestPromises = harvestsData.map(async (harvest) => {
                const harvestPlotsCollection = collection(firestore, `harvests/${harvest.id}/harvestPlots`);
                const plotsSnapshot = await getDocs(query(harvestPlotsCollection, where('userId', '==', user.uid)));
                const plots = plotsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as HarvestPlot));

                return {
                    ...harvest,
                    plots: plots,
                };
            });

            let combinedData = await Promise.all(harvestPromises);

            combinedData.sort((a, b) => b.startDate.toMillis() - a.startDate.toMillis());

            setHarvestsWithPlots(combinedData);

        } catch (error) {
            console.error("Error fetching planning data: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao carregar dados",
                description: "Ocorreu um erro ao buscar os dados do planejamento."
            });
        } finally {
            setIsLoading(false);
        }
    });

    return () => unsubscribe();
    
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando safras e talhões...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Wheat className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-primary">Planejamento Agrícola</h1>
      </div>
       <CardDescription>
        Selecione uma safra e um talhão para ver e adicionar operações como plantio, pulverizações e colheita.
      </CardDescription>

      {harvestsWithPlots.length === 0 ? (
         <Card className="text-center py-10 border-dashed">
            <CardHeader>
                <CardTitle>Nenhuma safra encontrada</CardTitle>
                <CardDescription>
                    Para iniciar o planejamento, primeiro <Link href="/harvests" className="underline font-semibold">cadastre uma safra</Link> e <Link href={`/harvests`} className="underline font-semibold">adicione talhões</Link> a ela.
                </CardDescription>
            </CardHeader>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-4" defaultValue={harvestsWithPlots[0]?.id}>
          {harvestsWithPlots.map((harvest) => (
            <AccordionItem value={harvest.id} key={harvest.id} className="bg-card border rounded-lg">
              <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-3">
                    <Wheat />
                    {harvest.name}
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0">
                {harvest.plots.length > 0 ? (
                    <ul className="space-y-3">
                        {harvest.plots.map(plot => (
                            <li key={plot.plotId}>
                                <Link href={`/planning/${harvest.id}/${plot.plotId}`}>
                                    <div className="flex items-center justify-between p-4 rounded-md bg-muted hover:bg-secondary/80 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Map className="text-primary"/>
                                            <div>
                                                <p className="font-semibold">{plot.name}</p>
                                                <p className="text-sm text-muted-foreground">{plot.culture}</p>
                                            </div>
                                        </div>
                                        <ChevronsRight />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-4">
                        Nenhum talhão associado a esta safra. <Link href={`/harvests/${harvest.id}`} className="underline font-semibold">Gerencie a safra para adicionar talhões.</Link>
                    </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
