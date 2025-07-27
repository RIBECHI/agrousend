
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
import dynamic from 'next/dynamic';
import { LatLngTuple } from 'leaflet';

const MapWithDraw = dynamic(() => import('@/components/map-with-draw'), { ssr: false });

const initialPlots = [
  {
    id: 1,
    name: 'Talhão 01 - Sede',
    crop: 'Soja',
    area: '150',
    status: 'Plantio',
    geometry: null,
  },
  {
    id: 2,
    name: 'Talhão 02 - Rio',
    crop: 'Milho',
    area: '120',
    status: 'Crescimento',
    geometry: null,
  },
    {
    id: 3,
    name: 'Talhão 03 - Armazém',
    crop: 'Algodão',
    area: '85',
    status: 'Colheita',
    geometry: null,
  },
    {
    id: 4,
    name: 'Talhão 04 - Pasto Novo',
    crop: 'Pasto',
    area: '200',
    status: 'Descanso',
    geometry: null,
  },
];

type Plot = typeof initialPlots[0];

export default function FarmsPage() {
  const [plots, setPlots] = useState(initialPlots);
  const [selectedPlot, setSelectedPlot] = useState<Partial<Plot> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);

  const [mapCenter, setMapCenter] = useState<LatLngTuple>([-15.77972, -47.92972]);
  const [mapZoom, setMapZoom] = useState(4);
  const [drawnLayer, setDrawnLayer] = useState<any>(null);


  const handlePlotChange = (field: keyof Omit<Plot, 'id' | 'status'>, value: string | null) => {
    if (selectedPlot) {
      setSelectedPlot({ ...selectedPlot, [field]: value });
    }
  };
  
  const handleSavePlot = () => {
    if (!selectedPlot || !selectedPlot.name || !selectedPlot.crop || !selectedPlot.area) return;

    if (selectedPlot.id) {
      // Editing existing plot
      setPlots(plots.map(p => p.id === selectedPlot!.id ? { ...p, ...selectedPlot, area: selectedPlot.area || p.area, geometry: drawnLayer || p.geometry } as Plot : p));
    } else {
      // Adding new plot
      const newPlotWithId: Plot = {
        id: plots.length > 0 ? Math.max(...plots.map(p => p.id)) + 1 : 1,
        name: selectedPlot.name,
        crop: selectedPlot.crop,
        area: selectedPlot.area,
        status: 'Planejado',
        geometry: drawnLayer,
      };
      setPlots([...plots, newPlotWithId]);
    }

    closeDialog();
  };

  const handleDrawComplete = (areaInHectares: number, layer: any) => {
    handlePlotChange('area', areaInHectares.toFixed(2));
    setDrawnLayer(layer);
  };
  
  const handleMapStateChange = (center: LatLngTuple, zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  };

  const openDialogForNew = () => {
    setSelectedPlot({ name: '', crop: '', area: '', geometry: null });
    setDrawnLayer(null);
    setIsViewOnly(false);
    setIsDialogOpen(true);
  }
  
  const openDialogForEdit = (plot: Plot) => {
    setSelectedPlot({ ...plot });
    setDrawnLayer(plot.geometry);
    if(plot.geometry) {
        // Simple way to get center of geometry
        const geoJson = L.geoJSON(plot.geometry);
        const center = geoJson.getBounds().getCenter();
        setMapCenter([center.lat, center.lng]);
        setMapZoom(15);
    }
    setIsViewOnly(false);
    setIsDialogOpen(true);
  };

  const openDialogForView = (plot: Plot) => {
    setSelectedPlot({ ...plot });
    setDrawnLayer(plot.geometry);
    if(plot.geometry) {
        // Simple way to get center of geometry
        const geoJson = L.geoJSON(plot.geometry);
        const center = geoJson.getBounds().getCenter();
        setMapCenter([center.lat, center.lng]);
        setMapZoom(15);
    }
    setIsViewOnly(true);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedPlot(null);
    setDrawnLayer(null);
    setIsViewOnly(false);
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Talhões</h1>
          <p className="text-muted-foreground">Gerencie e visualize os talhões da sua fazenda.</p>
        </div>
        <Button size="lg" onClick={openDialogForNew}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Adicionar Novo Talhão
        </Button>
      </div>
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-4xl" onInteractOutside={(e) => e.preventDefault()} onCloseAutoFocus={closeDialog}>
            <DialogHeader>
              <DialogTitle>{isViewOnly ? 'Detalhes do Talhão' : (selectedPlot?.id ? 'Editar Talhão' : 'Adicionar Novo Talhão')}</DialogTitle>
              <DialogDescription>
                {isViewOnly ? 'Visualize os detalhes e o perímetro do talhão no mapa.' : 'Preencha as informações do talhão e desenhe seu perímetro no mapa.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-8 py-4">
              <fieldset disabled={isViewOnly} className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="name">Nome do Talhão</Label>
                      <Input
                        id="name"
                        value={selectedPlot?.name || ''}
                        onChange={(e) => handlePlotChange('name', e.target.value)}
                        placeholder="Ex: Talhão da Estrada"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="crop">Cultura</Label>
                      <Input
                        id="crop"
                        value={selectedPlot?.crop || ''}
                        onChange={(e) => handlePlotChange('crop', e.target.value)}
                        placeholder="Ex: Soja"
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="area">Área (ha)</Label>
                      <Input
                        id="area"
                        type="number"
                        value={selectedPlot?.area || ''}
                        onChange={(e) => handlePlotChange('area', e.target.value)}
                        placeholder="Calculada pelo desenho no mapa"
                        readOnly={isViewOnly || !!drawnLayer}
                      />
                  </div>
              </fieldset>
              <div className="h-[400px] w-full bg-secondary rounded-lg overflow-hidden">
                {isDialogOpen && (
                  <MapWithDraw 
                    onDrawComplete={handleDrawComplete} 
                    onMapStateChange={handleMapStateChange}
                    center={mapCenter}
                    zoom={mapZoom}
                    drawnLayer={drawnLayer}
                    isViewOnly={isViewOnly}
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Fechar</Button>
              {!isViewOnly && <Button onClick={handleSavePlot}>Salvar Talhão</Button>}
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
                  <TableHead>Área (ha)</TableHead>
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
                          <DropdownMenuItem onClick={() => openDialogForView(plot)}>
                            Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDialogForEdit(plot)}>
                            Editar
                          </DropdownMenuItem>
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
