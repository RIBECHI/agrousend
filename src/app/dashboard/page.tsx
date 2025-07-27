
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ArrowUp, ArrowDown, DollarSign, Bean, Beef } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const chartData = [
  { month: 'Janeiro', price: 140 },
  { month: 'Fevereiro', price: 145 },
  { month: 'Março', price: 138 },
  { month: 'Abril', price: 152 },
  { month: 'Maio', price: 155 },
  { month: 'Junho', price: 160 },
];

const chartConfig = {
  price: {
    label: "Preço (R$)",
    color: "hsl(var(--primary))",
  },
};

export default function DashboardPage() {
  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Cotações</h1>
          <p className="text-muted-foreground">Acompanhe as principais cotações do mercado agro.</p>
        </div>
        <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Atualizado há 5 minutos</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dólar Americano</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 5,42</div>
            <div className="flex items-center text-sm text-green-500">
              <ArrowUp className="h-4 w-4 mr-1" />
              <span>+0.8%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Soja (Saca 60kg)</CardTitle>
            <Bean className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 135,70</div>
            <div className="flex items-center text-sm text-red-500">
              <ArrowDown className="h-4 w-4 mr-1" />
              <span>-1.2%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boi Gordo (@)</CardTitle>
            <Beef className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 225,50</div>
            <div className="flex items-center text-sm text-green-500">
              <ArrowUp className="h-4 w-4 mr-1" />
              <span>+0.5%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Histórico de Preços</CardTitle>
              <CardDescription>Variação do preço da Soja nos últimos 6 meses</CardDescription>
            </div>
            <Select defaultValue="soja">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecionar commodity" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="dolar">Dólar</SelectItem>
                    <SelectItem value="soja">Soja</SelectItem>
                    <SelectItem value="boi">Boi Gordo</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0}/>
                  </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => `R$${value}`} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Area 
                dataKey="price" 
                type="monotone" 
                stroke="var(--color-price)" 
                fill="url(#colorPrice)" 
                strokeWidth={2}
                dot={true} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  );
}
