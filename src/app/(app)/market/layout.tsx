
'use client';

import {
  Home,
  MessageSquare,
  Search,
  ShoppingCart,
  Store,
  PlusCircle,
  Tag,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useCallback } from 'react';
import { Loader, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';


const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const navItems = [
  { href: '/market', label: 'Início', icon: Store },
  { href: '/market/search', label: 'Buscar', icon: Search },
  { href: '#', label: 'Vender', icon: PlusCircle, isSheetTrigger: true },
  { href: '/market/selling', label: 'Vendas', icon: Package },
  { href: '/market/buying', label: 'Compras', icon: ShoppingCart },
];

const categories = ['Tratores', 'Sementes', 'Fertilizantes', 'Peças', 'Serviços', 'Outros'];

const CreateListingSheet = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const removeImage = useCallback(() => {
        setImageFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
    }, [imagePreview]);

    const resetForm = useCallback(() => {
        setTitle('');
        setDescription('');
        setPrice('');
        setCategory('');
        setLocation('');
        removeImage();
        setIsSubmitting(false);
    }, [removeImage]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    variant: "destructive",
                    title: "Imagem muito grande",
                    description: "Por favor, selecione uma imagem com menos de 2MB.",
                });
                return;
            }
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title || !price || !category || !location || !imageFile) {
            toast({
                variant: "destructive",
                title: "Campos obrigatórios",
                description: "Todos os campos, incluindo a imagem, são obrigatórios.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const listingData: any = {
                userId: user.uid,
                authorName: user.displayName,
                title,
                description,
                price: parseFloat(price),
                category,
                location,
                createdAt: serverTimestamp(),
                imageUrl: await toBase64(imageFile),
            };

            await addDoc(collection(firestore, 'listings'), listingData);

            toast({
                title: "Sucesso!",
                description: "Anúncio publicado com sucesso.",
            });

            resetForm();
            setIsSheetOpen(false);

        } catch (error) {
            console.error("Erro ao criar anúncio: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao publicar",
                description: "Não foi possível criar o anúncio.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if (!open) resetForm();
            setIsSheetOpen(open);
        }}>
            <SheetTrigger asChild>
                <button
                    className={cn(
                        'flex flex-col items-center justify-center text-xs gap-1 transition-colors w-full h-full text-muted-foreground hover:text-primary'
                    )}
                >
                    <PlusCircle className="h-6 w-6" />
                    <span>Vender</span>
                </button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Criar Novo Anúncio</SheetTitle>
                    <SheetDescription>
                    Preencha as informações para vender um item no marketplace.
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                    <div className="space-y-1">
                        <Label>Imagem do Anúncio</Label>
                        {imagePreview ? (
                            <div className="relative">
                                <Image src={imagePreview} alt="Preview do anúncio" width={200} height={200} className="rounded-md object-cover w-full aspect-square" />
                                <Button variant="destructive" size="sm" onClick={removeImage} className="absolute top-2 right-2">Remover</Button>
                            </div>
                        ) : (
                            <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-gray-100/25">
                                <div className="text-center">
                                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark dark:bg-transparent">
                                        <span>Selecione uma imagem</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" required/>
                                    </label>
                                    <p className="pl-1 dark:text-gray-400">ou arraste e solte</p>
                                    </div>
                                    <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG, GIF até 2MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="title">Título</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Trator John Deere 6110J" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="price">Preço (R$)</Label>
                            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="Ex: 250000" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="category">Categoria</Label>
                            <Select value={category} onValueChange={setCategory} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="location">Localização</Label>
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="Ex: Rondonópolis, MT" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Fale mais sobre o item, condição, etc."/>
                    </div>
                    
                </div>
                <SheetFooter className="pt-4 mt-auto">
                    <SheetClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                    </SheetClose>
                    <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Publicando...</> : 'Publicar Anúncio'}
                    </Button>
                </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen bg-background">
        <main className="flex-1 overflow-y-auto pb-20">
            {children}
        </main>
        
        <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur-sm">
            <nav className="flex items-center justify-around h-16">
            {navItems.map((item) => {
                if (item.isSheetTrigger) {
                    return <CreateListingSheet key={item.href} />;
                }
                const isActive = pathname === item.href;
                return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                    'flex flex-col items-center justify-center text-xs gap-1 transition-colors w-full h-full',
                    isActive
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-primary'
                    )}
                >
                    <item.icon className="h-6 w-6" />
                    <span>{item.label}</span>
                </Link>
                );
            })}
            </nav>
        </footer>
    </div>
  );
}

