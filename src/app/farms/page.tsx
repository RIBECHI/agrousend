
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, PlusCircle } from 'lucide-react';

const initialPlots = [
  {
    id: 1,
    name: 'Talhão 01 - Sede',
    crop: 'Soja',
    area: '150 ha',
    status: 'Plantio',
  },
  {
    id: 2,
    name: 'Talhão 02 - Rio',
    crop: 'Milho',
    area: '120 ha',
    status: 'Crescimento',
  },
    {
    id: 3,
    name: 'Talhão 03 - Armazém',
    crop: 'Algodão',
    area: '85 ha',
    status: 'Colheita',
  },
    {
    id: 4,
    name: 'Talhão 04 - Pasto Novo',
    crop: 'Pasto',
    area: '200 ha',
    status: 'Descanso',
  },
];

export default function FarmsPage() {
  const [plots, setPlots] = useState(initialPlots);
  const [newPlot, setNewPlot] = useState({ name: '', crop: '', area: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddPlot = () => {
    if (newPlot.name && newPlot.crop && newPlot.area) {
      setPlots([
        ...plots,
        {
          id: plots.length + 1,
          ...newPlot,
          area: `${newPlot.area} ha`,
          status: 'Planejado',
        },
      ]);
      setNewPlot({ name: '', crop: '', area: '' });
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Talhões</h1>
          <p className="text-muted-foreground">Gerencie os talhões da sua fazenda.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <PlusCircle className="mr-2 h-5 w-5" />
              Adicionar Novo Talhão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Talhão</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para cadastrar um novo talhão.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={newPlot.name}
                  onChange={(e) => setNewPlot({ ...newPlot, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Ex: Talhão da Estrada"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="crop" className="text-right">
                  Cultura
                </Label>
                <Input
                  id="crop"
                  value={newPlot.crop}
                  onChange={(e) => setNewPlot({ ...newPlot, crop: e.target.value })}
                  className="col-span-3"
                  placeholder="Ex: Soja"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="area" className="text-right">
                  Área (ha)
                </Label>
                <Input
                  id="area"
                  type="number"
                  value={newPlot.area}
                  onChange={(e) => setNewPlot({ ...newPlot, area: e.target.value })}
                  className="col-span-3"
                  placeholder="Ex: 150"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPlot}>Salvar Talhão</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Talhão</TableHead>
                <TableHead>Cultura</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Status Atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plots.map((plot) => (
                <TableRow key={plot.id}>
                  <TableCell className="font-medium">{plot.name}</TableCell>
                  <TableCell>{plot.crop}</TableCell>
                  <TableCell>{plot.area}</TableCell>
                  <TableCell>
                    <Badge variant={plot.status === 'Colheita' ? 'default' : 'secondary'}>
                      {plot.status}
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
