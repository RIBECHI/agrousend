
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { auth, firestore, storage, messaging } from '@/lib/firebase';
import { deleteUser, updateProfile } from 'firebase/auth';
import { doc, deleteDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, AlertTriangle, User, ShieldAlert, Pencil, Camera, Bell } from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import type { UserRole } from '@/contexts/auth-context';
import { getToken } from 'firebase/messaging';
import { capitalizeName } from '@/lib/utils';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State for forms
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivatingNotifications, setIsActivatingNotifications] = useState(false);

  // Profile editing state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [role, setRole] = useState<UserRole | undefined>(user?.role);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.photoURL || null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setRole(user.role);
      setImagePreview(user.photoURL || null);
    }
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const preview = await toBase64(file);
      setImagePreview(preview);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      let photoURL = user.photoURL;

      if (imageFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        const base64String = await toBase64(imageFile);
        await uploadString(storageRef, base64String, 'data_url');
        photoURL = await getDownloadURL(storageRef);
      }

      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName,
          photoURL,
        });
      }


      // Update/Create Firestore document
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName,
        email: user.email,
        role,
        photoURL,
      }, { merge: true });

      toast({ title: 'Perfil atualizado com sucesso!' });
      setIsSheetOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar as alterações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (!user || !messaging) {
        toast({
            variant: "destructive",
            title: "Erro",
            description: "O serviço de mensagens não está disponível."
        })
        return;
    };

    setIsActivatingNotifications(true);
    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
            if (currentToken) {
                const userDocRef = doc(firestore, 'users', user.uid);
                await updateDoc(userDocRef, {
                    fcmTokens: arrayUnion(currentToken)
                });
                toast({
                    title: 'Notificações Ativadas!',
                    description: 'Você receberá notificações neste dispositivo.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Não foi possível obter o token',
                    description: 'Tente novamente mais tarde.',
                });
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Permissão Negada',
                description: 'Você precisa permitir notificações nas configurações do seu navegador.',
            });
        }
    } catch (error) {
        console.error('Erro ao solicitar permissão de notificação:', error);
        toast({
            variant: 'destructive',
            title: 'Erro de Notificação',
            description: 'Ocorreu um erro ao tentar ativar as notificações. Verifique o console.',
        });
    } finally {
        setIsActivatingNotifications(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !auth.currentUser) return;

    setIsDeleting(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await deleteDoc(userDocRef);
      await deleteUser(auth.currentUser);

      toast({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída com sucesso. Sentiremos sua falta!',
      });
      
      router.push('/');

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
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.photoURL || undefined} alt="User Avatar" />
                <AvatarFallback className="text-4xl">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <CardTitle className="text-3xl">{capitalizeName(user.displayName)}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <CardDescription className="capitalize mt-1 font-medium text-primary">
                    {user.role === 'service_provider' ? 'Prestador de Serviço' : user.role}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Perfil
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <form onSubmit={handleProfileUpdate} className="flex flex-col h-full">
                  <SheetHeader>
                    <SheetTitle>Editar Perfil</SheetTitle>
                    <SheetDescription>
                      Atualize suas informações. As alterações serão visíveis para outros usuários.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-6 py-6 flex-1 pr-6 overflow-y-auto">
                    
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-32 w-32">
                                <AvatarImage src={imagePreview || undefined} />
                                <AvatarFallback className="text-5xl">{displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                                <Camera className="h-5 w-5" />
                                <input id="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                    </div>

                    <div>
                      <Label htmlFor="displayName">Nome Completo</Label>
                      <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                    </div>
                     <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user.email || ''} disabled />
                       <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado.</p>
                    </div>
                    <div>
                      <Label>Tipo de Conta</Label>
                       <RadioGroup
                            value={role}
                            onValueChange={(value: UserRole) => setRole(value)}
                            className="grid grid-cols-3 gap-2 mt-2"
                        >
                            <div>
                                <RadioGroupItem value="producer" id="producer" className="peer sr-only" />
                                <Label htmlFor="producer" className="text-center block rounded-md border-2 border-muted bg-popover p-3 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    Produtor
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="supplier" id="supplier" className="peer sr-only" />
                                <Label htmlFor="supplier" className="text-center block rounded-md border-2 border-muted bg-popover p-3 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    Fornecedor
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="service_provider" id="service_provider" className="peer sr-only" />
                                <Label htmlFor="service_provider" className="text-center block rounded-md border-2 border-muted bg-popover p-3 text-sm hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                    Serviços
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                  </div>
                  <SheetFooter className="pt-4 mt-auto">
                    <SheetClose asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </SheetClose>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Salvar Alterações'}
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              <CardTitle>Notificações</CardTitle>
            </div>
            <CardDescription>
              Receba alertas de novas mensagens e outras atividades importantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRequestNotificationPermission}
              disabled={isActivatingNotifications}
            >
              {isActivatingNotifications ? (
                <Loader className="mr-2 animate-spin" />
              ) : null}
              Ativar Notificações
            </Button>
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
