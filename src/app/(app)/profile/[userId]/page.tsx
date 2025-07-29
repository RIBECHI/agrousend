
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, User, ArrowLeft, MessageSquare } from 'lucide-react';
import type { UserProfile, UserRole } from '@/contexts/auth-context';

const getRoleDisplayName = (role?: UserRole) => {
    switch (role) {
        case 'producer':
            return 'Produtor';
        case 'supplier':
            return 'Fornecedor';
        case 'service_provider':
            return 'Prestador de Serviço';
        default:
            return 'Usuário';
    }
}

export default function PublicProfilePage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { userId } = params;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof userId !== 'string') return;
    
    // Redirect to own profile page if the userId is the current user's
    if (currentUser?.uid === userId) {
        router.replace('/profile');
        return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      const userDocRef = doc(firestore, 'users', userId);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        toast({
          variant: 'destructive',
          title: 'Usuário não encontrado',
        });
        router.push('/feed');
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [userId, currentUser, router, toast]);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return null; // or a more descriptive "Not Found" component
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.photoURL || undefined} alt="User Avatar" />
              <AvatarFallback className="text-4xl">
                {profile.displayName?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <CardTitle className="text-3xl">{profile.displayName || 'Usuário'}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
              <CardDescription className="capitalize mt-1 font-medium text-primary">
                {getRoleDisplayName(profile.role)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Button onClick={() => router.push('/chat')}>
                <MessageSquare className="mr-2" />
                Enviar Mensagem
            </Button>
        </CardContent>
      </Card>

      {/* Placeholder for future content like user's posts, etc. */}
      <Card>
        <CardHeader>
            <CardTitle>Atividade</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">Atividade do usuário aparecerá aqui em breve.</p>
        </CardContent>
      </Card>
    </div>
  );
}
