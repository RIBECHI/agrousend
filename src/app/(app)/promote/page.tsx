
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader, ShieldCheck } from 'lucide-react';

const ADMIN_EMAIL = 'ribechi@gmail.com';

export default function PromotePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handlePromote = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Você não está logado.' });
      return;
    }

    if (user.email !== ADMIN_EMAIL) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Esta função é reservada para o administrador principal.' });
      return;
    }

    setIsLoading(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, { role: 'admin' });
      toast({ title: 'Sucesso!', description: 'Você agora é um administrador. Atualize a página para ver o painel de admin.' });
    } catch (error) {
      console.error("Erro ao promover para admin:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar suas permissões.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Promover para Administrador</CardTitle>
          <CardDescription>
            Esta é uma ação única para configurar a conta de administrador principal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Logado como: <strong>{user?.email}</strong></p>
          <Button 
            onClick={handlePromote} 
            disabled={isLoading || user?.email !== ADMIN_EMAIL}
            className="w-full"
          >
            {isLoading ? <Loader className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
            Tornar-se Admin
          </Button>
          {user?.email !== ADMIN_EMAIL && (
            <p className="text-destructive text-sm mt-4 text-center">
              Você está logado com uma conta que não pode ser promovida.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
