
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const inventoryItems = [
  { id: 1, name: 'Semente de Soja XPTO', category: 'Sementes', quantity: 500, unit: 'Sacos', status: 'Em Estoque' },
  { id: 2, name: 'Herbicida Glifosato', category: 'Defensivos', quantity: 100, unit: 'Litros', status: 'Em Estoque' },
  { id: 3, name: 'Adubo NPK 10-20-10', category: 'Fertilizantes', quantity: 20, unit: 'Toneladas', status: 'Nível Baixo' },
  { id: 4, name: 'Óleo para Motor Diesel', category: 'Peças e Manutenção', quantity: 50, unit: 'Litros', status: 'Em Estoque' },
  { id: 5, name: 'Ração para Gado', category: 'Ração', quantity: 15, unit: 'Sacos', status: 'Nível Crítico' },
];

export default function InventoryPage() {
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gerencie todos os insumos e produtos da sua fazenda.</p>
        </div>
        <div className="flex gap-2">
           <Button size="lg" variant="outline">
            <ArrowUpCircle className="mr-2 h-5 w-5" />
            Registrar Entrada
          </Button>
          <Button size="lg" variant="outline">
            <ArrowDownCircle className="mr-2 h-5 w-5" />
            Registrar Saída
          </Button>
          <Button size="lg">
            <PlusCircle className="mr-2 h-5 w-5" />
            Adicionar Novo Item
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Item</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'Em Estoque' ? 'default' : item.status === 'Nível Baixo' ? 'secondary' : 'destructive'}>
                      {item.status}
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
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                        <DropdownMenuItem>Editar Item</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Excluir Item</DropdownMenuItem>
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
