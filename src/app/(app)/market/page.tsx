
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const adItems = [
  {
    id: 1,
    title: 'Trator Valtra A950',
    price: 'R$ 250.000,00',
    category: 'tratores',
    image: 'https://placehold.co/300x200.png',
    imageHint: 'farm tractor',
    location: 'Cascavel, PR',
  },
  {
    id: 2,
    title: 'Sementes de Milho Híbrido',
    price: 'R$ 850,00 / saca',
    category: 'sementes',
    image: 'https://placehold.co/300x200.png',
    imageHint: 'corn seeds',
    location: 'Rio Verde, GO',
  },
  {
    id: 3,
    title: 'Serviço de Colheita',
    price: 'A combinar',
    category: 'servicos',
    image: 'https://placehold.co/300x200.png',
    imageHint: 'harvesting service',
    location: 'Sorriso, MT',
  },
  {
    id: 4,
    title: 'Colheitadeira John Deere S780',
    price: 'R$ 1.200.000,00',
    category: 'tratores',
    image: 'https://placehold.co/300x200.png',
    imageHint: 'combine harvester',
    location: 'Dourados, MS',
  },
  {
    id: 5,
    title: 'Fertilizante NPK 20-05-20',
    price: 'R$ 2.500,00 / ton',
    category: 'fertilizantes',
    image: 'https://placehold.co/300x200.png',
    imageHint: 'fertilizer bags',
    location: 'Luís Eduardo Magalhães, BA',
  },
    {
    id: 6,
    title: 'Arrendamento de Terra',
    price: 'A combinar',
    category: 'outros',
    image: 'https://placehold.co/300x200.png',
    imageHint: 'farmland aerial',
    location: 'Uberaba, MG',
  },
];

export default function MarketPage() {
  return (
    <div className="container mx-auto">
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Anúncios Rurais</h1>
          <p className="text-muted-foreground">Encontre tudo o que você precisa para sua produção.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="O que você está procurando?" className="pl-10" />
          </div>
          <Select>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Categorias</SelectItem>
              <SelectItem value="tratores">Tratores e Máquinas</SelectItem>
              <SelectItem value="sementes">Sementes</SelectItem>
              <SelectItem value="fertilizantes">Fertilizantes</SelectItem>
              <SelectItem value="servicos">Serviços</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
          <Button size="lg">Buscar</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {adItems.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <div className="relative aspect-w-4 aspect-h-3">
                  <Image src={item.image} alt={item.title} layout="fill" objectFit="cover" data-ai-hint={item.imageHint}/>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <CardTitle className="text-lg font-semibold mb-2">{item.title}</CardTitle>
                <p className="text-primary font-bold text-xl">{item.price}</p>
                <p className="text-sm text-muted-foreground mt-2">{item.location}</p>
              </CardContent>
              <CardFooter className="p-4 bg-secondary/50">
                <Button className="w-full" size="lg">Ver Detalhes</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
