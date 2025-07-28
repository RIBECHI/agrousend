
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/feed');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar',
        description: 'Verifique suas credenciais e tente novamente.',
      });
      setIsLoading(false);
    }
  };

  const LoginForm = (
    <form onSubmit={handleSignIn}>
        <div className="grid gap-4">
            <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
            />
            </div>
            <div className="grid gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
            />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
        </div>
    </form>
  )

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center mb-4">
              <Leaf className="h-10 w-10 text-primary" />
              <span className="ml-2 text-3xl font-bold text-primary">AgroUs</span>
            </div>
          <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
          <CardDescription>Bem-vindo de volta! Entre com suas credenciais.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="producer" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="producer">Produtor</TabsTrigger>
                    <TabsTrigger value="supplier">Fornecedor</TabsTrigger>
                    <TabsTrigger value="service">Serviços</TabsTrigger>
                </TabsList>
                <TabsContent value="producer" className="pt-4">
                    {LoginForm}
                </TabsContent>
                <TabsContent value="supplier" className="pt-4">
                    {LoginForm}
                </TabsContent>
                <TabsContent value="service" className="pt-4">
                    {LoginForm}
                </TabsContent>
            </Tabs>

           <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/signup" className="underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
