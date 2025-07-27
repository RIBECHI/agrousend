
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function FeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="w-full max-w-2xl space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Se não houver usuário, mas a página for renderizada (cenário de fallback)
  // mostramos os botões de login e cadastro.
  if (!user) {
    return (
        <div className="flex-1 flex items-center justify-center bg-secondary p-4 h-full">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Bem-vindo ao AgroUs!</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p>Para ver o feed e interagir com a comunidade, você precisa estar conectado.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button onClick={() => router.push('/')}>Fazer Login</Button>
                        <Button variant="outline" onClick={() => router.push('/signup')}>Cadastre-se</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
            {/* O conteúdo para usuários logados será adicionado aqui */}
            <h1 className="text-2xl font-bold">Feed</h1>
            <p>Conteúdo do feed para usuários autenticados.</p>
        </div>
    </div>
  );
}
