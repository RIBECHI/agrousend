import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin } from 'lucide-react';

const events = [
  {
    id: 1,
    title: 'Agrishow 2024',
    date: '29 de Abril a 03 de Maio',
    location: 'Ribeirão Preto, SP',
    description: 'A maior feira de tecnologia agrícola da América Latina. Conecte-se com as últimas inovações do setor.',
    image: 'https://placehold.co/400x250.png',
    imageHint: 'agriculture trade show',
  },
  {
    id: 2,
    title: 'Show Rural Coopavel',
    date: '05 a 09 de Fevereiro',
    location: 'Cascavel, PR',
    description: 'Um universo de conhecimento e tecnologia para o agronegócio, com foco em aumentar a produtividade no campo.',
    image: 'https://placehold.co/400x250.png',
    imageHint: 'farm machinery exhibition',
  },
  {
    id: 3,
    title: 'Expodireto Cotrijal',
    date: '04 a 08 de Março',
    location: 'Não-Me-Toque, RS',
    description: 'A feira internacional que apresenta as principais tendências e tecnologias para o agronegócio mundial.',
    image: 'https://placehold.co/400x250.png',
    imageHint: 'agriculture conference',
  },
];

export default function EventsPage() {
  return (
    <div className="container mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Eventos e Feiras Agrícolas</h1>
        <p className="text-muted-foreground">Fique por dentro dos principais eventos do agronegócio.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <Card key={event.id} className="overflow-hidden flex flex-col group">
            <CardHeader className="p-0 relative h-48">
              <Image
                src={event.image}
                alt={event.title}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={event.imageHint}
              />
            </CardHeader>
            <CardContent className="p-6 flex-grow">
              <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{event.location}</span>
                </div>
              </div>
              <CardDescription className="mt-4">{event.description}</CardDescription>
            </CardContent>
            <CardFooter className="p-6 bg-secondary/50">
              <Button size="lg" className="w-full">
                Tenho Interesse
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
