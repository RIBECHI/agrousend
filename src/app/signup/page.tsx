
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type UserRole = 'producer' | 'supplier' | 'service_provider';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('producer');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!role) {
        toast({
            variant: 'destructive',
            title: 'Campo obrigatório',
            description: 'Por favor, selecione um tipo de conta.',
        });
        return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Primeiro, atualiza o perfil de autenticação
      await updateProfile(user, {
        displayName: name,
      });

      // Em seguida, salva os dados no Firestore, garantindo que displayName e email não sejam nulos
      await setDoc(doc(firestore, "users", user.uid), {
        uid: user.uid,
        displayName: name, // Usando a variável 'name' diretamente
        email: user.email, // Usando o email do objeto user
        photoURL: user.photoURL,
        role: role,
        isBlocked: false, // Define isBlocked como false por padrão
      });

      router.push('/feed');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conta',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center mb-4">
              <Leaf className="h-10 w-10 text-primary" />
              <span className="ml-2 text-3xl font-bold text-primary">AgroUs</span>
            </div>
          <CardTitle className="text-2xl">Crie sua conta</CardTitle>
          <CardDescription>Junte-se à maior rede social do agronegócio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="grid gap-4">
               <div className="grid gap-2">
                <Label>Tipo de Conta</Label>
                <RadioGroup 
                    defaultValue="producer" 
                    className="grid grid-cols-3 gap-4" 
                    value={role} 
                    onValueChange={(value: UserRole) => setRole(value)}
                >
                    <div>
                        <RadioGroupItem value="producer" id="producer" className="peer sr-only" />
                        <Label htmlFor="producer" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Produtor
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="supplier" id="supplier" className="peer sr-only" />
                        <Label htmlFor="supplier" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Fornecedor
                        </Label>
                    </div>
                     <div>
                        <RadioGroupItem value="service_provider" id="service_provider" className="peer sr-only" />
                        <Label htmlFor="service_provider" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Serviços
                        </Label>
                    </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="João da Silva"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
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
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Criando conta...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
           <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link href="/" className="underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
