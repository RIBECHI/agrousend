
'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader, Shield } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.replace('/feed');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-2 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Painel do Administrador</h1>
        </div>
        {children}
    </div>
  );
}
