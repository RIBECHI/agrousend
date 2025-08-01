
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ping } from '@/ai/flows/ping-flow';
import { Loader, Wifi } from 'lucide-react';

export default function SettingsPage() {
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePingTest = async () => {
    setIsLoading(true);
    setLatency(null);
    setError(null);
    
    try {
      const startTime = Date.now();
      await ping({ timestamp: startTime });
      const endTime = Date.now();
      setLatency(endTime - startTime);
    } catch (err) {
      console.error(err);
      setError('O teste de ping falhou. Verifique a conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const getLatencyColor = () => {
    if (!latency) return 'text-muted-foreground';
    if (latency < 200) return 'text-green-500';
    if (latency < 500) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Wifi className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold text-primary">Diagnóstico de Rede</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Teste de Latência</CardTitle>
          <CardDescription>
            Clique no botão para medir o tempo de resposta (latência) entre seu navegador e o servidor. Isso ajuda a diagnosticar problemas de lentidão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handlePingTest} disabled={isLoading}>
            {isLoading ? <Loader className="mr-2 animate-spin" /> : <Wifi className="mr-2" />}
            {isLoading ? 'Testando...' : 'Iniciar Teste de Conexão'}
          </Button>
          
          {latency !== null && (
            <div className="pt-4">
              <p className="text-lg">
                Latência do Servidor: 
                <span className={`font-bold text-2xl ml-2 ${getLatencyColor()}`}>{latency} ms</span>
              </p>
               <div className="mt-2 text-sm text-muted-foreground">
                    <p><span className="text-green-500 font-semibold">&bull; Excelente:</span> Menos de 200ms</p>
                    <p><span className="text-yellow-500 font-semibold">&bull; Bom:</span> 200ms - 500ms</p>
                    <p><span className="text-red-500 font-semibold">&bull; Lento:</span> Acima de 500ms (Pode causar lentidão nas respostas)</p>
                </div>
            </div>
          )}

          {error && <p className="text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
