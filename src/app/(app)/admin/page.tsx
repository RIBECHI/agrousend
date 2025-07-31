
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, MoreVertical, ShieldAlert, ShieldCheck } from 'lucide-react';
import { UserProfile } from '@/contexts/auth-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { capitalizeName } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const usersCollection = collection(firestore, 'users');
    const q = query(usersCollection);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(fetchedUsers);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar usuários: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar usuários.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const toggleUserBlock = async (targetUser: UserProfile) => {
    const newStatus = !targetUser.isBlocked;
    const userDocRef = doc(firestore, 'users', targetUser.uid);

    try {
      await updateDoc(userDocRef, {
        isBlocked: newStatus,
      });
      toast({
        title: "Sucesso!",
        description: `Usuário ${targetUser.displayName} foi ${newStatus ? 'bloqueado' : 'desbloqueado'}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status do usuário: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível alterar o status do usuário.',
      });
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
        case 'admin': return 'Admin';
        case 'producer': return 'Produtor';
        case 'supplier': return 'Fornecedor';
        case 'service_provider': return 'Serviços';
        default: return 'Usuário';
    }
  }

  return (
    <Tabs defaultValue="users">
      <TabsList>
        <TabsTrigger value="users">Gerenciamento de Usuários</TabsTrigger>
        <TabsTrigger value="content" disabled>Gerenciamento de Conteúdo</TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              Gerencie todos os usuários cadastrados na plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">
                <Loader className="mx-auto h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo de Conta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.uid}>
                      <TableCell className="font-medium">{capitalizeName(u.displayName)}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{getRoleDisplayName(u.role)}</TableCell>
                      <TableCell>
                        <Badge variant={u.isBlocked ? "destructive" : "default"}>
                          {u.isBlocked ? 'Bloqueado' : 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         {user?.uid !== u.uid && u.role !== 'admin' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => toggleUserBlock(u)} className={u.isBlocked ? 'text-green-600 focus:text-green-600' : 'text-destructive focus:text-destructive'}>
                                        {u.isBlocked ? (
                                            <> <ShieldCheck className="mr-2 h-4 w-4" /> Desbloquear </>
                                        ) : (
                                            <> <ShieldAlert className="mr-2 h-4 w-4" /> Bloquear </>
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="content">
         <Card>
          <CardHeader>
            <CardTitle>Conteúdo</CardTitle>
            <CardDescription>
              Modere o conteúdo gerado por usuários (em breve).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Funcionalidade em desenvolvimento.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
