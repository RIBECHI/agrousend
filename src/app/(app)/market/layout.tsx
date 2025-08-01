
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
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useState, useCallback, useEffect } from 'react';
import { Loader, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import { brazilianStates } from '@/lib/brazilian-locations';

interface Listing {
  id: string;
  userId: string;
  authorName: string;
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  imageUrls: string[];
  createdAt: any;
  status?: 'active' | 'sold';
  // Campos específicos da categoria
  brand?: string;
  year?: number;
  hours?: number;
  hectares?: number;
  mileage?: number;
  aptitude?: string;
  subtype?: string;
}


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

const categories = ['Fazendas', 'Maquinas', 'Caminhoes', 'Implementos', 'Insumos', 'Graos'];
const farmAptitudes = ['Agricultura', 'Pecuária', 'Mista', 'Reflorestamento'];
const inputSubtypes = ['Sementes', 'Fertilizantes', 'Defensivos', 'Outros'];
const grainSubtypes = ['Soja', 'Milho', 'Trigo', 'Café', 'Algodão', 'Outros'];

export const CreateListingSheet = ({ isSheetOpen, setIsSheetOpen, editingListing, onListingUpdated }: { isSheetOpen: boolean, setIsSheetOpen: (open: boolean) => void, editingListing?: Listing | null, onListingUpdated?: () => void }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // Campos comuns
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Campos específicos
    const [brand, setBrand] = useState('');
    const [year, setYear] = useState('');
    const [hours, setHours] = useState('');
    const [hectares, setHectares] = useState('');
    const [mileage, setMileage] = useState('');
    const [aptitude, setAptitude] = useState('');
    const [subtype, setSubtype] = useState('');

    const MAX_IMAGES = 5;

    // Location state
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [cities, setCities] = useState<string[]>([]);

    const isEditing = !!editingListing;

    const compressImage = async (file: File, quality = 0.7, maxSizeMB = 0.5): Promise<File> => {
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size <= maxSize && file.type === 'image/jpeg') {
            return file;
        }

        return new Promise((resolve, reject) => {
            const image = new window.Image();
            image.src = URL.createObjectURL(file);
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    return reject(new Error('Não foi possível obter o contexto do canvas.'));
                }

                let { width, height } = image;
                const MAX_WIDTH_HEIGHT = 1280;
                if (width > height) {
                    if (width > MAX_WIDTH_HEIGHT) {
                        height *= MAX_WIDTH_HEIGHT / width;
                        width = MAX_WIDTH_HEIGHT;
                    }
                } else {
                    if (height > MAX_WIDTH_HEIGHT) {
                        width *= MAX_WIDTH_HEIGHT / height;
                        height = MAX_WIDTH_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(image, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            if (blob.size > maxSize) {
                                return reject(new Error(`A imagem é muito grande mesmo após a compressão (${(blob.size / 1024 / 1024).toFixed(2)}MB).`));
                            }
                            const newFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(newFile);
                        } else {
                            reject(new Error('Falha ao criar o blob da imagem.'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            image.onerror = reject;
        });
    };

    const resetForm = useCallback(() => {
        setTitle('');
        setDescription('');
        setPrice('');
        setCategory('');
        setYear('');
        setHours('');
        setHectares('');
        setMileage('');
        setBrand('');
        setAptitude('');
        setSubtype('');
        setSelectedState('');
        setSelectedCity('');
        setCities([]);
        setImageFiles([]);
        setImagePreviews([]);
        setIsSubmitting(false);
    }, []);

    useEffect(() => {
      if (isEditing && editingListing) {
          // Preenche campos comuns
          setTitle(editingListing.title);
          setDescription(editingListing.description);
          setPrice(editingListing.price.toString());
          setCategory(editingListing.category);
          setImagePreviews(editingListing.imageUrls);
          setImageFiles([]); // Clear old files on edit
          
          // Preenche campos de localização
          const [city, state] = editingListing.location.split(', ');
          if (state) {
            const stateData = brazilianStates.find(s => s.sigla === state);
            if(stateData) {
              setCities(stateData.cidades);
              setSelectedState(state);
            }
          }
          if(city) setSelectedCity(city);
          
          // Preenche campos específicos da categoria
          setBrand(editingListing.brand || '');
          setYear(editingListing.year?.toString() || '');
          setHours(editingListing.hours?.toString() || '');
          setHectares(editingListing.hectares?.toString() || '');
          setMileage(editingListing.mileage?.toString() || '');
          setAptitude(editingListing.aptitude || '');
          setSubtype(editingListing.subtype || '');

      } else {
        resetForm();
      }
    }, [editingListing, isEditing, resetForm]);


    useEffect(() => {
        if (selectedState) {
            const stateData = brazilianStates.find(s => s.sigla === selectedState);
            setCities(stateData ? stateData.cidades : []);
            if (!isEditing || (editingListing && selectedState !== editingListing.location.split(', ')[1])) {
              setSelectedCity('');
            }
        } else {
            setCities([]);
        }
    }, [selectedState, isEditing, editingListing]);

    const removeImage = useCallback((index: number) => {
        const previewToRemove = imagePreviews[index];
        
        if (previewToRemove.startsWith('blob:')) {
            const fileIndex = imagePreviews.filter(p => p.startsWith('blob:')).indexOf(previewToRemove);
            if(fileIndex > -1) {
              setImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
            }
        }
        
        setImagePreviews(prev => prev.filter((_, i) => i !== index));

    }, [imagePreviews]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const totalImages = imagePreviews.length + files.length;

            if (totalImages > MAX_IMAGES) {
                toast({
                    variant: "destructive",
                    title: `Limite de ${MAX_IMAGES} imagens excedido`,
                    description: `Você só pode enviar até ${MAX_IMAGES} imagens por anúncio.`,
                });
                return;
            }
            
            try {
                const compressedFiles = await Promise.all(files.map(file => compressImage(file)));
                const newFiles = [...imageFiles, ...compressedFiles];
                setImageFiles(newFiles);
    
                const newPreviewsFromFiles = compressedFiles.map(file => URL.createObjectURL(file));
                setImagePreviews(prev => [...prev, ...newPreviewsFromFiles]);
            } catch (error: any) {
                 toast({
                    variant: "destructive",
                    title: "Erro ao processar imagem",
                    description: error.message || "Não foi possível comprimir a imagem.",
                });
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title || !price || !category || !selectedState || !selectedCity || imagePreviews.length === 0) {
            toast({
                variant: "destructive",
                title: "Campos obrigatórios",
                description: "Título, Preço, Categoria, Localização e ao menos uma Imagem são obrigatórios.",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const newImageUrls = await Promise.all(
                imageFiles.map(file => toBase64(file))
            );
            
            const existingImageUrls = isEditing ? editingListing.imageUrls.filter(url => imagePreviews.includes(url)) : [];
            const finalImageUrls = [...existingImageUrls, ...newImageUrls];


            const listingData: Omit<Listing, 'id' | 'createdAt' | 'userId' | 'authorName'> & { userId?: string, authorName?: string, createdAt?: any } = {
                title,
                description,
                price: parseFloat(price),
                category,
                location: `${selectedCity}, ${selectedState}`,
                imageUrls: finalImageUrls,
                status: editingListing?.status || 'active',
            };

            // Adiciona campos específicos baseados na categoria
            if (brand) listingData.brand = brand;
            if (year) listingData.year = parseInt(year);
            if (subtype) listingData.subtype = subtype;
            if (aptitude) listingData.aptitude = aptitude;
            if (hours) listingData.hours = parseInt(hours);
            if (hectares) listingData.hectares = parseInt(hectares);
            if (mileage) listingData.mileage = parseInt(mileage);


            if(isEditing) {
              const docRef = doc(firestore, 'listings', editingListing.id);
              await updateDoc(docRef, listingData);
              toast({ title: "Sucesso!", description: "Anúncio atualizado." });
              if(onListingUpdated) onListingUpdated();
            } else {
              listingData.userId = user.uid;
              listingData.authorName = user.displayName || '';
              listingData.createdAt = serverTimestamp();
              await addDoc(collection(firestore, 'listings'), listingData);
              toast({ title: "Sucesso!", description: "Anúncio publicado." });
            }

            resetForm();
            setIsSheetOpen(false);

        } catch (error) {
            console.error("Erro ao salvar anúncio: ", error);
            toast({
                variant: "destructive",
                title: `Erro ao ${isEditing ? 'atualizar' : 'publicar'}`,
                description: `Não foi possível salvar o anúncio.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderCategorySpecificFields = () => {
        switch (category) {
            case 'Fazendas':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="aptitude">Aptidão</Label>
                            <Select value={aptitude} onValueChange={setAptitude}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    {farmAptitudes.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="hectares">Hectares (ha)</Label>
                            <Input id="hectares" type="number" value={hectares} onChange={(e) => setHectares(e.target.value)} placeholder="Ex: 500" />
                        </div>
                    </div>
                );
            case 'Maquinas':
                return (
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="brand">Marca</Label>
                            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: John Deere" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label htmlFor="year">Ano</Label>
                                <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ex: 2020" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="hours">Horas de uso</Label>
                                <Input id="hours" type="number" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Ex: 1500" />
                            </div>
                        </div>
                    </>
                );
            case 'Caminhoes':
                return (
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="brand">Marca</Label>
                            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Scania" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label htmlFor="year">Ano</Label>
                                <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ex: 2022" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="mileage">Quilometragem</Label>
                                <Input id="mileage" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="Ex: 80000" />
                            </div>
                        </div>
                    </>
                );
            case 'Implementos':
                return (
                    <>
                        <div className="space-y-1">
                            <Label htmlFor="brand">Marca</Label>
                            <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ex: Tatu" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="year">Ano</Label>
                            <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ex: 2023" />
                        </div>
                    </>
                );
            case 'Insumos':
                 return (
                    <div className="space-y-1">
                        <Label htmlFor="subtype">Tipo de Insumo</Label>
                        <Select value={subtype} onValueChange={setSubtype}>
                            <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                            <SelectContent>
                                {inputSubtypes.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'Graos':
                 return (
                    <div className="space-y-1">
                        <Label htmlFor="subtype">Tipo de Grão</Label>
                        <Select value={subtype} onValueChange={setSubtype}>
                            <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                            <SelectContent>
                                {grainSubtypes.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if (!open) {
                resetForm();
                if (onListingUpdated) onListingUpdated();
            };
            setIsSheetOpen(open);
        }}>
           {/* O SheetTrigger é gerenciado externamente agora */}
            <SheetContent className="w-full sm:max-w-lg">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>{isEditing ? 'Editar Anúncio' : 'Criar Novo Anúncio'}</SheetTitle>
                    <SheetDescription>
                    {isEditing ? 'Altere as informações do seu anúncio.' : 'Preencha as informações para vender um item no marketplace.'}
                    </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                    <div className="space-y-2">
                        <Label>Imagens (até {MAX_IMAGES})</Label>
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
                             {imagePreviews.length < MAX_IMAGES && (
                                <div className="flex items-center justify-center aspect-square rounded-lg border border-dashed border-gray-900/25 dark:border-gray-100/25">
                                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center text-center cursor-pointer text-gray-600 hover:text-primary">
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                        <span className="mt-2 text-sm">Adicionar</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple/>
                                    </label>
                                </div>
                             )}
                        </div>
                        <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG, GIF até 0.5MB cada.</p>

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
                    
                    {renderCategorySpecificFields()}

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
                    {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : isEditing ? 'Salvar Alterações' : 'Publicar Anúncio'}
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
        <main className="flex-1 overflow-y-auto pb-20">
            {children}
        </main>
        
        <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur-sm">
            <nav className="flex items-center justify-around h-16">
            {navItems.map((item) => {
                if (item.isSheetTrigger) {
                    return (
                        <button
                            key={item.href}
                            onClick={() => setIsSheetOpen(true)}
                            className={cn('flex flex-col items-center justify-center text-xs gap-1 transition-colors w-full h-full text-muted-foreground hover:text-primary')}
                        >
                            <PlusCircle className="h-6 w-6" />
                            <span>Vender</span>
                        </button>
                    )
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
        <CreateListingSheet isSheetOpen={isSheetOpen} setIsSheetOpen={setIsSheetOpen} />
    </div>
  );
}
