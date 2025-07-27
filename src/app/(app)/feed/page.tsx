
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FeedPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Carregando...</div>
    }

    // This case is handled by the layout, but as a fallback.
    if (!user) {
        return (
             <div className="flex items-center justify-center h-full">
                <Card className="w-full max-w-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl">Acesso Negado</CardTitle>
                        <CardDescription>
                            Você precisa estar logado para ver o feed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button asChild>
                            <Link href="/">Fazer Login</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/signup">Cadastre-se</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

  return (
    <div>
        <Card>
            <CardHeader>
                <CardTitle>Bem-vindo ao AgroUs, {user.displayName || 'Produtor'}!</CardTitle>
                <CardDescription>Seu feed de publicações aparecerá aqui em breve.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Em construção...</p>
            </CardContent>
        </Card>
    </div>
  );
}
