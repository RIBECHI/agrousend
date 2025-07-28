
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Trash2, Calendar as CalendarIcon, MapPin, Image as ImageIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  location: string;
  imageUrl?: string;
  userId: string;
  createdAt: Timestamp;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const eventsCollection = collection(firestore, 'events');
    const q = query(eventsCollection, orderBy('date', 'asc'));
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setEvents(fetchedEvents);
      setIsLoading(false);
    }, (error) => {
      console.error("Erro ao buscar eventos: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar eventos.",
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

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
    setDate(undefined);
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
    if (!user || !title || !date || !location) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Título, data e local são obrigatórios.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
        const eventData: any = {
            userId: user.uid,
            title,
            description,
            date: Timestamp.fromDate(date),
            location,
            createdAt: serverTimestamp(),
        };

        if (imageFile) {
            eventData.imageUrl = await toBase64(imageFile);
        }

      await addDoc(collection(firestore, 'events'), eventData);

      toast({
        title: "Sucesso!",
        description: "Evento criado com sucesso.",
      });
      
      resetForm();
      setIsSheetOpen(false);

    } catch (error) {
      console.error("Erro ao criar evento: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível criar o evento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteDialog = (eventId: string) => {
    setEventToDelete(eventId);
    setShowDeleteAlert(true);
  }

  const handleDeleteEvent = async (eventId: string | null) => {
    if (!eventId) return;

    try {
        await deleteDoc(doc(firestore, 'events', eventId));
        toast({
            title: "Evento excluído",
            description: "O evento foi removido com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao excluir evento: ", error);
        toast({
            variant: "destructive",
            title: "Erro ao excluir",
            description: "Não foi possível remover o evento.",
        });
    } finally {
        setEventToDelete(null);
        setShowDeleteAlert(false);
    }
  };


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agenda de Eventos</h1>
        <Sheet open={isSheetOpen} onOpenChange={(open) => {
            if(!open) resetForm();
            setIsSheetOpen(open);
        }}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Criar Evento
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>Criar Novo Evento</SheetTitle>
                <SheetDescription>
                  Preencha as informações para divulgar um evento para a comunidade.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 py-6 flex-1 pr-6 overflow-y-auto">
                  <div>
                    <Label htmlFor="title">Título do Evento</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Data do Evento</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="location">Local</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Cidade, Estado ou link do evento online" required />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
                  </div>
                  <div>
                    <Label>Imagem do Evento</Label>
                    {imagePreview ? (
                        <div className="relative mt-2">
                             <Image src={imagePreview} alt="Preview do evento" width={200} height={100} className="rounded-md object-cover w-full aspect-video" />
                             <Button variant="destructive" size="sm" onClick={removeImage} className="absolute top-2 right-2">Remover</Button>
                        </div>
                    ) : (
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-gray-100/25">
                            <div className="text-center">
                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark dark:bg-transparent">
                                    <span>Selecione uma imagem</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                </label>
                                <p className="pl-1 dark:text-gray-400">ou arraste e solte</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">PNG, JPG, GIF até 2MB</p>
                            </div>
                        </div>
                    )}
                  </div>
              </div>
              <SheetFooter className="pt-4 mt-auto">
                <SheetClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader className="mr-2 animate-spin" /> Salvando...</> : 'Salvar Evento'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
         <div className="text-center py-10">
            <Loader className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando eventos...</p>
         </div>
      ) : events.length === 0 ? (
        <Card className="text-center py-10">
            <CardHeader>
                <CardTitle>Nenhum evento agendado</CardTitle>
                <CardDescription>Ainda não há eventos na comunidade. Que tal criar o primeiro?</CardDescription>
            </CardHeader>
             <CardContent>
                <Button onClick={() => setIsSheetOpen(true)}>
                    <PlusCircle className="mr-2"/>
                    Criar Primeiro Evento
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-col overflow-hidden">
                <div className="relative aspect-video bg-muted">
                   <Image 
                        src={event.imageUrl || 'https://placehold.co/600x400.png'} 
                        alt={event.title}
                        fill
                        className="object-cover"
                        data-ai-hint="agriculture event"
                    />
                </div>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 pt-1">
                    <CalendarIcon className="h-4 w-4" />
                    {format(event.date.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </CardDescription>
                 <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
              </CardContent>
              <CardFooter className="flex justify-end">
                {user?.uid === event.userId && (
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(event.id)}>
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Excluir</span>
                    </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o evento.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteEvent(eventToDelete)} className="bg-destructive hover:bg-destructive/90">
                    Excluir
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
