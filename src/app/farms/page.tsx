
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle } from 'lucide-react';

const farms = [
  {
    id: 1,
    name: 'Fazenda Vista Verde',
    location: 'Cascavel, PR',
    owner: 'João da Silva',
    status: 'Ativa',
  },
  {
    id: 2,
    name: 'Sítio Boa Esperança',
    location: 'Rio Verde, GO',
    owner: 'Maria Oliveira',
    status: 'Ativa',
  },
    {
    id: 3,
    name: 'Agropecuária Sul',
    location: 'Dourados, MS',
    owner: 'Carlos Pereira',
    status: 'Inativa',
  },
    {
    id: 4,
    name: 'Fazenda Nova Fronteira',
    location: 'Sorriso, MT',
    owner: 'José Almeida',
    status: 'Ativa',
  },
];

export default function FarmsPage() {
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Fazendas</h1>
          <p className="text-muted-foreground">Gerencie as fazendas cadastradas no sistema.</p>
        </div>
        <Button size="lg">
          <PlusCircle className="mr-2 h-5 w-5" />
          Adicionar Nova Fazenda
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Fazenda</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farms.map((farm) => (
                <TableRow key={farm.id}>
                  <TableCell className="font-medium">{farm.name}</TableCell>
                  <TableCell>{farm.location}</TableCell>
                  <TableCell>{farm.owner}</TableCell>
                  <TableCell>
                    <Badge variant={farm.status === 'Ativa' ? 'default' : 'destructive'}>
                      {farm.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
