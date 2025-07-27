
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import dynamic from 'next/dynamic';

const MapWithDraw = dynamic(() => import('@/components/map-with-draw'), {
  ssr: false,
});

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
  const [mapKey, setMapKey] = useState(Date.now()); // State for the map key

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

  const handleOpenDialog = () => {
    setMapKey(Date.now()); // Change the key every time the dialog opens
    setIsDialogOpen(true);
  }
  
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Talhões</h1>
          <p className="text-muted-foreground">Gerencie e visualize os talhões da sua fazenda.</p>
        </div>
        <Button size="lg" onClick={handleOpenDialog}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Adicionar Novo Talhão
        </Button>
      </div>
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Talhão</DialogTitle>
              <DialogDescription>
                Preencha as informações e desenhe o perímetro do talhão no mapa.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
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
                <div className="h-[400px] w-full bg-secondary rounded-lg">
                  {isDialogOpen && <MapWithDraw key={mapKey} />}
                </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPlot}>Salvar Talhão</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Talhões</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cultura</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Status</TableHead>
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
                          <DropdownMenuItem>Ver no Mapa</DropdownMenuItem>
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
