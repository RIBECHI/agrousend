
'use client';

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from '@/components/layout/main-nav';
import { UserNav } from '@/components/layout/user-nav';
import { Leaf } from 'lucide-react';
import React, 'useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <Leaf className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Render nothing while redirecting
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <div className="flex flex-col h-full">
            <div className="p-4 flex items-center gap-2">
                <Leaf className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">AgroUs</h1>
            </div>
            <MainNav />
            </div>
        </Sidebar>
        <SidebarInset>
          <div className="flex-1 flex flex-col h-full">
              <header className="flex h-16 items-center justify-between border-b px-6 bg-card">
              <SidebarTrigger />
              <UserNav />
              </header>
              <main className="flex-1 overflow-y-auto p-6">
                  {children}
              </main>
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
