
import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from '@/components/layout/main-nav';
import { UserNav } from '@/components/layout/user-nav';
import { Toaster } from '@/components/ui/toaster';
import { Leaf } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export const metadata: Metadata = {
  title: 'AgroUs - A Rede Social do Agro',
  description: 'Conectando o campo, cultivando o futuro.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Inter:wght@400;500;700&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <div className="flex min-h-screen">
            <Sidebar className="bg-card border-r">
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center px-6">
                  <Leaf className="h-8 w-8 text-primary" />
                  <span className="ml-2 text-xl font-bold text-primary">AgroUs</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <MainNav />
                </div>
              </div>
            </Sidebar>
            <SidebarInset className="flex-1 flex flex-col">
              <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
                 <div className="flex items-center gap-4">
                  <SidebarTrigger className="md:hidden" />
                  <h1 className="text-xl font-semibold">Feed</h1>
                 </div>
                <UserNav />
              </header>
              <main className="flex-1 overflow-y-auto p-4 md:p-6">
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
