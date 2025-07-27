
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FeedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally be handled by a protected route layout,
    // but as a fallback, we'll show buttons to log in or sign up.
    return (
        <div className="flex-1 flex items-center justify-center bg-secondary">
            <Card className="w-[380px] text-center">
                <CardHeader>
                    <CardTitle>Bem-vindo ao AgroUs!</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p>Para ver o feed, você precisa estar conectado.</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => router.push('/')}>Fazer Login</Button>
                        <Button variant="outline" onClick={() => router.push('/signup')}>Cadastre-se</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Content for logged-in users will go here */}
                <h1 className="text-2xl font-bold">Feed</h1>
                <p>Conteúdo do feed para usuários autenticados.</p>
            </div>
        </main>
    </div>
  );
}
