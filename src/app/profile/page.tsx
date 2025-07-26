import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, MapPin, Wheat, Tractor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const profileData = {
  name: 'João da Silva',
  avatar: 'https://placehold.co/128x128.png',
  coverImage: 'https://placehold.co/1200x300.png',
  coverImageHint: 'farm landscape',
  farmName: 'Fazenda Vista Verde',
  location: 'Cascavel, Paraná',
  bio: 'Produtor de soja e milho há mais de 20 anos. Apaixonado por tecnologia no campo e em busca de práticas sustentáveis.',
  crops: ['Soja', 'Milho', 'Trigo'],
  interests: ['Agricultura de Precisão', 'Sustentabilidade', 'Gado de Corte'],
  connections: 245,
  posts: 42,
};

export default function ProfilePage() {
  return (
    <div className="container mx-auto max-w-5xl">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="relative h-48 w-full bg-secondary">
            <Image
              src={profileData.coverImage}
              alt="Cover image"
              layout="fill"
              objectFit="cover"
              data-ai-hint={profileData.coverImageHint}
            />
            <div className="absolute top-4 right-4">
              <Button variant="secondary" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="flex items-end -mt-16 space-x-6">
              <Avatar className="h-32 w-32 border-4 border-card ring-2 ring-primary">
                <AvatarImage src={profileData.avatar} />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-2">
                <CardTitle className="text-3xl">{profileData.name}</CardTitle>
                <p className="text-muted-foreground">{profileData.farmName}</p>
              </div>
              <Button size="lg">Editar Perfil</Button>
            </div>
            <p className="mt-4 text-muted-foreground">{profileData.bio}</p>
            <div className="flex items-center space-x-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center"><MapPin className="h-4 w-4 mr-1 text-primary"/> {profileData.location}</div>
                <div className="flex items-center"><strong>{profileData.connections}</strong><span className="ml-1">Conexões</span></div>
                <div className="flex items-center"><strong>{profileData.posts}</strong><span className="ml-1">Publicações</span></div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Publicações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Em breve, suas publicações aparecerão aqui.</p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Fazenda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold flex items-center"><Wheat className="h-4 w-4 mr-2 text-primary"/>Tipo de Cultivo</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profileData.crops.map(crop => <Badge key={crop} variant="secondary">{crop}</Badge>)}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold flex items-center"><Tractor className="h-4 w-4 mr-2 text-primary"/>Interesses</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profileData.interests.map(interest => <Badge key={interest} variant="secondary">{interest}</Badge>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
