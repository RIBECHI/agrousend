
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '@/lib/firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, AlertTriangle, User, ShieldAlert } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      // 1. Delete user document from Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await deleteDoc(userDocRef);

      // 2. Delete user from Firebase Authentication
      // This is a security-sensitive operation and might require recent login.
      // If it fails, we guide the user to re-authenticate.
      await deleteUser(user);

      toast({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída com sucesso. Sentiremos sua falta!',
      });
      
      router.push('/'); // Redirect to login page

    } catch (error: any) {
      console.error("Erro ao excluir conta: ", error);
      let description = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
      if (error.code === 'auth/requires-recent-login') {
        description = 'Esta é uma operação sensível. Por favor, faça login novamente e tente excluir sua conta mais uma vez.';
      }
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir conta',
        description: description,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">
        <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando perfil...</p>
    </div>;
  }

  if (!user) {
    // This case should be handled by the layout, but as a fallback:
    router.push('/');
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL || undefined} alt="User Avatar" />
                <AvatarFallback className="text-3xl">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-2xl">{user.displayName || 'Usuário'}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Placeholder for future profile editing functionality */}
            <Button variant="outline" disabled>Editar Perfil (Em breve)</Button>
          </CardContent>
        </Card>

        <Card className="border-destructive">
            <CardHeader>
                <div className="flex items-center gap-3 text-destructive">
                    <ShieldAlert className="h-6 w-6" />
                    <CardTitle>Zona de Perigo</CardTitle>
                </div>
                <CardDescription>
                    As ações nesta área são permanentes e não podem ser desfeitas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">Excluir sua conta</p>
                        <p className="text-sm text-muted-foreground">Todo o seu conteúdo será permanentemente removido.</p>
                    </div>
                    <Button variant="destructive" onClick={() => setShowDeleteAlert(true)} disabled={isDeleting}>
                        {isDeleting ? <Loader className="mr-2 animate-spin"/> : <AlertTriangle className="mr-2 h-4 w-4" />}
                        Excluir Conta
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>

       <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá todos os seus dados de nossos servidores.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                >
                    {isDeleting ? (
                        <> <Loader className="mr-2 h-4 w-4 animate-spin"/> Excluindo... </>
                    ) : (
                        "Eu entendo, quero excluir minha conta"
                    )}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

