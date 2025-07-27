

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, BarChart2, Settings, Palette, Type, Moon, Sun } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const colorOptions = [
    { name: 'green', value: '142 60% 35%', darkValue: '142 60% 45%' },
    { name: 'blue', value: '221 83% 53%', darkValue: '221 83% 63%' },
    { name: 'red', value: '0 84% 60%', darkValue: '0 84% 70%' },
    { name: 'orange', value: '25 95% 53%', darkValue: '25 95% 63%' },
];

const fontOptions = [
    { name: 'Roboto', value: 'roboto' },
    { name: 'Inter', value: 'inter' },
    { name: 'Lato', value: 'lato' },
];

export default function AdminPage() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [accentColor, setAccentColor] = useState(colorOptions[0].name);
    const [font, setFont] = useState(fontOptions[0].value);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                setIsDarkMode(savedTheme === 'dark');
            }
            const savedColor = localStorage.getItem('accentColor');
            if (savedColor) {
                setAccentColor(savedColor);
            }
            const savedFont = localStorage.getItem('font');
            if (savedFont) {
                setFont(savedFont);
            }
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    useEffect(() => {
        const root = document.documentElement;
        const selectedColor = colorOptions.find(c => c.name === accentColor);
        if (selectedColor) {
            const colorValue = isDarkMode ? selectedColor.darkValue : selectedColor.value;
            root.style.setProperty('--primary', colorValue);
            localStorage.setItem('accentColor', accentColor);
        }
    }, [accentColor, isDarkMode]);
    
    useEffect(() => {
        document.body.classList.remove(...fontOptions.map(f => `font-${f.value}`));
        document.body.classList.add(`font-${font}`);
        localStorage.setItem('font', font);
    }, [font]);

  return (
    <div className="container mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Painel do Administrador</h1>
        <p className="text-muted-foreground">Gerencie usuários, conteúdo e configurações do site.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerenciamento de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,254</div>
            <p className="text-xs text-muted-foreground">Total de usuários cadastrados</p>
          </CardContent>
          <CardFooter>
            <Button>Ver Usuários</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderação de Conteúdo</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">Itens pendentes de revisão</p>
          </CardContent>
           <CardFooter>
            <Button>Revisar Conteúdo</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análises do Site</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+25%</div>
            <p className="text-xs text-muted-foreground">Crescimento de novos usuários este mês</p>
          </CardContent>
           <CardFooter>
            <Button>Ver Análises</Button>
          </CardFooter>
        </Card>
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Personalização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Moon className="h-4 w-4" /><Sun className="h-4 w-4" /> Tema</Label>
              <div className="flex items-center space-x-2">
                <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                <Label htmlFor="dark-mode">Modo Escuro</Label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Palette className="h-4 w-4" /> Cor de Destaque</Label>
              <div className="flex gap-2">
                  <Button variant={accentColor === 'green' ? 'default' : 'outline'} size="icon" className="h-8 w-8 rounded-full bg-primary" onClick={() => setAccentColor('green')}></Button>
                  <Button variant={accentColor === 'blue' ? 'default' : 'outline'} size="icon" className="h-8 w-8 rounded-full bg-blue-600" onClick={() => setAccentColor('blue')}></Button>
                  <Button variant={accentColor === 'red' ? 'default' : 'outline'} size="icon" className="h-8 w-8 rounded-full bg-red-600" onClick={() => setAccentColor('red')}></Button>
                  <Button variant={accentColor === 'orange' ? 'default' : 'outline'} size="icon" className="h-8 w-8 rounded-full bg-orange-500" onClick={() => setAccentColor('orange')}></Button>
              </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="font-select" className="flex items-center gap-2"><Type className="h-4 w-4" /> Fonte</Label>
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger id="font-select">
                  <SelectValue placeholder="Selecione a fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

