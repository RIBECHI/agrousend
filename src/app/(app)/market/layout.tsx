
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
import { useState, useCallback, useEffect } from 'react';
import { Loader, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { brazilianStates } from '@/lib/brazilian-locations';


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
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const MAX_IMAGES = 5;

    // Location state
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [cities, setCities] = useState<string[]>([]);

    useEffect(() => {
        if (selectedState) {
            const stateData = brazilianStates.find(s => s.sigla === selectedState);
            setCities(stateData ? stateData.cidades : []);
            setSelectedCity(''); // Reset city when state changes
        } else {
            setCities([]);
        }
    }, [selectedState]);

    const removeImage = useCallback((index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    }, []);

    const resetForm = useCallback(() => {
        setTitle('');
        setDescription('');
        setPrice('');
        setCategory('');
        setSelectedState('');
        setSelectedCity('');
        setCities([]);
        setImageFiles([]);
        setImagePreviews([]);
        setIsSubmitting(false);
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const totalImages = imageFiles.length + files.length;

            if (totalImages > MAX_IMAGES) {
                toast({
                    variant: "destructive",
                    title: `Limite de ${MAX_IMAGES} imagens excedido`,
                    description: `Você só pode enviar até ${MAX_IMAGES} imagens por anúncio.`,
                });
                return;
            }

            const newFiles = [...imageFiles, ...files];
            setImageFiles(newFiles);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title || !price || !category || !selectedState || !selectedCity || imageFiles.length === 0) {
            toast({
                variant: "destructive",
                title: "Campos obrigatórios",
                description: "Todos os campos e pelo menos uma imagem são obrigatórios.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const imageUrls = await Promise.all(
                imageFiles.map(file => toBase64(file))
            );

            const listingData = {
                userId: user.uid,
                authorName: user.displayName,
                title,
                description,
                price: parseFloat(price),
                category,
                location: `${selectedCity}, ${selectedState}`,
                createdAt: serverTimestamp(),
                imageUrls,
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
                    <div className="space-y-2">
                        <Label>Imagens do Anúncio (até {MAX_IMAGES})</Label>
                         <div className="grid grid-cols-3 gap-2">
                            {imagePreviews.map((src, index) => (
                                <div key={index} className="relative aspect-square">
                                    <Image src={src} alt={`Preview ${index + 1}`} fill className="rounded-md object-cover" />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6"
                                        onClick={() => removeImage(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                             {imageFiles.length < MAX_IMAGES && (
                                <div className="flex items-center justify-center aspect-square rounded-lg border border-dashed border-gray-900/25 dark:border-gray-100/25">
                                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center text-center cursor-pointer text-gray-600 hover:text-primary">
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                        <span className="mt-2 text-sm">Adicionar</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple/>
                                    </label>
                                </div>
                             )}
                        </div>
                        <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG, GIF até 2MB cada.</p>

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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="state">Estado</Label>
                            <Select value={selectedState} onValueChange={setSelectedState} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {brazilianStates.map(s => <SelectItem key={s.sigla} value={s.sigla}>{s.nome}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="city">Cidade</Label>
                            <Select value={selectedCity} onValueChange={setSelectedCity} required disabled={!selectedState}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
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

    