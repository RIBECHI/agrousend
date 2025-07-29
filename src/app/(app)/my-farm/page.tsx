
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Loader, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import GoogleMapComponent, { FarmPlot } from '@/components/google-map-component';

export default function MyFarmPage() {
  const { user } = useAuth();
  const [plots, setPlots] = useState<FarmPlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando sua fazenda...</p>
      </div>
    );
  }

  if (plots.length === 0) {
    return (
      <Card className="text-center py-10">
        <CardHeader>
          <CardTitle>Nenhum talhão encontrado</CardTitle>
          <CardDescription>
            Você ainda não cadastrou nenhum talhão. Vá para a Gestão de Talhões para começar.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] w-full">
        <GoogleMapComponent plots={plots} />
    </div>
  );
}
